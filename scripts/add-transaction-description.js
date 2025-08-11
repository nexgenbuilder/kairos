// scripts/add-transaction-description.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    await client.query(`
      ALTER TABLE IF EXISTS public.transactions
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    console.log('✓ Added "description" column to public.transactions (if it was missing).');
    console.log('✅ Done.');
  } catch (e) {
    console.error('❌ Failed:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();
