import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

export async function GET() {
  const rows = await q`SELECT id, amount, description, occurred_at, created_at FROM transactions ORDER BY occurred_at DESC`;
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (Number.isNaN(amount)) return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
  const occurredAt = body.occurred_at ? new Date(body.occurred_at) : new Date();
  const description = body.description ? String(body.description) : null;
  const rows = await q`INSERT INTO transactions (amount, description, occurred_at) VALUES (${amount}, ${description}, ${occurredAt}) RETURNING id, amount, description, occurred_at, created_at`;
  return NextResponse.json(toJSONSafe(rows[0]));
}
