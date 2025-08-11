// src/app/api/prospects/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const rows = await q(
    `SELECT * FROM prospects WHERE id=$1 AND user_id=$2 LIMIT 1`,
    [params.id, user.id]
  );
  return rows[0] ? NextResponse.json(rows[0]) : NextResponse.json({ error: 'not found' }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const b = await req.json();
  const rows = await q(
    `
    UPDATE prospects SET
      name=COALESCE($3,name), email=COALESCE($4,email), phone=COALESCE($5,phone),
      company=COALESCE($6,company), notes=COALESCE($7,notes),
      stage=COALESCE($8,stage), updated_at=NOW()
    WHERE id=$1 AND user_id=$2
    RETURNING *;
    `,
    [params.id, user.id, b.name, b.email, b.phone, b.company, b.notes, b.stage]
  );
  return rows[0] ? NextResponse.json(rows[0]) : NextResponse.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const rows = await q(`DELETE FROM prospects WHERE id=$1 AND user_id=$2 RETURNING id`, [params.id, user.id]);
  return rows[0]
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'not found' }, { status: 404 });
}


