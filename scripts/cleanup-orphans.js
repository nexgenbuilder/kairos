// scripts/cleanup-orphans.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    const tables = [
      'transactions',
      'deals',
      'appointments',
      'prospect_interactions',
      'tasks',
      'task_categories',
      'prospects',
    ];
    for (const t of tables) {
      const res = await c.query(`DELETE FROM public.${t} WHERE user_id IS NULL`);
      console.log(`- ${t}: deleted ${res.rowCount} orphan rows`);
    }
    console.log('✓ Orphan (user_id NULL) rows removed.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();
