// scripts/check-new-modules.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    async function exists(table) {
      // to_regclass accepts text; passing 'public.table' works fine
      const { rows } = await c.query('SELECT to_regclass($1) AS t', [`public.${table}`]);
      return !!rows[0]?.t;
    }

    const result = {
      transactions:     await exists('transactions'),
      inventory_items:  await exists('inventory_items'),
      content_pieces:   await exists('content_pieces'),
      fitness_entries:  await exists('fitness_entries'),
    };
    console.log(result);
  } finally {
    c.release();
    await pool.end();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});

