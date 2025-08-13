// src/app/api/cashflow/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);

  const rows = await q`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0)::double precision AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::double precision AS expense
    FROM public.transactions
    WHERE user_id = ${user.id}
  `;

  const income = Number(rows[0]?.income || 0);
  const expense = Number(rows[0]?.expense || 0);
  const net = income - expense;

  return NextResponse.json({ income, expense, net });
}

