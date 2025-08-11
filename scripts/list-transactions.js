// scripts/list-transactions.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(`
      SELECT id, type, amount::text, date, category, description, deal_id, prospect_id
      FROM public.transactions
      ORDER BY id ASC
      LIMIT 50
    `);
    console.table(rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
