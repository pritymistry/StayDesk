const app = require('./app');
const pool = require('./config/db');
const { port } = require('./config/env');

const start = async () => {
  try {
    await pool.query('SELECT 1'); // fail fast if MySQL is unreachable
    console.log('MySQL connected');
    app.listen(port, () => console.log(`Server running on srv2072.hstgr.io`));
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }
};

start();
