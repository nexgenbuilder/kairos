import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`SELECT id, name FROM public.task_categories WHERE user_id=${user.id} ORDER BY name ASC`;
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const rows = await q`
    INSERT INTO public.task_categories (user_id, name)
    VALUES (${user.id}, ${b.name ?? 'General'})
    RETURNING id, name
  `;
  return NextResponse.json(toJSONSafe(rows[0]));
}

