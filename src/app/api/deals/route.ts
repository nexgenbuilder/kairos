import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prospectId = searchParams.get('prospect_id');

  const params: any[] = [];
  const where: string[] = [];
  if (prospectId) {
    params.push(prospectId);
    where.push(`prospect_id = $${params.length}`);
  }

  const sql = `
    SELECT id, prospect_id, name, amount, actual_amount, stage,
           expected_close_at, created_at, updated_at, notes
    FROM deals
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at DESC;
  `;
  const rows = await q(sql, params);
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { prospect_id, name, amount, expected_close_at, notes } = body;

  if (!prospect_id || !name) {
    return NextResponse.json(
      { error: 'prospect_id and name are required' },
      { status: 400 }
    );
  }

  const sql = `
    INSERT INTO deals (prospect_id, name, amount, expected_close_at, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const params = [
    prospect_id,
    name,
    amount ?? null,
    expected_close_at ?? null,
    notes ?? null,
  ];
  const rows = await q(sql, params);
  return NextResponse.json(toJSONSafe(rows[0]));
}
