import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

export async function GET() {
  const rows = await q`SELECT id, name FROM task_categories ORDER BY name`;
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const rows = await q`INSERT INTO task_categories (name) VALUES (${name}) RETURNING id, name`;
  return NextResponse.json(toJSONSafe(rows[0]));
}
