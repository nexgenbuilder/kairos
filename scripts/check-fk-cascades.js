// scripts/check-fk-cascades.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(`
      SELECT conname AS name, confrelid::regclass AS references_table
      FROM pg_constraint
      WHERE contype = 'f'
        AND conname IN (
          'fk_transactions_prospect',
          'fk_transactions_deal',
          'fk_deals_prospect',
          'fk_interactions_prospect',
          'fk_appointments_prospect'
        )
      ORDER BY conname;
    `);
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
