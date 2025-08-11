// scripts/add-transaction-category.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    await client.query(`
      ALTER TABLE IF EXISTS public.transactions
      ADD COLUMN IF NOT EXISTS category TEXT;
    `);

    // Optional but harmless: add an index if you’ll filter by category later
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = 'idx_transactions_category' AND n.nspname = 'public'
        ) THEN
          CREATE INDEX idx_transactions_category ON public.transactions(category);
        END IF;
      END $$;
    `);

    console.log('✓ Added "category" column (if missing) and ensured index.');
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
