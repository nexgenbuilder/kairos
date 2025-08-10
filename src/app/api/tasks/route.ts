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
    ORDER BY created_at DESC
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
      completed_at
  `;

  return NextResponse.json(toJSONSafe(rows[0]));
}

// PATCH /api/tasks  -> optional bulk updates in future


