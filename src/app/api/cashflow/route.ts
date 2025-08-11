// src/app/api/cashflow/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);

  // Example: total income/expense sums this month for the current user
  const rows = await q`
    SELECT
      date_trunc('month', occurred_at) AS month,
      sum(case when type='income' then amount else 0 end)::numeric(12,2) as income,
      sum(case when type='expense' then amount else 0 end)::numeric(12,2) as expense
    FROM public.transactions
    WHERE user_id=${user.id}
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 12
  `;

  return NextResponse.json(rows);
}
