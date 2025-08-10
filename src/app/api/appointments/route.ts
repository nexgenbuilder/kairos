import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get('prospect_id');

  const rows = pid
    ? await q`select * from appointments where prospect_id = ${pid} order by starts_at desc`
    : await q`select * from appointments order by starts_at desc`;

  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const {
    prospect_id,
    title,
    starts_at,
    ends_at,
    location = null,
    notes = null,
  } = body || {};

  if (!prospect_id || !title || !starts_at || !ends_at) {
    return NextResponse.json(
      { error: 'prospect_id, title, starts_at, ends_at required' },
      { status: 400 }
    );
  }

  const rows = await q`
    insert into appointments (prospect_id, title, starts_at, ends_at, location, notes)
    values (${prospect_id}, ${title}, ${starts_at}, ${ends_at}, ${location}, ${notes})
    returning *
  `;

  return NextResponse.json(toJSONSafe(rows[0]));
}
