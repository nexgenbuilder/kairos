// scripts/check-user-columns.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const tables = [
      'prospects',
      'deals',
      'appointments',
      'tasks',
      'task_categories',
      'transactions',
      'prospect_interactions',
      'inventory_items',
      'content_pieces',
      'fitness_entries',
    ];
    for (const t of tables) {
      const r = await client.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1 AND column_name='user_id'`,
        [t]
      );
      console.log(`${t}: ${r.rowCount ? 'OK' : 'MISSING user_id'}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
