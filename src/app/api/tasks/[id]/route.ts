import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

type Ctx = { params: { id: string } };
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high']);

/** GET /api/tasks/[id] */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = params;
  const rows = await q(
    `
    SELECT
      id,
      title,
      description,
      category_id,
      priority,
      status_select AS status,
      created_at,
      activated_at,
      completed_at
    FROM tasks
    WHERE id = $1
    `,
    [id]
  );
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

/** PATCH /api/tasks/[id] — partial update (status + fields) */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = params;
  const b = await req.json();

  // Normalize inputs
  const title = b.title !== undefined ? (b.title === null ? null : String(b.title)) : undefined;
  const description = b.description === undefined ? undefined : (b.description ?? null);
  const category_id = b.category_id === undefined ? undefined : (b.category_id ?? null);

  // Priority is NOT NULL in DB; only update if provided & valid
  let priority: string | undefined = undefined;
  if (b.priority !== undefined) {
    const pin = String(b.priority ?? '').toLowerCase();
    if (ALLOWED_PRIORITY.has(pin)) priority = pin;
    else priority = undefined; // ignore invalid/blank to avoid NOT NULL issues
  }

  // Status via status_select; only update if provided & valid
  let status: 'inactive' | 'active' | 'completed' | undefined = undefined;
  if (b.status !== undefined || b.status_select !== undefined) {
    const s = String(b.status_select ?? b.status ?? '').toLowerCase();
    if (s === 'inactive' || s === 'active' || s === 'completed') status = s as any;
  }

  const rows = await q(
    `
    UPDATE tasks
    SET
      title         = COALESCE($2, title),
      description   = COALESCE($3, description),
      category_id   = COALESCE($4, category_id),
      priority      = COALESCE($5, priority),
      status_select = COALESCE($6, status_select),
      activated_at  = CASE
        WHEN $6 IS NULL THEN activated_at
        WHEN $6::text = 'active'    AND activated_at IS NULL THEN NOW()
        WHEN $6::text <> 'active'   THEN NULL
        ELSE activated_at
      END,
      completed_at  = CASE
        WHEN $6 IS NULL THEN completed_at
        WHEN $6::text = 'completed' THEN NOW()
        WHEN $6::text <> 'completed' THEN NULL
        ELSE completed_at
      END
    WHERE id = $1
    RETURNING
      id, title, description, category_id, priority,
      status_select AS status, created_at, activated_at, completed_at;
    `,
    [id, title as any, description as any, category_id as any, priority as any, status as any]
  );

  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

/** DELETE /api/tasks/[id] */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = params;
  const { rowCount } = await q(`DELETE FROM tasks WHERE id = $1`, [id]);
  return rowCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'not found' }, { status: 404 });
}



