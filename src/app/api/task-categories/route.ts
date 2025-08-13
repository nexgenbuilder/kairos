// src/app/api/task-categories/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT id::text, name
    FROM public.task_categories
    WHERE user_id = ${user.id}
    ORDER BY name
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const raw = String(b.name ?? '').trim();
  if (!raw) return NextResponse.json({ error: 'name required' }, { status: 400 });

  // per-user unique: ON CONFLICT (user_id, name)
  const rows = await q`
    INSERT INTO public.task_categories (user_id, name)
    VALUES (${user.id}, ${raw})
    ON CONFLICT (user_id, name) DO NOTHING
    RETURNING id::text, name
  `;
  if (rows[0]) return NextResponse.json(rows[0]);

  // existed already; fetch it so UI can still select it
  const existing = await q`
    SELECT id::text, name
    FROM public.task_categories
    WHERE user_id = ${user.id} AND name = ${raw}
    LIMIT 1
  `;
  return NextResponse.json(existing[0] ?? { id: null, name: raw });
}


