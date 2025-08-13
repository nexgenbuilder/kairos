// src/app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { toJSONSafe } from '@/lib/json';

const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high']);

type Ctx = { params: { id: string } };

/** GET single (user-scoped) */
export async function GET(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const { id } = params;
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
    LEFT JOIN public.task_categories c ON c.id = t.category_id
    WHERE t.id = ${id}::uuid AND t.user_id = ${user.id}
  `;
  return rows[0] ? NextResponse.json(toJSONSafe(rows[0])) : NextResponse.json({ error: 'not found' }, { status: 404 });
}

/** PATCH partial update */
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const { id } = params;
  const b = await req.json().catch(() => ({}));

  // Normalize inputs
  const title = b.title !== undefined ? (b.title === null ? null : String(b.title)) : undefined;
  const description = b.description === undefined ? undefined : (b.description ?? null);

  let category_id: string | undefined = undefined;
  if (b.category_id !== undefined) {
    category_id = b.category_id ? String(b.category_id) : null;
    // validate belongs to user if provided
    if (category_id) {
      const ok = await q`
        SELECT 1 FROM public.task_categories WHERE id=${category_id}::uuid AND user_id=${user.id} LIMIT 1
      `;
      if (!ok[0]) category_id = null;
    }
  }

  // priority
  let priority: string | undefined = undefined;
  if (b.priority !== undefined) {
    const pin = String(b.priority ?? '').toLowerCase();
    if (ALLOWED_PRIORITY.has(pin)) priority = pin;
  }

  // status via status_select
  let status: 'inactive' | 'active' | 'completed' | undefined = undefined;
  if (b.status !== undefined || b.status_select !== undefined) {
    const s = String(b.status_select ?? b.status ?? '').toLowerCase();
    if (s === 'inactive' || s === 'active' || s === 'completed') status = s as any;
  }

  const rows = await q(
    `
    UPDATE public.tasks
    SET
      title         = COALESCE($3, title),
      description   = COALESCE($4, description),
      category_id   = COALESCE($5::uuid, category_id),
      priority      = COALESCE($6, priority),
      status_select = COALESCE($7, status_select),
      activated_at  = CASE
        WHEN $7 IS NULL THEN activated_at
        WHEN $7::text = 'active'    AND activated_at IS NULL THEN NOW()
        WHEN $7::text <> 'active'   THEN NULL
        ELSE activated_at
      END,
      completed_at  = CASE
        WHEN $7 IS NULL THEN completed_at
        WHEN $7::text = 'completed' THEN NOW()
        WHEN $7::text <> 'completed' THEN NULL
        ELSE completed_at
      END,
      updated_at = NOW()
    WHERE id = $1::uuid AND user_id = $2
    RETURNING
      id::text, title, description, category_id::text, priority,
      status_select AS status, created_at, activated_at, completed_at, updated_at;
    `,
    [id, user.id, title as any, description as any, category_id as any, priority as any, status as any]
  );

  const task = rows[0];
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (task.category_id) {
    const cat = await q`SELECT name FROM public.task_categories WHERE id = ${task.category_id}::uuid`;
    task.category_name = cat[0]?.name ?? null;
  }
  return NextResponse.json(toJSONSafe(task));
}

/** DELETE (user-scoped) */
export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const { id } = params;
  const rows = await q`
    DELETE FROM public.tasks WHERE id = ${id}::uuid AND user_id = ${user.id} RETURNING id
  `;
  return rows[0]
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'not found' }, { status: 404 });
}

