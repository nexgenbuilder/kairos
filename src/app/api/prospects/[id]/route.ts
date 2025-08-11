// src/app/api/prospects/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  // prospects.id is UUID; passing as text is fine
  const { id } = params;
  if (!id || id.length < 10) {
    return NextResponse.json({ error: 'Invalid prospect id' }, { status: 400 });
  }

  // Thanks to cascading FKs, this will remove related interactions, appointments, deals, and transactions.
  const rows = await q('DELETE FROM public.prospects WHERE id = $1 RETURNING id', [id]);
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, deleted: 0 }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deleted: rows.length });
}

