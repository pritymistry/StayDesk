const pool = require('../config/db');
const { today } = require('../utils/dates');

const getSummary = async () => {
  const t = today();
  const [[roomTypes], [checkIns], [active], [checkedIn], [checkOuts], [roomsInv]] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS total FROM room_types'),
    pool.execute("SELECT COUNT(*) AS total FROM bookings WHERE check_in = ? AND status = 'CONFIRMED'", [t]),
    pool.execute("SELECT COUNT(*) AS total FROM bookings WHERE (status = 'CHECKED_IN' OR (status = 'CONFIRMED' AND check_out > ?))", [t]),
    pool.execute("SELECT COUNT(*) AS total FROM bookings WHERE status = 'CHECKED_IN'"),
    pool.execute("SELECT COUNT(*) AS total FROM bookings WHERE check_out = ? AND status = 'CHECKED_IN'", [t]),
    pool.execute(`
      SELECT 
        COALESCE(SUM(total_rooms), 0) AS total_inventory,
        COALESCE(SUM(occupied_count), 0) AS total_occupied
      FROM room_types rt
      LEFT JOIN (
        SELECT room_type_id, COUNT(*) AS occupied_count
        FROM bookings
        WHERE (status = 'CHECKED_IN' OR (status = 'CONFIRMED' AND check_in <= ? AND check_out > ?))
        GROUP BY room_type_id
      ) act ON act.room_type_id = rt.id
    `, [t, t]),
  ]);

  const totalInventory = Number(roomsInv[0].total_inventory) || 0;
  const totalOccupied = Number(roomsInv[0].total_occupied) || 0;
  const totalAvailable = Math.max(0, totalInventory - totalOccupied);

  return {
    total_room_types: roomTypes[0].total,
    todays_check_ins: checkIns[0].total,
    active_bookings: active[0].total,
    checked_in_guests: checkedIn[0].total,
    todays_check_outs: checkOuts[0].total,
    total_rooms_inventory: totalInventory,
    total_occupied_today: totalOccupied,
    total_available_today: totalAvailable,
  };
};

module.exports = { getSummary };
