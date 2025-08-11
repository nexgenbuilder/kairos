// src/app/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { getUserBySessionToken } from '@/lib/auth';

export default async function Home() {
  // Get logged-in user from sid cookie (server component safe)
  const sid = cookies().get('sid')?.value || null;
  const user = sid ? await getUserBySessionToken(sid) : null;
  if (!user) {
    // If not logged in, go to login and come back after
    redirect('/login?next=/');
  }

  // --- Counts (scoped to user) ---
  const [{ count: prospects = 0 } = {}] =
    await q`SELECT COUNT(*)::int AS count FROM public.prospects WHERE user_id=${user.id}`;

  // Count only NOT completed tasks for this user
  const [{ count: tasks = 0 } = {}] =
    await q`SELECT COUNT(*)::int AS count FROM public.tasks WHERE user_id=${user.id} AND status_select <> 'completed'`;

  // --- Deal summary (scoped to user) ---
  const dealSummary = await q`
    SELECT
      COALESCE(SUM(CASE WHEN stage = 'won'
                        THEN COALESCE(actual_amount, amount)
                        ELSE 0 END), 0)::double precision AS revenue,
      COALESCE(SUM(CASE WHEN stage <> 'lost'
                        THEN amount * probability
                        ELSE 0 END), 0)::double precision AS pipeline
    FROM public.deals
    WHERE user_id=${user.id}
  `;

  // --- Transaction net (income - expense) scoped to user ---
  const txSummary = await q`
    SELECT COALESCE(SUM(
      CASE WHEN type='income' THEN amount ELSE -amount END
    ), 0)::double precision AS net
    FROM public.transactions
    WHERE user_id=${user.id}
  `;

  const revenueFromWonDeals = Number(dealSummary[0]?.revenue || 0);
  const pipeline = Number(dealSummary[0]?.pipeline || 0);
  const netTransactions = Number(txSummary[0]?.net || 0);

  // Total revenue = won deals + net standalone transactions
  // (If your pipeline uses transactions for deals via triggers, you can adjust as needed)
  const revenue = revenueFromWonDeals + netTransactions;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Link href="/prospects" className="rounded-xl border bg-white p-4 block">
        <h2 className="text-lg font-semibold mb-2">Prospects</h2>
        <p>{prospects} prospects</p>
      </Link>

      <Link href="/tasks" className="rounded-xl border bg-white p-4 block">
        <h2 className="text-lg font-semibold mb-2">Tasks</h2>
        <p>{tasks} active tasks</p>
      </Link>

      <Link href="/cashflow" className="rounded-xl border bg-white p-4 block">
        <h2 className="text-lg font-semibold mb-2">Cashflow</h2>
        <p>
          Total Revenue: ${revenue.toFixed(2)}
          <br />
          Pipeline: ${pipeline.toFixed(2)}
        </p>
      </Link>

      <Link href="/content" className="rounded-xl border bg-white p-4 block">
        <h2 className="text-lg font-semibold mb-2">Content</h2>
        <p>Manage your content pieces.</p>
      </Link>
    </div>
  );
}
