// scripts/add-performance-indexes.js
require('dotenv').config();
const { Pool } = require('pg');

async function colExists(c, table, column) {
  const r = await c.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 AND column_name=$2
     LIMIT 1`, [table, column]
  );
  return r.rowCount > 0;
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    console.log('Connecting to DB:', process.env.DATABASE_URL);

    // TRANSACTIONS
    await c.query(`CREATE INDEX IF NOT EXISTS idx_tx_user_occurred ON public.transactions(user_id, occurred_at DESC)`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_tx_user_type ON public.transactions(user_id, type)`);

    // TASKS
    const tasksHasStatus = await colExists(c, 'tasks', 'status_select');
    if (tasksHasStatus) {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON public.tasks(user_id) WHERE status_select <> 'completed'`);
    }
    const tasksHasUpdated = await colExists(c, 'tasks', 'updated_at');
    if (tasksHasUpdated) {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_tasks_user_updated ON public.tasks(user_id, updated_at DESC)`);
    }

    // DEALS
    await c.query(`CREATE INDEX IF NOT EXISTS idx_deals_user_prospect ON public.deals(user_id, prospect_id)`);
    const dealsHasStage = await colExists(c, 'deals', 'stage');
    if (dealsHasStage) {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_deals_user_stage ON public.deals(user_id, stage)`);
    }
    const dealsHasUpdated = await colExists(c, 'deals', 'updated_at');
    if (dealsHasUpdated) {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_deals_user_updated ON public.deals(user_id, updated_at DESC)`);
    }

    // PROSPECTS
    const prospectsHasCreated = await colExists(c, 'prospects', 'created_at');
    if (prospectsHasCreated) {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_prospects_user_created ON public.prospects(user_id, created_at DESC)`);
    } else {
      // Fallback to updated_at if created_at absent
      const prospectsHasUpdated = await colExists(c, 'prospects', 'updated_at');
      if (prospectsHasUpdated) {
        await c.query(`CREATE INDEX IF NOT EXISTS idx_prospects_user_updated ON public.prospects(user_id, updated_at DESC)`);
      }
    }

    // APPOINTMENTS
    const apptCols = ['scheduled_at', 'scheduled_for', 'when_at', 'created_at', 'updated_at'];
    let apptIndexed = false;
    for (const col of apptCols) {
      if (await colExists(c, 'appointments', col)) {
        await c.query(`CREATE INDEX IF NOT EXISTS idx_appts_user_${col} ON public.appointments(user_id, ${col} DESC)`);
        apptIndexed = true;
        break;
      }
    }
    if (!apptIndexed) {
      // At least index by prospect
      await c.query(`CREATE INDEX IF NOT EXISTS idx_appts_user_prospect ON public.appointments(user_id, prospect_id)`);
    } else {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_appts_user_prospect ON public.appointments(user_id, prospect_id)`);
    }

    // PROSPECT INTERACTIONS
    const interHasCreated = await colExists(c, 'prospect_interactions', 'created_at');
    if (interHasCreated) {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_interactions_user_prospect_created ON public.prospect_interactions(user_id, prospect_id, created_at DESC)`);
    } else {
      await c.query(`CREATE INDEX IF NOT EXISTS idx_interactions_user_prospect ON public.prospect_interactions(user_id, prospect_id)`);
    }

    console.log('✓ performance indexes in place');
  } finally {
    c.release();
    await pool.end();
  }
})();

