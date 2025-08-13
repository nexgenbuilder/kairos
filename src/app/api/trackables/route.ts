// src/app/api/fitness/trackables/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT activity, category
    FROM public.fitness_trackables
    WHERE user_id=${user.id}
    ORDER BY category, activity
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const rawActivity = String(b.activity ?? '').trim();
  let category = String(b.category ?? '').trim();

  if (!rawActivity) return NextResponse.json({ error: 'activity required' }, { status: 400 });
  if (!category) category = 'Uncategorized'; // never allow null into DB

  const rows = await q`
    INSERT INTO public.fitness_trackables (user_id, activity, category, created_at)
    VALUES (${user.id}, ${rawActivity}, ${category}, NOW())
    ON CONFLICT (user_id, activity)
    DO UPDATE SET category = EXCLUDED.category
    RETURNING activity, category
  `;
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: Request) {
  const user = await requireUser(req);
  const u = new URL(req.url);
  const activity = String(u.searchParams.get('activity') ?? '').trim();
  if (!activity) return NextResponse.json({ error: 'activity required' }, { status: 400 });
  await q`DELETE FROM public.fitness_trackables WHERE user_id=${user.id} AND activity=${activity}`;
  return NextResponse.json({ ok: true });
}

