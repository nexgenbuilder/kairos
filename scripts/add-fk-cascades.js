// scripts/add-fk-cascades.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    // transactions -> prospects (ON DELETE CASCADE)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_prospect'
        ) THEN
          ALTER TABLE public.transactions
          ADD CONSTRAINT fk_transactions_prospect
          FOREIGN KEY (prospect_id)
          REFERENCES public.prospects(id)
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // transactions -> deals (ON DELETE CASCADE)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_deal'
        ) THEN
          ALTER TABLE public.transactions
          ADD CONSTRAINT fk_transactions_deal
          FOREIGN KEY (deal_id)
          REFERENCES public.deals(id)
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // deals -> prospects (ON DELETE CASCADE)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_prospect'
        ) THEN
          ALTER TABLE public.deals
          ADD CONSTRAINT fk_deals_prospect
          FOREIGN KEY (prospect_id)
          REFERENCES public.prospects(id)
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // prospect_interactions -> prospects (ON DELETE CASCADE)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_interactions_prospect'
        ) THEN
          ALTER TABLE public.prospect_interactions
          ADD CONSTRAINT fk_interactions_prospect
          FOREIGN KEY (prospect_id)
          REFERENCES public.prospects(id)
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // appointments -> prospects (ON DELETE CASCADE)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_prospect'
        ) THEN
          ALTER TABLE public.appointments
          ADD CONSTRAINT fk_appointments_prospect
          FOREIGN KEY (prospect_id)
          REFERENCES public.prospects(id)
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✓ Cascade FKs ensured.');
  } catch (e) {
    console.error('❌ Failed to add cascades:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
})();
