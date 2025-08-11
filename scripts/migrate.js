// scripts/migrate.js
// Minimal, robust migrator: heal migrations table and create required tables/columns.
require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    // --- Ensure migrations table exists (id as TEXT) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id TEXT PRIMARY KEY
      );
    `);

    // Make sure id is TEXT (safe to run even if already TEXT)
    try {
      await client.query(`
        ALTER TABLE public.migrations
        ALTER COLUMN id TYPE TEXT USING id::text;
      `);
    } catch (_) {}

    // Ensure a BIGINT "timestamp" column with a proper epoch default exists
    try {
      await client.query(`
        ALTER TABLE public.migrations
        ADD COLUMN IF NOT EXISTS "timestamp" BIGINT;
      `);
    } catch (_) {}

    try {
      // Set default to epoch seconds for BIGINT column
      await client.query(`
        ALTER TABLE public.migrations
        ALTER COLUMN "timestamp" SET DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint);
      `);
    } catch (_) {}

    try {
      // Backfill NULLs to avoid NOT NULL violation later
      await client.query(`
        UPDATE public.migrations
        SET "timestamp" = EXTRACT(EPOCH FROM NOW())::bigint
        WHERE "timestamp" IS NULL;
      `);
    } catch (_) {}

    try {
      await client.query(`
        ALTER TABLE public.migrations
        ALTER COLUMN "timestamp" SET NOT NULL;
      `);
    } catch (_) {}

    console.log('✓ Migrations table healed (id TEXT, timestamp BIGINT with default).');

    // --- Create transactions table (idempotent) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.transactions (
        id SERIAL PRIMARY KEY,
        prospect_id UUID NULL,
        deal_id UUID NULL,
        type TEXT NOT NULL CHECK (type IN ('income','expense')),
        amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
    `);

    console.log('✓ transactions table ensured.');

    // --- Ensure deals has updated_at + notes (idempotent) ---
    await client.query(`
      ALTER TABLE IF EXISTS public.deals
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
    await client.query(`
      ALTER TABLE IF EXISTS public.deals
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    console.log('✓ deals columns ensured (updated_at, notes).');
    console.log('✅ Migration complete.');
  } catch (e) {
    console.error('❌ Migration failed:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();

