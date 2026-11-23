const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { calculateBill, GST_RATE } = require('../utils/billing');
const { nightsBetween, eachNight } = require('../utils/dates');

const STATUSES = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

const BOOKING_SELECT = `
  SELECT b.id, b.guest_id, g.name AS guest_name, g.phone, g.email,
         b.room_type_id, rt.name AS room_type,
         b.check_in, b.check_out, b.nights, b.status,
         b.price_per_night, b.room_charges, b.gst_amount, b.total_amount, b.created_at
  FROM bookings b
  JOIN guests g      ON g.id  = b.guest_id
  JOIN room_types rt ON rt.id = b.room_type_id`;

// A room is free only if, on EVERY night of the stay, fewer than total_rooms are occupied by CONFIRMED or CHECKED_IN bookings
const hasRoomForAllNights = (overlapping, checkIn, checkOut, totalRooms) =>
  eachNight(checkIn, checkOut).every((night) => {
    const occupied = overlapping.filter((b) => b.check_in <= night && b.check_out > night).length;
    return occupied < totalRooms;
  });

const getAll = async ({ status } = {}) => {
  let sql = BOOKING_SELECT;
  const params = [];

  if (status) {
    const s = String(status).toUpperCase();
    if (!STATUSES.includes(s)) throw new AppError(`Status must be one of: ${STATUSES.join(', ')}`, 400);
    sql += ' WHERE b.status = ?';
    params.push(s);
  }

  sql += ' ORDER BY b.created_at DESC, b.id DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const getById = async (id) => {
  const [rows] = await pool.execute(`${BOOKING_SELECT} WHERE b.id = ?`, [id]);
  if (rows.length === 0) throw new AppError('Booking not found', 404);
  return rows[0];
};

const checkAvailability = async (roomTypeId, checkIn, checkOut) => {
  const [roomTypes] = await pool.execute(
    'SELECT id, name, price_per_night, total_rooms FROM room_types WHERE id = ?',
    [roomTypeId]
  );
  if (roomTypes.length === 0) throw new AppError('Room type not found', 404);
  const roomType = roomTypes[0];

  const [overlapping] = await pool.execute(
    `SELECT check_in, check_out FROM bookings
     WHERE room_type_id = ? AND status IN ('CONFIRMED', 'CHECKED_IN')
       AND check_in < ? AND check_out > ?`,
    [roomTypeId, checkOut, checkIn]
  );

  const nights = eachNight(checkIn, checkOut);
  let maxOccupied = 0;
  for (const night of nights) {
    const occupiedOnNight = overlapping.filter((b) => b.check_in <= night && b.check_out > night).length;
    if (occupiedOnNight > maxOccupied) {
      maxOccupied = occupiedOnNight;
    }
  }

  const availableRooms = Math.max(0, roomType.total_rooms - maxOccupied);
  return {
    room_type_id: roomType.id,
    room_type: roomType.name,
    total_rooms: roomType.total_rooms,
    max_occupied_during_stay: maxOccupied,
    available_rooms: availableRooms,
    is_available: availableRooms > 0,
  };
};

