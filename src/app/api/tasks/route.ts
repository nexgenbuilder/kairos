import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT
      t.id, t.title, t.description, t.category_id, c.name AS category_name,
      t.priority, t.status_select AS status, t.created_at, t.activated_at, t.completed_at, t.updated_at
    FROM public.tasks t
    LEFT JOIN public.task_categories c ON c.id = t.category_id AND c.user_id = ${user.id}
    WHERE t.user_id = ${user.id}
    ORDER BY t.created_at DESC
  `;
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const priority = ['low','medium','high'].includes(String(b.priority)) ? String(b.priority) : 'medium';
  const status = ['inactive','active','completed'].includes(String(b.status ?? b.status_select)) ? String(b.status ?? b.status_select) : 'inactive';

  const rows = await q`
    INSERT INTO public.tasks (user_id, title, description, category_id, priority, status_select, created_at, updated_at)
    VALUES (${user.id}, ${b.title ?? ''}, ${b.description ?? null}, ${b.category_id ?? null},
            ${priority}, ${status}, NOW(), NOW())
    RETURNING id, title, description, category_id, priority, status_select AS status,
              created_at, activated_at, completed_at, updated_at
  `;
  return NextResponse.json(toJSONSafe(rows[0]));
}



