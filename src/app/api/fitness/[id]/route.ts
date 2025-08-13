// src/app/api/fitness/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const id = params.id;
  const b = await req.json().catch(() => ({}));

  const occurred_at = b.occurred_at === undefined ? undefined : new Date(b.occurred_at);
  const activity = b.activity === undefined ? undefined : (b.activity ? String(b.activity) : null);
  const sets = b.sets === undefined ? undefined : Number(b.sets);
  const reps = b.reps === undefined ? undefined : Number(b.reps);
  const distance = b.distance === undefined ? undefined : Number(b.distance);
  const duration_minutes = b.duration_minutes === undefined ? undefined : Number(b.duration_minutes);
  const notes = b.notes === undefined ? undefined : (b.notes ? String(b.notes) : null);

  const rows = await q`
    UPDATE public.fitness_entries
    SET
      occurred_at      = COALESCE(${occurred_at}, occurred_at),
      activity         = COALESCE(${activity}, activity),
      sets             = COALESCE(${sets}, sets),
      reps             = COALESCE(${reps}, reps),
      distance         = COALESCE(${distance}, distance),
      duration_minutes = COALESCE(${duration_minutes}, duration_minutes),
      notes            = COALESCE(${notes}, notes),
      updated_at       = NOW()
    WHERE id=${id}::uuid AND user_id=${user.id}
    RETURNING id::text, occurred_at, activity, sets, reps, distance, duration_minutes, notes, created_at, updated_at
  `;
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(toJSONSafe(rows[0]));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const id = params.id;
  const rows = await q`
    DELETE FROM public.fitness_entries
    WHERE id=${id}::uuid AND user_id=${user.id}
    RETURNING id
  `;
  if (!rows[0]) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true });
}
