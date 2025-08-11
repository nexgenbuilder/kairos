import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';

export async function GET(req: Request) {
  const user = await requireUser(req);

  // quick counts to prove scoping works
  const [prospects, deals, tasks, txs] = await Promise.all([
    q`SELECT COUNT(*)::int AS n FROM public.prospects WHERE user_id=${user.id}`,
    q`SELECT COUNT(*)::int AS n FROM public.deals WHERE user_id=${user.id}`,
    q`SELECT COUNT(*)::int AS n FROM public.tasks WHERE user_id=${user.id}`,
    q`SELECT COUNT(*)::int AS n FROM public.transactions WHERE user_id=${user.id}`,
  ]);

  return NextResponse.json({
    user,
    counts: {
      prospects: prospects[0]?.n ?? 0,
      deals: deals[0]?.n ?? 0,
      tasks: tasks[0]?.n ?? 0,
      transactions: txs[0]?.n ?? 0,
    },
  });
}

