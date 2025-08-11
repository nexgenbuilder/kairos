// src/app/api/transactions/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const raw = (params.id ?? '').trim();
  if (!raw) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const rows = await q(
    'DELETE FROM public.transactions WHERE id = $1::int RETURNING id',
    [raw]
  );

  if (!rows[0]) {
    return NextResponse.json({ ok: false, deleted: 0 }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deleted: 1 });
}
