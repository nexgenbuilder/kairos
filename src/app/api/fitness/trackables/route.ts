// src/app/api/fitness/trackables/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

// GET /api/fitness/trackables
export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT activity, category
    FROM public.fitness_trackables
    WHERE user_id=${user.id}
    ORDER BY COALESCE(category,'~'), activity
  `;
  return NextResponse.json(rows);
}

// POST /api/fitness/trackables { category, activity }
export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const activity = String(b.activity ?? '').trim();
  const category = b.category ? String(b.category).trim() : null;

  if (!activity) return NextResponse.json({ error: 'activity required' }, { status: 400 });

  // upsert on (user_id, activity); update category if provided
  const rows = await q`
    INSERT INTO public.fitness_trackables (user_id, activity, category, created_at)
    VALUES (${user.id}, ${activity}, ${category}, NOW())
    ON CONFLICT (user_id, activity)
    DO UPDATE SET category = COALESCE(EXCLUDED.category, public.fitness_trackables.category)
    RETURNING activity, category
  `;
  return NextResponse.json(rows[0] ?? { activity, category });
}

// DELETE /api/fitness/trackables?activity=Pushups
export async function DELETE(req: Request) {
  const user = await requireUser(req);
  const u = new URL(req.url);
  const activity = String(u.searchParams.get('activity') ?? '').trim();
  if (!activity) return NextResponse.json({ error: 'activity required' }, { status: 400 });
  await q`DELETE FROM public.fitness_trackables WHERE user_id=${user.id} AND activity=${activity}`;
  return NextResponse.json({ ok: true });
}

