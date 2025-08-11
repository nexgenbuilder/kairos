// scripts/add-user-flags.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    // Add role + is_premium (idempotent)
    await client.query(`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false
    `);

    // Ensure modules_enabled is jsonb and non-null (default [])
    await client.query(`
      ALTER TABLE public.users
      ALTER COLUMN modules_enabled TYPE jsonb USING
        CASE
          WHEN modules_enabled IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(modules_enabled::jsonb) IS NULL THEN '[]'::jsonb
          ELSE modules_enabled::jsonb
        END
    `);
    await client.query(`
      ALTER TABLE public.users
      ALTER COLUMN modules_enabled SET DEFAULT '[]'::jsonb
    `);
    await client.query(`
      UPDATE public.users
      SET modules_enabled = '[]'::jsonb
      WHERE modules_enabled IS NULL
    `);

    console.log('✓ users table updated (role, is_premium, modules_enabled default)');
  } finally {
    client.release();
    await pool.end();
  }
})().catch(e => { console.error(e); process.exit(1); });
