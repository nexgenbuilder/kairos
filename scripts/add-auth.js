// scripts/add-auth.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    // Try to enable gen_random_uuid() if available (safe if already enabled).
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    } catch (_) {}

    // USERS
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        active_module TEXT,
        modules_enabled JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON public.users(email);`);

    // SESSIONS
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.sessions (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        ip TEXT,
        user_agent TEXT
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);`);

    console.log('✓ users & sessions tables ensured.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
