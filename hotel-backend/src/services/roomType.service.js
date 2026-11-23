const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { today } = require('../utils/dates');

const getAll = async () => {
  const t = today();
  const [rows] = await pool.execute(`
    SELECT 
      rt.id, 
      rt.name, 
      rt.price_per_night, 
      rt.total_rooms,
      COALESCE(act.occupied_count, 0) AS occupied_rooms,
      GREATEST(0, rt.total_rooms - COALESCE(act.occupied_count, 0)) AS available_rooms,
      rt.created_at, 
      rt.updated_at
    FROM room_types rt
    LEFT JOIN (
      SELECT room_type_id, COUNT(*) AS occupied_count
      FROM bookings
      WHERE (status = 'CHECKED_IN' OR (status = 'CONFIRMED' AND check_in <= ? AND check_out > ?))
      GROUP BY room_type_id
    ) act ON act.room_type_id = rt.id
    ORDER BY rt.id
  `, [t, t]);
  return rows;
};

const getById = async (id) => {
  const t = today();
  const [rows] = await pool.execute(`
    SELECT 
      rt.id, 
      rt.name, 
      rt.price_per_night, 
      rt.total_rooms,
      COALESCE(act.occupied_count, 0) AS occupied_rooms,
      GREATEST(0, rt.total_rooms - COALESCE(act.occupied_count, 0)) AS available_rooms,
      rt.created_at, 
      rt.updated_at
    FROM room_types rt
    LEFT JOIN (
      SELECT room_type_id, COUNT(*) AS occupied_count
      FROM bookings
      WHERE (status = 'CHECKED_IN' OR (status = 'CONFIRMED' AND check_in <= ? AND check_out > ?))
      GROUP BY room_type_id
    ) act ON act.room_type_id = rt.id
    WHERE rt.id = ?
  `, [t, t, id]);
  if (rows.length === 0) throw new AppError('Room type not found', 404);
  return rows[0];
};

const create = async ({ name, price_per_night, total_rooms }) => {
  const [result] = await pool.execute(
    'INSERT INTO room_types (name, price_per_night, total_rooms) VALUES (?, ?, ?)',
    [name, price_per_night, total_rooms]
  );
  return getById(result.insertId);
};

// Highest number of rooms of this type that are booked on the same night (upcoming/current bookings)
const getPeakBookedRooms = async (roomTypeId) => {
  const t = today();
  const [rows] = await pool.execute(
    `SELECT COALESCE(MAX(cnt), 0) AS peak FROM (
       SELECT COUNT(*) AS cnt
       FROM bookings b1
       JOIN bookings b2
         ON b2.room_type_id = b1.room_type_id
        AND b2.status IN ('CONFIRMED', 'CHECKED_IN')
        AND b2.check_in <= b1.check_in
        AND b2.check_out > b1.check_in
       WHERE b1.room_type_id = ?
         AND b1.status IN ('CONFIRMED', 'CHECKED_IN')
         AND b1.check_out > ?
       GROUP BY b1.id
     ) t`,
    [roomTypeId, t]
  );
  return rows[0].peak;
};

const update = async (id, { name, price_per_night, total_rooms }) => {
  await getById(id); // 404 if missing

  const peak = await getPeakBookedRooms(id);
  if (total_rooms < peak) {
    throw new AppError(
      `Cannot set total rooms to ${total_rooms}: up to ${peak} rooms of this type are already booked on the same night`,
      400
    );
  }

  await pool.execute(
    'UPDATE room_types SET name = ?, price_per_night = ?, total_rooms = ? WHERE id = ?',
    [name, price_per_night, total_rooms, id]
  );
  return getById(id);
};

module.exports = { getAll, getById, create, update };
