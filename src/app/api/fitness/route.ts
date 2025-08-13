import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

// GET /api/fitness
export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT
      id::text, occurred_at, activity, sets, reps, distance, duration_minutes,
      notes, created_at, updated_at
    FROM public.fitness_entries
    WHERE user_id=${user.id}
    ORDER BY occurred_at DESC NULLS LAST, created_at DESC
  `;
  return NextResponse.json(rows);
}

// POST /api/fitness
export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));

  const activity = String(b.activity ?? '').trim();
  if (!activity) return NextResponse.json({ error: 'activity required' }, { status: 400 });

  // Allow empty occurred_at -> default NOW()
  const occurred_at: string | null = b.occurred_at ? String(b.occurred_at) : null;

  const sets = b.sets != null ? Number(b.sets) : null;
  const reps = b.reps != null ? Number(b.reps) : null;
  const distance = b.distance != null ? Number(b.distance) : null;
  const duration = b.duration_minutes != null ? Number(b.duration_minutes) : null;
  const notes = b.notes ? String(b.notes) : null;

  const rows = await q`
    INSERT INTO public.fitness_entries
      (user_id, activity, occurred_at, sets, reps, distance, duration_minutes, notes, created_at, updated_at)
    VALUES
      (${user.id}, ${activity}, COALESCE(${occurred_at}::timestamptz, NOW()),
       ${sets}, ${reps}, ${distance}, ${duration}, ${notes}, NOW(), NOW())
    RETURNING
      id::text, occurred_at, activity, sets, reps, distance, duration_minutes, notes, created_at, updated_at
  `;

  return NextResponse.json(rows[0]);
}


