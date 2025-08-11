// scripts/check-transactions-columns.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    console.log(rows.map(r => r.column_name));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
