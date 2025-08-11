// scripts/heal-migrations-table.js
// One-time healer for public.migrations shape: keep only (id TEXT PK, timestamp BIGINT default epoch).
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    console.log('DB:', process.env.DATABASE_URL);
    await c.query('BEGIN');

    // Ensure table exists
    await c.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id TEXT PRIMARY KEY
      )
    `);

    // Ensure id is TEXT
    try {
      await c.query(`ALTER TABLE public.migrations ALTER COLUMN id TYPE TEXT USING id::text`);
    } catch (_) {}

    // DROP any legacy 'name' column that is causing NOT NULL errors
    try {
      await c.query(`ALTER TABLE public.migrations DROP COLUMN IF EXISTS name`);
    } catch (_) {}

    // Ensure timestamp BIGINT exists, has proper default, and is NOT NULL
    try { await c.query(`ALTER TABLE public.migrations ADD COLUMN IF NOT EXISTS "timestamp" BIGINT`); } catch (_) {}
    try { await c.query(`ALTER TABLE public.migrations ALTER COLUMN "timestamp" SET DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint)`); } catch (_) {}
    try { await c.query(`UPDATE public.migrations SET "timestamp" = COALESCE("timestamp", EXTRACT(EPOCH FROM NOW())::bigint)`); } catch (_) {}
    try { await c.query(`ALTER TABLE public.migrations ALTER COLUMN "timestamp" SET NOT NULL`); } catch (_) {}

    await c.query('COMMIT');
    console.log('✓ migrations table healed');
  } catch (err) {
    await c.query('ROLLBACK');
    console.error(err);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();
