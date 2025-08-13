// src/app/api/content/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { toJSONSafe } from '@/lib/json';

const ALLOWED_STATUS = new Set(['draft', 'scheduled', 'published']);
const ALLOWED_TYPE = new Set(['post', 'video', 'idea', 'other']);

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT
      id::text, user_id::text, title, type, status, url, notes,
      created_at, updated_at
    FROM public.content_pieces
    WHERE user_id=${user.id}
    ORDER BY updated_at DESC, created_at DESC
  `;
  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => ({}));

  const title = String(body.title ?? '').trim();
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  let type = String(body.type ?? 'idea').toLowerCase();
  if (!ALLOWED_TYPE.has(type)) type = 'idea';

  let status = String(body.status ?? 'draft').toLowerCase();
  if (!ALLOWED_STATUS.has(status)) status = 'draft';

  const url = body.url ? String(body.url) : null;
  const notes = body.notes ? String(body.notes) : null;

  const rows = await q`
    INSERT INTO public.content_pieces (user_id, title, type, status, url, notes)
    VALUES (${user.id}, ${title}, ${type}, ${status}, ${url}, ${notes})
    RETURNING id::text, user_id::text, title, type, status, url, notes,
              created_at, updated_at
  `;
  return NextResponse.json(toJSONSafe(rows[0]));
}
