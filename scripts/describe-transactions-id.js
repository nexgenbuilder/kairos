// scripts/describe-transactions-id.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    const info = await c.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='transactions' AND column_name='id'
    `);
    console.log(info.rows[0] || 'No transactions.id found');

    const sample = await c.query(`SELECT id, pg_typeof(id) AS typeof FROM public.transactions LIMIT 1`);
    console.log(sample.rows[0] || 'No rows in transactions');
  } finally {
    c.release();
    await pool.end();
  }
})().catch(console.error);
