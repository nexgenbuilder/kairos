// src/app/api/charts/overview/route.ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';

// Helper: build last-30-days series for transactions (net = income - expense)
async function transactionsSeries(userId: string) {
  const rows = await q`
    WITH days AS (
      SELECT generate_series(
        (NOW()::date - INTERVAL '29 days')::date,
        NOW()::date,
        '1 day'
      )::date AS d
    )
    SELECT
      d AS date,
      COALESCE(SUM(
        CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END
      ), 0)::numeric AS net
    FROM days
    LEFT JOIN public.transactions t
      ON t.user_id = ${userId}
     AND t.occurred_at::date = d
    GROUP BY d
    ORDER BY d;
  `;
  return rows.map(r => ({
    date: r.date,
    net: Number(r.net || 0),
  }));
}

// Helper: build last-30-days series for fitness (sum of minutes per day)
async function fitnessSeries(userId: string) {
  const rows = await q`
    WITH days AS (
      SELECT generate_series(
        (NOW()::date - INTERVAL '29 days')::date,
        NOW()::date,
        '1 day'
      )::date AS d
    )
    SELECT
      d AS date,
      COALESCE(SUM(f.duration_minutes), 0)::numeric AS minutes
    FROM days
    LEFT JOIN public.fitness_entries f
      ON f.user_id = ${userId}
     AND f.occurred_at::date = d
    GROUP BY d
    ORDER BY d;
  `;
  return rows.map(r => ({
    date: r.date,
    minutes: Number(r.minutes || 0),
  }));
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  const uid = user.id;

  // Prospects
  const prospectsRows = await q`
    SELECT
      COUNT(*)::int AS total,
      SUM((created_at >= NOW() - INTERVAL '7 days')::int)::int AS new7
    FROM public.prospects
    WHERE user_id = ${uid};
  `;
  const prospects = {
    total: Number(prospectsRows[0]?.total || 0),
    new7: Number(prospectsRows[0]?.new7 || 0),
  };

  // Deals (total + won amount in last 30 days)
  const dealsRows = await q`
    SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(
        CASE WHEN stage = 'won' AND won_at >= NOW() - INTERVAL '30 days'
             THEN COALESCE(actual_amount, amount)
             ELSE 0 END
      ), 0)::numeric AS won30
    FROM public.deals
    WHERE user_id = ${uid};
  `;
  const deals = {
    total: Number(dealsRows[0]?.total || 0),
    won30: Number(dealsRows[0]?.won30 || 0),
  };

  // Tasks (open + done in last 7 days)
  const tasksRows = await q`
    SELECT
      SUM((status_select <> 'completed')::int)::int AS open,
      SUM((completed_at IS NOT NULL AND completed_at >= NOW() - INTERVAL '7 days')::int)::int AS done7
    FROM public.tasks
    WHERE user_id = ${uid};
  `;
  const tasks = {
    open: Number(tasksRows[0]?.open || 0),
    done7: Number(tasksRows[0]?.done7 || 0),
  };

  // Transactions (last 30 days)
  const txRows = await q`
    SELECT
      COALESCE(SUM(CASE WHEN type='income'  AND occurred_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::numeric AS income30,
      COALESCE(SUM(CASE WHEN type='expense' AND occurred_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::numeric AS expense30
    FROM public.transactions
    WHERE user_id = ${uid};
  `;
  const income30 = Number(txRows[0]?.income30 || 0);
  const expense30 = Number(txRows[0]?.expense30 || 0);
  const net30 = income30 - expense30;
  const txSeries = await transactionsSeries(uid);
  const transactions = { income30, expense30, net30, series: txSeries };

  // Content by status
  const contentRows = await q`
    SELECT
      SUM((status='draft')::int)::int AS draft,
      SUM((status='scheduled')::int)::int AS scheduled,
      SUM((status='published')::int)::int AS published,
      COUNT(*)::int AS total
    FROM public.content_pieces
    WHERE user_id = ${uid};
  `;
  const content = {
    draft: Number(contentRows[0]?.draft || 0),
    scheduled: Number(contentRows[0]?.scheduled || 0),
    published: Number(contentRows[0]?.published || 0),
    total: Number(contentRows[0]?.total || 0),
  };

  // Fitness (last 30 days)
  const fitRows = await q`
    SELECT
      COUNT(*)::int AS entries30,
      COALESCE(SUM(COALESCE(reps,0)),0)::int AS reps30,
      COALESCE(SUM(COALESCE(distance,0)),0)::numeric AS distance30,
      COALESCE(SUM(COALESCE(duration_minutes,0)),0)::numeric AS minutes30
    FROM public.fitness_entries
    WHERE user_id = ${uid} AND occurred_at >= NOW() - INTERVAL '30 days';
  `;
  const fitSeries = await fitnessSeries(uid);
  const fitness = {
    entries30: Number(fitRows[0]?.entries30 || 0),
    reps30: Number(fitRows[0]?.reps30 || 0),
    distance30: Number(fitRows[0]?.distance30 || 0),
    minutes30: Number(fitRows[0]?.minutes30 || 0),
    series: fitSeries,
  };

  // Inventory
  const invRows = await q`
    SELECT
      COUNT(*)::int AS items,
      COALESCE(SUM(COALESCE(qty,0)),0)::int AS stock,
      COALESCE(SUM(COALESCE(qty,0)*COALESCE(unit_cost,0)),0)::numeric AS cost,
      COALESCE(SUM(COALESCE(qty,0)*COALESCE(unit_price,0)),0)::numeric AS retail
    FROM public.inventory_items
    WHERE user_id = ${uid};
  `;
  const inventory = {
    items: Number(invRows[0]?.items || 0),
    stock: Number(invRows[0]?.stock || 0),
    cost: Number(invRows[0]?.cost || 0),
    retail: Number(invRows[0]?.retail || 0),
  };

  return NextResponse.json({
    prospects,
    deals,
    tasks,
    transactions,
    content,
    fitness,
    inventory,
  });
}
