// scripts/print-user-data-snapshot.js
require('dotenv').config();
const { Pool } = require('pg');

async function main(email) {
  if (!email) {
    console.log('Usage: node scripts/print-user-data-snapshot.js you@example.com');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    const ures = await c.query(
      'SELECT id::text AS id, email, role, is_premium FROM public.users WHERE LOWER(email)=LOWER($1)',
      [email]
    );
    if (!ures.rows[0]) {
      console.log('No user found for', email);
      return;
    }
    const uid = ures.rows[0].id;
    console.log('User:', ures.rows[0]);

    async function count(table) {
      const r = await c.query(`SELECT COUNT(*)::int AS n FROM public.${table} WHERE user_id=$1`, [uid]);
      return r.rows[0].n;
    }

    const tables = [
      'prospects',
      'deals',
      'appointments',
      'prospect_interactions',
      'tasks',
      'task_categories',
      'transactions',
    ];

    for (const t of tables) {
      const n = await count(t);
      console.log(`${t}: ${n}`);
    }
  } finally {
    c.release();
    await pool.end();
  }
}

main(process.argv[2]).catch(e => {
  console.error(e);
  process.exit(1);
});
