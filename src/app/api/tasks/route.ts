// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

// GET /api/tasks  -> returns an array of tasks (JSON serializable)
export async function GET() {
  // keep it simple; the UI can compute metrics for now
  const rows = await q`select * from tasks order by created_at desc`;
  return NextResponse.json(toJSONSafe(rows));
}

// POST /api/tasks  -> create a task and return the created row
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    title,
    status = 'active',         // 'inactive' | 'active' | 'completed' | 'abandoned'
    category = null,           // text
    notes = null,              // text
    started_at = null,         // ISO string or null
    completed_at = null,       // ISO string or null
  } = body ?? {};

  if (!title || String(title).trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const rows = await q`
    insert into tasks (title, status, category, notes, started_at, completed_at)
    values (${title}, ${status}, ${category}, ${notes}, ${started_at}, ${completed_at})
    returning *
  `;

  return NextResponse.json(toJSONSafe(rows[0]));
}

// PATCH /api/tasks  -> optional bulk updates in future


