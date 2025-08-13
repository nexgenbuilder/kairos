// src/app/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { getUserBySessionToken } from '@/lib/auth';
import { Card, CardTitle } from '@/components/ui/Card';

export default async function Home() {
  const sid = cookies().get('sid')?.value || null;
  const user = sid ? await getUserBySessionToken(sid) : null;
  if (!user) redirect('/login?next=/');

  // --- Prospects & Tasks
  const [
    [{ count: prospects = 0 } = {}],
    [{ a: tasksActive = 0, i: tasksInactive = 0, c: tasksCompleted = 0 } = {}],
  ] = await Promise.all([
    q`SELECT COUNT(*)::int AS count FROM public.prospects WHERE user_id=${user.id}`,
    q`
      SELECT
        SUM(CASE WHEN status_select='active' THEN 1 ELSE 0 END)::int AS a,
        SUM(CASE WHEN status_select='inactive' THEN 1 ELSE 0 END)::int AS i,
        SUM(CASE WHEN status_select='completed' THEN 1 ELSE 0 END)::int AS c
      FROM public.tasks
      WHERE user_id=${user.id}
    `,
  ]);

  // --- Inventory summary (SKUs, units, categories, top category)
  const [[invAgg = {}], [invCatsRow = {}], topCatRows] = await Promise.all([
    q`
      SELECT
        COALESCE(COUNT(*),0)::int AS skus,
        COALESCE(SUM(qty),0)::int AS units
      FROM public.inventory_items
      WHERE user_id=${user.id}
    `,
    q`
      SELECT COALESCE(COUNT(DISTINCT category),0)::int AS categories
      FROM public.inventory_items
      WHERE user_id=${user.id}
    `,
    q`
      SELECT category,
             COUNT(*)::int AS skus,
             COALESCE(SUM(qty),0)::int AS units
      FROM public.inventory_items
      WHERE user_id=${user.id}
      GROUP BY category
      ORDER BY units DESC NULLS LAST, skus DESC
      LIMIT 1
    `,
  ]);
  const invSkus = invAgg?.skus ?? 0;
  const invUnits = invAgg?.units ?? 0;
  const invCategories = invCatsRow?.categories ?? 0;
  const topCat = topCatRows?.[0]?.category || null;
  const topCatSkus = topCatRows?.[0]?.skus || 0;
  const topCatUnits = topCatRows?.[0]?.units || 0;

  // --- Fitness totals + tracked (include zero-entry items) + top/last
  const [[fitAgg = {}], entriesAgg, topAct, lastAct, trackables] = await Promise.all([
    q`
      SELECT
        COALESCE(COUNT(*),0)::int AS entries,
        COALESCE(SUM(duration_minutes),0)::double precision AS minutes
      FROM public.fitness_entries
      WHERE user_id=${user.id}
    `,
    q`
      SELECT activity,
             COUNT(*)::int AS entries,
             COALESCE(SUM(duration_minutes),0)::double precision AS minutes
      FROM public.fitness_entries
      WHERE user_id=${user.id}
      GROUP BY activity
    `,
    q`
      SELECT activity, COUNT(*)::int AS c
      FROM public.fitness_entries
      WHERE user_id=${user.id}
      GROUP BY activity
      ORDER BY c DESC
      LIMIT 1
    `,
    q`
      SELECT activity, occurred_at
      FROM public.fitness_entries
      WHERE user_id=${user.id}
      ORDER BY occurred_at DESC
      LIMIT 1
    `,
    q`
      SELECT activity, category
      FROM public.fitness_trackables
      WHERE user_id=${user.id}
      ORDER BY category, activity
    `,
  ]);

  const fitnessEntries = fitAgg.entries ?? 0;
  const fitnessMinutes = Number(fitAgg.minutes ?? 0);
  const topActivity = topAct?.[0]?.activity || null;
  const topCount = topAct?.[0]?.c || 0;
  const lastActivity = lastAct?.[0]?.activity || null;
  const lastWhen = lastAct?.[0]?.occurred_at ? new Date(lastAct[0].occurred_at).toLocaleString() : null;

  // Merge: ensure every tracked activity appears (even with 0 entries)
  const aggMap = new Map<string, { entries: number; minutes: number }>();
  for (const r of (entriesAgg as any[])) {
    aggMap.set(r.activity, { entries: Number(r.entries || 0), minutes: Number(r.minutes || 0) });
  }
  const trackedSummary = (trackables as any[]).slice(0, 6).map(t => {
    const a = aggMap.get(t.activity) || { entries: 0, minutes: 0 };
    return { activity: t.activity, category: t.category, entries: a.entries, minutes: a.minutes };
  });

  // --- Cashflow (revenue = incomes + won deals; expenses separate; net)
  const [dealsWonRows, txIncomeRows, txExpenseRows, pipelineRows] = await Promise.all([
    q`
      SELECT COALESCE(SUM(COALESCE(actual_amount, amount)), 0)::double precision AS won
      FROM public.deals
      WHERE user_id=${user.id} AND stage='won'
    `,
    q`
      SELECT COALESCE(SUM(amount), 0)::double precision AS income
      FROM public.transactions
      WHERE user_id=${user.id} AND type='income'
    `,
    q`
      SELECT COALESCE(SUM(amount), 0)::double precision AS expense
      FROM public.transactions
      WHERE user_id=${user.id} AND type='expense'
    `,
    q`
      SELECT COALESCE(SUM(amount * probability), 0)::double precision AS pipeline
      FROM public.deals
      WHERE user_id=${user.id}
        AND stage NOT IN ('lost','won')
    `,
  ]);
  const revenue = Number(dealsWonRows?.[0]?.won || 0) + Number(txIncomeRows?.[0]?.income || 0);
  const expenses = Number(txExpenseRows?.[0]?.expense || 0);
  const net = revenue - expenses;
  const pipeline = Number(pipelineRows?.[0]?.pipeline || 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Prospects */}
      <Card>
        <Link href="/prospects" className="block hover:opacity-90">
          <CardTitle>Prospects</CardTitle>
          <div className="text-2xl font-semibold">{prospects}</div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          Manage your CRM pipeline: prospects, interactions, appointments, and deals.
        </div>
      </Card>

      {/* Tasks */}
      <Card>
        <Link href="/tasks" className="block hover:opacity-90">
          <CardTitle>Tasks</CardTitle>
          <div className="text-sm leading-6">
            <div><span className="font-semibold">{tasksActive}</span> active</div>
            <div><span className="font-semibold">{tasksInactive}</span> inactive</div>
            <div><span className="font-semibold">{tasksCompleted}</span> completed</div>
          </div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          Plan and complete tasks. Organize by priority and category.
        </div>
      </Card>

      {/* Cashflow */}
      <Card>
        <Link href="/cashflow" className="block hover:opacity-90">
          <CardTitle>Cashflow</CardTitle>
          <div className="text-sm leading-6">
            <div>Revenue: <span className="font-semibold">${revenue.toFixed(2)}</span></div>
            <div>Expenses: <span className="font-semibold">${expenses.toFixed(2)}</span></div>
            <div>Net: <span className="font-semibold">${net.toFixed(2)}</span></div>
            <div>Pipeline (open): <span className="font-semibold">${pipeline.toFixed(2)}</span></div>
          </div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          Revenue = incomes + won deals; Net subtracts expenses; Pipeline is open deal value × probability.
        </div>
      </Card>

      {/* Inventory */}
      <Card>
        <Link href="/inventory" className="block hover:opacity-90">
          <CardTitle>Inventory</CardTitle>
          <div className="text-sm space-y-1">
            <div>SKUs: <span className="font-semibold">{invSkus}</span> • Units: <span className="font-semibold">{invUnits}</span></div>
            <div>Categories: <span className="font-semibold">{invCategories}</span></div>
            {topCat ? (
              <div>Top: <span className="font-semibold">{topCat}</span> ({topCatUnits} units • {topCatSkus} SKUs)</div>
            ) : null}
          </div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          Track items, categories and quantities.
        </div>
      </Card>

      {/* Content */}
      <Card>
        <Link href="/content" className="block hover:opacity-90">
          <CardTitle>Content</CardTitle>
          <div className="text-sm">Manage drafts, scheduled and published.</div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          Ideas, posts, and publishing pipeline.
        </div>
      </Card>

      {/* Fitness */}
      <Card>
        <Link href="/fitness" className="block hover:opacity-90">
          <CardTitle>Fitness</CardTitle>
          <div className="text-sm space-y-1">
            <div>
              Entries: <span className="font-semibold">{fitnessEntries}</span> •{' '}
              Minutes: <span className="font-semibold">{fitnessMinutes.toFixed(0)}</span>
            </div>
            {topActivity ? <div>Top: <span className="font-semibold">{topActivity}</span> ({topCount})</div> : null}
            {lastActivity ? <div>Last: <span className="font-semibold">{lastActivity}</span>{lastWhen ? ` • ${lastWhen}` : ''}</div> : null}
            {trackedSummary.length > 0 ? (
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-600 mb-1">Tracking:</div>
                {trackedSummary.map(t => (
                  <div key={t.activity} className="text-xs">
                    {t.activity} <span className="text-gray-500">({t.category})</span>:&nbsp;
                    <span className="font-semibold">{t.entries}</span> entries • <span className="font-semibold">{t.minutes.toFixed(0)}</span> min
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          Pick your focus activities in Fitness.
        </div>
      </Card>

      {/* Charts */}
      <Card>
        <Link href="/charts" className="block hover:opacity-90">
          <CardTitle>Charts</CardTitle>
          <div className="text-sm">Trends over time by module.</div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          Transactions, deals won, tasks, content, fitness.
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <Link href="/settings/modules" className="block hover:opacity-90">
          <CardTitle>Settings</CardTitle>
          <div className="text-sm">Manage active modules and preferences.</div>
        </Link>
        <div className="mt-2 text-xs text-gray-600">
          During beta, multiple modules are open to explore.
        </div>
      </Card>
    </div>
  );
}
