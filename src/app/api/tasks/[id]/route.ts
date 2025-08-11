import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';
import { requireUser } from '@/lib/auth';

type Ctx = { params: { id: string } };
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high']);

export async function GET(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const rows = await q(
    `
    SELECT
      t.id,
      t.title,
      t.description,
      t.category_id,
      c.name AS category_name,
      t.priority,
      t.status_select AS status,
      t.created_at,
      t.activated_at,
      t.completed_at,
      t.updated_at
    FROM public.tasks t
    LEFT JOIN public.task_categories c ON c.id = t.category_id AND c.user_id=$2
    WHERE t.id = $1 AND t.user_id = $2
    `,
    [params.id, user.id]
  );
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(toJSONSafe(rows[0]));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const b = await req.json();

  const title = b.title !== undefined ? (b.title === null ? null : String(b.title)) : undefined;
  const description = b.description === undefined ? undefined : (b.description ?? null);
  const category_id = b.category_id === undefined ? undefined : (b.category_id ?? null);

  let priority: string | undefined = undefined;
  if (b.priority !== undefined) {
    const pin = String(b.priority ?? '').toLowerCase();
    if (ALLOWED_PRIORITY.has(pin)) priority = pin;
  }

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
      category_id   = COALESCE($5, category_id),
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
    WHERE id = $1 AND user_id = $2
    RETURNING id, title, description, category_id, priority,
              status_select AS status, created_at, activated_at, completed_at, updated_at
    `,
    [params.id, user.id, title as any, description as any, category_id as any, priority as any, status as any]
  );

  const task = rows[0];
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (task.category_id) {
    const cat = await q`SELECT name FROM public.task_categories WHERE id = ${task.category_id} AND user_id=${user.id}`;
    task.category_name = cat[0]?.name ?? null;
  }
  return NextResponse.json(toJSONSafe(task));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const rows = await q(`DELETE FROM public.tasks WHERE id = $1 AND user_id = $2 RETURNING id`, [params.id, user.id]);
  return rows[0]
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'not found' }, { status: 404 });
}




