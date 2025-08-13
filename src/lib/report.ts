// src/lib/report.ts
import { q } from '@/lib/db';

export type DateRangeKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

export function parseRange(key: DateRangeKey, start?: string | null, end?: string | null) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);

  let from = startOfDay(now);
  let to = addDays(from, 1);

  switch (key) {
    case 'today':
      break;
    case 'yesterday':
      to = from;
      from = addDays(from, -1);
      break;
    case 'last7':
      from = addDays(from, -6);
      break;
    case 'last30':
      from = addDays(from, -29);
      break;
    case 'thisMonth':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'lastMonth': {
      const m0 = new Date(now.getFullYear(), now.getMonth(), 1);
      to = m0;
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    }
    case 'thisYear':
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case 'custom': {
      const sf = start ? new Date(start) : from;
      const st = end ? new Date(end) : to;
      from = sf;
      to = st;
      break;
    }
  }
  // normalize to ISO for SQL
  return {
    fromISO: from.toISOString(),
    toISO: to.toISOString(),
  };
}

export async function buildReport(userId: string, fromISO: string, toISO: string) {
  // Prospects
  const [prospectsAll] = await q`
    SELECT
      COUNT(*)::int AS total,
      SUM((created_at >= ${fromISO} AND created_at < ${toISO})::int)::int AS created_in_range
    FROM public.prospects
    WHERE user_id=${userId}
  `;

  // Deals
  const [dealsAgg] = await q`
    SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(
        CASE WHEN stage='won' AND won_at >= ${fromISO} AND won_at < ${toISO}
             THEN COALESCE(actual_amount, amount)
             ELSE 0 END
      ),0)::numeric AS won_amount_in_range,
      SUM((stage='won' AND won_at >= ${fromISO} AND won_at < ${toISO})::int)::int AS won_count_in_range
    FROM public.deals
    WHERE user_id=${userId}
  `;

  // Tasks
  const [tasksAgg] = await q`
    SELECT
      SUM((status_select <> 'completed')::int)::int AS open_now,
      SUM((created_at >= ${fromISO} AND created_at < ${toISO})::int)::int AS created_in_range,
      SUM((completed_at IS NOT NULL AND completed_at >= ${fromISO} AND completed_at < ${toISO})::int)::int AS completed_in_range
    FROM public.tasks
    WHERE user_id=${userId}
  `;

  // Transactions
  const [txAgg] = await q`
    SELECT
      COALESCE(SUM(CASE WHEN type='income'  AND occurred_at >= ${fromISO} AND occurred_at < ${toISO} THEN amount ELSE 0 END),0)::numeric AS income,
      COALESCE(SUM(CASE WHEN type='expense' AND occurred_at >= ${fromISO} AND occurred_at < ${toISO} THEN amount ELSE 0 END),0)::numeric AS expense
    FROM public.transactions
    WHERE user_id=${userId}
  `;
  const txNet = Number(txAgg?.income || 0) - Number(txAgg?.expense || 0);

  // Content
  const [contentAgg] = await q`
    SELECT
      SUM((status='draft')::int)::int AS draft,
      SUM((status='scheduled')::int)::int AS scheduled,
      SUM((status='published')::int)::int AS published,
      COUNT(*)::int AS total,
      SUM((status='published' AND updated_at >= ${fromISO} AND updated_at < ${toISO})::int)::int AS published_in_range
    FROM public.content_pieces
    WHERE user_id=${userId}
  `;

  // Fitness
  const [fitAgg] = await q`
    SELECT
      COUNT(*)::int AS entries,
      COALESCE(SUM(COALESCE(reps,0)),0)::int AS reps,
      COALESCE(SUM(COALESCE(distance,0)),0)::numeric AS distance,
      COALESCE(SUM(COALESCE(duration_minutes,0)),0)::numeric AS minutes
    FROM public.fitness_entries
    WHERE user_id=${userId} AND occurred_at >= ${fromISO} AND occurred_at < ${toISO}
  `;

  // Inventory snapshot
  const [invAgg] = await q`
    SELECT
      COUNT(*)::int AS items,
      COALESCE(SUM(COALESCE(qty,0)),0)::int AS stock,
      COALESCE(SUM(COALESCE(qty,0)*COALESCE(unit_cost,0)),0)::numeric AS cost,
      COALESCE(SUM(COALESCE(qty,0)*COALESCE(unit_price,0)),0)::numeric AS retail
    FROM public.inventory_items
    WHERE user_id=${userId}
  `;

  return {
    range: { from: fromISO, to: toISO },
    prospects: {
      total: Number(prospectsAll?.total || 0),
      created_in_range: Number(prospectsAll?.created_in_range || 0),
    },
    deals: {
      total: Number(dealsAgg?.total || 0),
      won_amount_in_range: Number(dealsAgg?.won_amount_in_range || 0),
      won_count_in_range: Number(dealsAgg?.won_count_in_range || 0),
    },
    tasks: {
      open_now: Number(tasksAgg?.open_now || 0),
      created_in_range: Number(tasksAgg?.created_in_range || 0),
      completed_in_range: Number(tasksAgg?.completed_in_range || 0),
    },
    transactions: {
      income: Number(txAgg?.income || 0),
      expense: Number(txAgg?.expense || 0),
      net: txNet,
    },
    content: {
      draft: Number(contentAgg?.draft || 0),
      scheduled: Number(contentAgg?.scheduled || 0),
      published: Number(contentAgg?.published || 0),
      total: Number(contentAgg?.total || 0),
      published_in_range: Number(contentAgg?.published_in_range || 0),
    },
    fitness: {
      entries: Number(fitAgg?.entries || 0),
      reps: Number(fitAgg?.reps || 0),
      distance: Number(fitAgg?.distance || 0),
      minutes: Number(fitAgg?.minutes || 0),
    },
    inventory: {
      items: Number(invAgg?.items || 0),
      stock: Number(invAgg?.stock || 0),
      cost: Number(invAgg?.cost || 0),
      retail: Number(invAgg?.retail || 0),
    }
  };
}
