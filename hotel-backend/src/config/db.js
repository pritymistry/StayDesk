const mysql = require('mysql2/promise');
const { db } = require('./env');

const pool = mysql.createPool({
  ...db,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,     // DATE columns come back as 'YYYY-MM-DD' (no timezone surprises)
  decimalNumbers: true,  // DECIMAL columns come back as numbers, not strings
});

module.exports = pool;
