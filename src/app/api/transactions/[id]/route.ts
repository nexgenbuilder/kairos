// src/app/api/transactions/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req);
  const idTxt = (params.id ?? '').trim();
  if (!idTxt) {
    return NextResponse.json({ error: 'Invalid transaction id' }, { status: 400 });
  }

  // Works for both integer and uuid ids by comparing as text
  const rows = await q(
    `DELETE FROM public.transactions
     WHERE user_id = $1 AND id::text = $2
     RETURNING id`,
    [user.id, idTxt]
  );

  if (!rows[0]) {
    return NextResponse.json({ ok: false, deleted: 0 }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deleted: 1 });
}

