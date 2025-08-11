// scripts/add-user-columns.js
require('dotenv').config();
const { Pool } = require('pg');

const TABLES = [
  'prospects',
  'deals',
  'appointments',
  'tasks',
  'task_categories',
  'transactions',
  'prospect_interactions',
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    // Ensure users table exists (from Phase 1)
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

    // Find a "bootstrap" user to backfill existing rows.
    let userRes = await client.query(`SELECT id::text, email FROM public.users ORDER BY created_at LIMIT 1`);
    if (!userRes.rows[0]) {
      const tmpEmail = `admin_${Date.now()}@local`;
      userRes = await client.query(
        `INSERT INTO public.users (email, password_hash, name)
         VALUES ($1, 'x', 'Bootstrap Admin') RETURNING id::text, email`,
        [tmpEmail]
      );
      console.log('Created bootstrap user:', userRes.rows[0].email);
    }
    const firstUserId = userRes.rows[0].id;
    console.log('Bootstrap user id =', firstUserId);

    // Add user_id, backfill, set NOT NULL, add FK & index for each table
    for (const t of TABLES) {
      console.log(`\n--- Ensuring user_id on ${t} ---`);
      await client.query(`
        ALTER TABLE public.${t}
        ADD COLUMN IF NOT EXISTS user_id UUID;
      `);

      // Backfill only where NULL
      await client.query(`
        UPDATE public.${t}
        SET user_id = $1::uuid
        WHERE user_id IS NULL;
      `, [firstUserId]);

      // Set NOT NULL
      await client.query(`
        ALTER TABLE public.${t}
        ALTER COLUMN user_id SET NOT NULL;
      `);

      // FK + index
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'fk_${t}_user'
          ) THEN
            ALTER TABLE public.${t}
            ADD CONSTRAINT fk_${t}_user
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
          END IF;
        END$$;
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_${t}_user ON public.${t}(user_id);`);

      console.log(`✓ ${t}: user_id ensured, FK + index set.`);
    }

    console.log('\n✅ Done. Re-run safely anytime.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
