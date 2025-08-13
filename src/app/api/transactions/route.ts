// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT id, type, amount, occurred_at, description, category, deal_id, prospect_id
    FROM public.transactions
    WHERE user_id = ${user.id}
    ORDER BY occurred_at DESC
  `;
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const user = await requireUser(req);

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
  }

  const type = body.type === 'expense' ? 'expense' : 'income';
  const occurredAt = body.occurred_at ? new Date(body.occurred_at) : new Date();

  const description = body.description ? String(body.description) : null;
  const category = body.category ? String(body.category) : null;
  const dealId = body.deal_id ? String(body.deal_id) : null;
  const prospectId = body.prospect_id ? String(body.prospect_id) : null;

  const rows = await q`
    INSERT INTO public.transactions
      (user_id, type, amount, occurred_at, description, category, deal_id, prospect_id)
    VALUES
      (${user.id}, ${type}, ${amount}, ${occurredAt}, ${description}, ${category}, ${dealId}, ${prospectId})
    RETURNING id, type, amount, occurred_at, description, category, deal_id, prospect_id
  `;
  return NextResponse.json(toJSONSafe(rows[0]));
}



