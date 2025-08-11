import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const url = new URL(req.url);
  const prospectId = url.searchParams.get('prospect_id');

  const rows = prospectId
    ? await q`SELECT * FROM public.prospect_interactions WHERE user_id=${user.id} AND prospect_id=${prospectId} ORDER BY created_at DESC`
    : await q`SELECT * FROM public.prospect_interactions WHERE user_id=${user.id} ORDER BY created_at DESC`;

  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const rows = await q`
    INSERT INTO public.prospect_interactions (user_id, prospect_id, kind, notes, created_at)
    VALUES (${user.id}, ${b.prospect_id ?? null}, ${b.kind ?? 'note'}, ${b.notes ?? null}, NOW())
    RETURNING *;
  `;
  return NextResponse.json(toJSONSafe(rows[0]));
}

