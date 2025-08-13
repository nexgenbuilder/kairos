// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { toJSONSafe } from '@/lib/json';

const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high']);

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT
      t.id::text,
      t.title,
      t.description,
      t.category_id::text,
      c.name AS category_name,
      t.priority,
      t.status_select AS status,
      t.created_at,
      t.activated_at,
      t.completed_at,
      t.updated_at
    FROM public.tasks t
    LEFT JOIN public.task_categories c
      ON c.id = t.category_id
    WHERE t.user_id = ${user.id}
    ORDER BY COALESCE(t.activated_at, t.created_at) DESC
  `;
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));

  const title = String(b.title ?? '').trim();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  let category_id: string | null = b.category_id ? String(b.category_id) : null;
  if (category_id) {
    const ok = await q`
      SELECT 1 FROM public.task_categories WHERE id = ${category_id}::uuid AND user_id = ${user.id} LIMIT 1
    `;
    if (!ok[0]) category_id = null;
  }

  let priority = 'medium';
  const inPriority = String(b.priority ?? '').toLowerCase();
  if (ALLOWED_PRIORITY.has(inPriority)) priority = inPriority;

  const description = b.description ? String(b.description) : null;

  const rows = await q`
    INSERT INTO public.tasks
      (user_id, title, description, category_id, priority, status_select, created_at, updated_at)
    VALUES
      (${user.id}, ${title}, ${description}, ${category_id}, ${priority}, 'inactive', NOW(), NOW())
    RETURNING
      id::text, title, description, category_id::text, priority,
      status_select AS status, created_at, activated_at, completed_at, updated_at
  `;
  const task = rows[0];
  if (task?.category_id) {
    const cat = await q`SELECT name FROM public.task_categories WHERE id = ${task.category_id}::uuid`;
    task.category_name = cat[0]?.name ?? null;
  }
  return NextResponse.json(toJSONSafe(task));
}
