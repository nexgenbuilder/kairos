import { NextResponse } from 'next/server';
import { q } from '@/lib/db';


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get('prospect_id');

  let sql = 'SELECT * FROM prospect_interactions';
  const vals: any[] = [];
  if (pid) {
    sql += ' WHERE prospect_id = $1';
    vals.push(pid);
  }
  sql += ' ORDER BY created_at DESC';

  const { rows } = await q(sql, vals.length ? vals : undefined);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { prospect_id, type, summary, due_at } = body;

  if (!prospect_id || !type) {
    return NextResponse.json(
      { error: 'prospect_id and type are required' },
      { status: 400 }
    );
  }

  const sql = `
    INSERT INTO prospect_interactions (prospect_id, type, summary, due_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const params = [
    prospect_id,
    type,
    summary ?? null,
    due_at ?? null,
  ];

  const { rows } = await q(sql, params);
  return NextResponse.json(rows[0]);
}


