// src/app/api/appointments/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

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
      SELECT
        id::text, prospect_id::text, title, starts_at, ends_at, location, notes, created_at
      FROM public.appointments
      WHERE user_id=${user.id} AND prospect_id=${pid}::uuid
      ORDER BY starts_at DESC NULLS LAST, created_at DESC
    `;
    return NextResponse.json(rows);
  }

  const rows = await q`
    SELECT
      id::text, prospect_id::text, title, starts_at, ends_at, location, notes, created_at
    FROM public.appointments
    WHERE user_id=${user.id}
    ORDER BY starts_at DESC NULLS LAST, created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));

  const prospect_id = String(b.prospect_id || '').trim();
  if (!prospect_id) return NextResponse.json({ error: 'prospect_id required' }, { status: 400 });

  const title = String(b.title || '').trim();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const starts_at = toISOOrNull(b.starts_at || null);
  const ends_at = toISOOrNull(b.ends_at || null);
  if (!starts_at || !ends_at) return NextResponse.json({ error: 'starts_at/ends_at required' }, { status: 400 });

  const location = b.location ? String(b.location) : null;
  const notes = b.notes ? String(b.notes) : null;

  const rows = await q`
    INSERT INTO public.appointments
      (user_id, prospect_id, title, starts_at, ends_at, location, notes, created_at)
    VALUES
      (${user.id}, ${prospect_id}::uuid, ${title}, ${starts_at}, ${ends_at}, ${location}, ${notes}, NOW())
    RETURNING
      id::text, prospect_id::text, title, starts_at, ends_at, location, notes, created_at
  `;
  return NextResponse.json(rows[0]);
}
