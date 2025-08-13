import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(_req);
  const id = (params.id || '').trim();
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const rows = await q`
    DELETE FROM public.appointments
    WHERE id = ${id}::uuid AND user_id = ${user.id}
    RETURNING id
  `;
  if (!rows[0]) return NextResponse.json({ ok: false, deleted: 0 }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: 1 });
}
