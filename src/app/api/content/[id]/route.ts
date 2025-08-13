// src/app/api/content/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { toJSONSafe } from '@/lib/json';

const ALLOWED_STATUS = new Set(['draft', 'scheduled', 'published']);
const ALLOWED_TYPE = new Set(['post', 'video', 'idea', 'other']);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  const id = (params.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;

  // title
  if (body.title !== undefined) {
    sets.push(`title = $${i++}`);
    vals.push(body.title === null ? null : String(body.title));
  }
  // type
  if (body.type !== undefined) {
    const t = String(body.type ?? '').toLowerCase();
    sets.push(`type = $${i++}`);
    vals.push(ALLOWED_TYPE.has(t) ? t : 'other');
  }
  // status
  if (body.status !== undefined) {
    const s = String(body.status ?? '').toLowerCase();
    sets.push(`status = $${i++}`);
    vals.push(ALLOWED_STATUS.has(s) ? s : 'draft');
  }
  // url
  if (body.url !== undefined) {
    sets.push(`url = $${i++}`);
    vals.push(body.url === null ? null : String(body.url));
  }
  // notes
  if (body.notes !== undefined) {
    sets.push(`notes = $${i++}`);
    vals.push(body.notes === null ? null : String(body.notes));
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
  }

  // keep updated_at fresh
  sets.push(`updated_at = NOW()`);

  const sql = `
    UPDATE public.content_pieces
    SET ${sets.join(', ')}
    WHERE id::text = $${i++} AND user_id = $${i}
    RETURNING id::text, user_id::text, title, type, status, url, notes,
              created_at, updated_at
  `;
  vals.push(id, user.id);

  const rows = await q(sql, vals);
  if (!rows[0]) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(toJSONSafe(rows[0]));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  const id = (params.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const rows = await q(
    `DELETE FROM public.content_pieces
     WHERE id::text=$1 AND user_id=$2
     RETURNING id`,
    [id, user.id]
  );

  if (!rows[0]) {
    return NextResponse.json({ ok: false, deleted: 0 }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deleted: 1 });
}

