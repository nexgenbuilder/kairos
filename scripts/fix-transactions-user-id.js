// scripts/fix-transactions-user-id.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('DB:', process.env.DATABASE_URL);

    // 1) Add the column if missing
    await client.query(`ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID;`);
    console.log('✓ transactions.user_id column added/ensured');

    // 2) Backfill from deals.user_id when deal_id is present
    const r1 = await client.query(`
      UPDATE public.transactions t
      SET user_id = d.user_id
      FROM public.deals d
      WHERE t.deal_id = d.id
        AND t.user_id IS NULL
    `);
    console.log(`- Backfilled from deals: ${r1.rowCount}`);

    // 3) Backfill from prospects.user_id when prospect_id is present
    const r2 = await client.query(`
      UPDATE public.transactions t
      SET user_id = p.user_id
      FROM public.prospects p
      WHERE t.prospect_id = p.id
        AND t.user_id IS NULL
    `);
    console.log(`- Backfilled from prospects: ${r2.rowCount}`);

    // Optional: you can leave any remaining NULLs as-is to avoid assigning incorrectly.

    // 4) Add FK (if not exists)
    try {
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_user'
          ) THEN
            ALTER TABLE public.transactions
              ADD CONSTRAINT fk_transactions_user
              FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
          END IF;
        END
        $$;
      `);
      console.log('✓ FK transactions.user_id -> users(id) ensured');
    } catch (e) {
      console.log('FK ensure skipped/failed (possibly exists):', e.message);
    }

    // 5) Add index on user_id
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);`);
    console.log('✓ idx_transactions_user ensured');

    // 6) Useful composite for queries
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred ON public.transactions(user_id, occurred_at);`);
    console.log('✓ idx_transactions_user_occurred ensured');

    console.log('✅ Done.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
