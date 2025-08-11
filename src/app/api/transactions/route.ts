import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

export async function GET() {
  const rows = await q(
    `
    SELECT id, type, amount, occurred_at, description, category, deal_id, prospect_id
    FROM transactions
    ORDER BY occurred_at DESC
    `
  );
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (Number.isNaN(amount)) {
    return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
  }

  const type = body.type === 'expense' ? 'expense' : 'income';
  const occurredAt = body.occurred_at ? new Date(body.occurred_at) : new Date();
  const description = body.description ? String(body.description) : null;
  const category = body.category ? String(body.category) : null;
  const dealId = body.deal_id ? String(body.deal_id) : null;
  const prospectId = body.prospect_id ? String(body.prospect_id) : null;

  const sql = `
    INSERT INTO transactions (type, amount, occurred_at, description, category, deal_id, prospect_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, type, amount, occurred_at, description, category, deal_id, prospect_id;
  `;
  const params = [type, amount, occurredAt, description, category, dealId, prospectId];
  const rows = await q(sql, params);
  return NextResponse.json(toJSONSafe(rows[0]));
}
