// src/app/api/prospects/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT id::text, name, email, phone, company, notes, stage, created_at
    FROM public.prospects
    WHERE id=${params.id}::uuid AND user_id=${user.id}
  `;
  return rows[0] ? NextResponse.json(rows[0]) : NextResponse.json({ error: 'not found' }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const rows = await q(`
    UPDATE public.prospects SET
      name=COALESCE($3,name),
      email=COALESCE($4,email),
      phone=COALESCE($5,phone),
      company=COALESCE($6,company),
      notes=COALESCE($7,notes),
      stage=COALESCE($8,stage)
    WHERE id=$1::uuid AND user_id=$2
    RETURNING id::text, name, email, phone, company, notes, stage, created_at;
  `, [params.id, user.id, b.name, b.email, b.phone, b.company, b.notes, b.stage]);
  return rows[0] ? NextResponse.json(rows[0]) : NextResponse.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  // cascades will remove related deals/appointments/interactions/transactions via FKs
  const rows = await q`DELETE FROM public.prospects WHERE id=${params.id}::uuid AND user_id=${user.id} RETURNING id`;
  return rows[0] ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'not found' }, { status: 404 });
}


