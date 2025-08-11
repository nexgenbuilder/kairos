import Link from 'next/link';
import { q } from '@/lib/db';

export default async function Home() {
  const [{ count: prospects = 0 } = {}] = await q`SELECT COUNT(*)::int AS count FROM prospects`;
  const [{ count: tasks = 0 } = {}] = await q`SELECT COUNT(*)::int AS count FROM tasks WHERE status_select <> 'completed'`;
  const dealSummary = await q`
    select
      coalesce(sum(case when stage = 'won'
                        then coalesce(actual_amount, amount)
                        else 0 end), 0)::double precision as revenue,
      coalesce(sum(case when stage <> 'lost'
                        then amount * probability
                        else 0 end), 0)::double precision as pipeline
    from deals
  `;
  const txSummary = await q`select coalesce(sum(amount),0)::double precision as tx from transactions`;
  const revenue = Number(dealSummary[0]?.revenue || 0) + Number(txSummary[0]?.tx || 0);
  const pipeline = Number(dealSummary[0]?.pipeline || 0);

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
        <p>Total Revenue: ${revenue.toFixed(2)}
          <br />Pipeline: ${pipeline.toFixed(2)}</p>
      </Link>
      <Link href="/content" className="rounded-xl border bg-white p-4 block">
        <h2 className="text-lg font-semibold mb-2">Content</h2>
        <p>Manage your content pieces.</p>
      </Link>
    </div>
  );
}
