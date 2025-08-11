// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high']);
const ALLOWED_STATUS = new Set(['inactive', 'active', 'completed']);

// GET /api/tasks  -> returns an array of tasks (JSON serializable)
export async function GET() {
  const rows = await q`
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
    FROM tasks t
    LEFT JOIN task_categories c ON c.id = t.category_id
    ORDER BY t.created_at DESC
  `;
  return NextResponse.json(toJSONSafe(rows));
}

// POST /api/tasks  -> create a task and return the created row
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let { title, description = null, category_id = null, priority = 'medium', status = 'inactive' } = body ?? {};

  if (!title || String(title).trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  priority = String(priority).toLowerCase();
  if (!ALLOWED_PRIORITY.has(priority)) priority = 'medium';

  status = String(status).toLowerCase();
  if (!ALLOWED_STATUS.has(status)) status = 'inactive';

  const rows = await q`
    INSERT INTO tasks (title, description, category_id, priority, status_select)
    VALUES (${title}, ${description}, ${category_id}, ${priority}, ${status})
    RETURNING
      id,
      title,
      description,
      category_id,
      priority,
      status_select AS status,
      created_at,
      activated_at,
      completed_at,
      updated_at
  `;

  const task = rows[0];
  if (task?.category_id) {
    const cat = await q`SELECT name FROM task_categories WHERE id = ${task.category_id}`;
    task.category_name = cat[0]?.name ?? null;
  }

  return NextResponse.json(toJSONSafe(task));
}

// PATCH /api/tasks  -> optional bulk updates in future


