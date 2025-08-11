// scripts/migrate.js
// Applies .sql files in /migrations in lexicographic order and records them in public.migrations.
// Also heals the migrations table shape (id TEXT, timestamp BIGINT default epoch) if needed.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id TEXT PRIMARY KEY
      )
    `);

    // Ensure id is TEXT
    try {
      await client.query(`ALTER TABLE public.migrations ALTER COLUMN id TYPE TEXT USING id::text`);
    } catch (_) {}

    // Ensure timestamp BIGINT default epoch exists and is NOT NULL
    try { await client.query(`ALTER TABLE public.migrations ADD COLUMN IF NOT EXISTS "timestamp" BIGINT`); } catch (_) {}
    try { await client.query(`ALTER TABLE public.migrations ALTER COLUMN "timestamp" SET DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint)`); } catch (_) {}
    try { await client.query(`UPDATE public.migrations SET "timestamp" = EXTRACT(EPOCH FROM NOW())::bigint WHERE "timestamp" IS NULL`); } catch (_) {}
    try { await client.query(`ALTER TABLE public.migrations ALTER COLUMN "timestamp" SET NOT NULL`); } catch (_) {}

    console.log('✓ migrations table ready');

    const dir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(dir)) {
      console.log('No migrations/ directory found, nothing to do.');
      return;
    }

    // Get already applied
    const appliedRes = await client.query(`SELECT id FROM public.migrations`);
    const applied = new Set(appliedRes.rows.map(r => r.id));

    // Read .sql files
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- skip ${file} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`Applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(`INSERT INTO public.migrations (id) VALUES ($1)`, [file]);
        await client.query('COMMIT');
        console.log(`✓ ${file} applied`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ ${file} failed:`, err.message);
        throw err;
      }
    }

    console.log('✅ Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
