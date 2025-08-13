// src/app/api/prospect-interactions/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const ALLOWED_TYPES = new Set(['call', 'email', 'meeting', 'note', 'reminder', 'deal_update']);

function toISOOrNull(v?: string | null) {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00').toISOString();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return new Date(v).toISOString();
  return v;
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get('prospect_id');

  if (pid) {
    const rows = await q`
      SELECT id::text, prospect_id::text, type, summary, due_at, completed_at, created_at
      FROM public.prospect_interactions
      WHERE user_id=${user.id} AND prospect_id=${pid}::uuid
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  }

  const rows = await q`
    SELECT id::text, prospect_id::text, type, summary, due_at, completed_at, created_at
    FROM public.prospect_interactions
    WHERE user_id=${user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));

  const prospect_id = String(b.prospect_id || '').trim();
  if (!prospect_id) return NextResponse.json({ error: 'prospect_id required' }, { status: 400 });

  let type = String(b.type || '').toLowerCase();
  if (!ALLOWED_TYPES.has(type)) type = 'note';

  const summary = b.summary ? String(b.summary) : null;
  const due_at = toISOOrNull(b.due_at || null);

  const rows = await q`
    INSERT INTO public.prospect_interactions
      (user_id, prospect_id, type, summary, due_at, completed_at, created_at)
    VALUES
      (${user.id}, ${prospect_id}::uuid, ${type}, ${summary}, ${due_at}, NULL, NOW())
    RETURNING id::text, prospect_id::text, type, summary, due_at, completed_at, created_at
  `;
  return NextResponse.json(rows[0]);
}