const create = async ({ guest_name, phone, email, room_type_id, check_in, check_out }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the room type row so two staff members can't book the last room at the same time
    const [roomTypes] = await conn.execute(
      'SELECT id, price_per_night, total_rooms FROM room_types WHERE id = ? FOR UPDATE',
      [room_type_id]
    );
    if (roomTypes.length === 0) throw new AppError('Room type not found', 404);
    const roomType = roomTypes[0];

    // Active bookings (CONFIRMED or CHECKED_IN) that overlap the requested dates
    const [overlapping] = await conn.execute(
      `SELECT check_in, check_out FROM bookings
       WHERE room_type_id = ? AND status IN ('CONFIRMED', 'CHECKED_IN')
         AND check_in < ? AND check_out > ?`,
      [room_type_id, check_out, check_in]
    );

    if (!hasRoomForAllNights(overlapping, check_in, check_out, roomType.total_rooms)) {
      throw new AppError('No rooms of this type are available for the selected dates', 409);
    }

    // Reuse the guest if the phone number already exists, otherwise create
    const [guestResult] = await conn.execute(
      `INSERT INTO guests (name, phone, email) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), id = LAST_INSERT_ID(id)`,
      [guest_name, phone, email]
    );

    const nights = nightsBetween(check_in, check_out);
    const { roomCharges, gstAmount, totalAmount } = calculateBill(roomType.price_per_night, nights);

    const [bookingResult] = await conn.execute(
      `INSERT INTO bookings
         (guest_id, room_type_id, check_in, check_out, nights,
          price_per_night, room_charges, gst_amount, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [guestResult.insertId, room_type_id, check_in, check_out, nights,
       roomType.price_per_night, roomCharges, gstAmount, totalAmount]
    );

    await conn.commit();
    return getById(bookingResult.insertId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getBill = async (id) => {
  const [rows] = await pool.execute(
    `SELECT b.id AS booking_id, g.name AS guest_name, g.phone, g.email, rt.name AS room_type,
            b.check_in, b.check_out, b.nights, b.status,
            b.price_per_night, b.room_charges, b.gst_amount, b.total_amount
     FROM bookings b
     JOIN guests g      ON g.id  = b.guest_id
     JOIN room_types rt ON rt.id = b.room_type_id
     WHERE b.id = ?`,
    [id]
  );
  if (rows.length === 0) throw new AppError('Booking not found', 404);
  return { ...rows[0], gst_rate_percent: Math.round(GST_RATE * 100) };
};

// Transition: CONFIRMED -> CHECKED_IN
const checkIn = async (id) => {
  const booking = await getById(id);
  if (booking.status === 'CHECKED_IN') throw new AppError('Guest is already checked in', 400);
  if (booking.status === 'CHECKED_OUT') throw new AppError('Guest has already checked out', 400);
  if (booking.status === 'CANCELLED') throw new AppError('Cannot check in a cancelled booking', 400);

  await pool.execute("UPDATE bookings SET status = 'CHECKED_IN' WHERE id = ?", [id]);
  return getById(id);
};

// Transition: CHECKED_IN -> CHECKED_OUT
const checkOut = async (id) => {
  const booking = await getById(id);
  if (booking.status === 'CHECKED_OUT') throw new AppError('Guest has already checked out', 400);
  if (booking.status === 'CANCELLED') throw new AppError('Cannot check out a cancelled booking', 400);
  if (booking.status === 'CONFIRMED') throw new AppError('Guest must be checked in before checkout', 400);

  await pool.execute("UPDATE bookings SET status = 'CHECKED_OUT' WHERE id = ?", [id]);
  return getById(id);
};

// Transition: CONFIRMED -> CANCELLED
const cancel = async (id) => {
  const booking = await getById(id);
  if (booking.status === 'CANCELLED') throw new AppError('Booking is already cancelled', 400);
  if (booking.status === 'CHECKED_OUT') throw new AppError('Completed bookings cannot be cancelled', 400);
  if (booking.status === 'CHECKED_IN') throw new AppError('Guest has already checked in. Check them out instead of cancelling', 400);

  await pool.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = ? AND status = 'CONFIRMED'", [id]);
  return getById(id);
};

const updateStatus = async (id, newStatus) => {
  const targetStatus = String(newStatus).toUpperCase();
  if (!STATUSES.includes(targetStatus)) {
    throw new AppError(`Status must be one of: ${STATUSES.join(', ')}`, 400);
  }

  if (targetStatus === 'CHECKED_IN') return checkIn(id);
  if (targetStatus === 'CHECKED_OUT') return checkOut(id);
  if (targetStatus === 'CANCELLED') return cancel(id);

  // If restoring to CONFIRMED
  const booking = await getById(id);
  if (booking.status === targetStatus) return booking;
  await pool.execute("UPDATE bookings SET status = 'CONFIRMED' WHERE id = ?", [id]);
  return getById(id);
};

module.exports = {
  getAll,
  getById,
  create,
  getBill,
  checkIn,
  checkOut,
  cancel,
  updateStatus,
  checkAvailability,
};
