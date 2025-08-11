// scripts/check-db.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('DATABASE_URL =', process.env.DATABASE_URL);

    const ping = await pool.query('select 1 as ok');
    console.log('ping:', ping.rows);

    const exists = await pool.query(`select to_regclass('public.transactions') as tbl`);
    console.log('transactions table:', exists.rows[0].tbl || null);

    if (exists.rows[0].tbl) {
      const rows = await pool.query('select * from public.transactions order by id desc limit 5');
      console.log('sample transactions:', rows.rows);
    }
  } catch (e) {
    console.error('DB check failed:', e);
  } finally {
    process.exit(0);
  }
})();

