import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const { rows } = await q(`SELECT * FROM prospects WHERE id=$1`, [params.id]);
  return rows[0] ? NextResponse.json(rows[0]) : NextResponse.json({ error: 'not found' }, { status: 404 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const b = await req.json();
  const { rows } = await q(`
    UPDATE prospects SET
      name=COALESCE($2,name), email=COALESCE($3,email), phone=COALESCE($4,phone),
      company=COALESCE($5,company), notes=COALESCE($6,notes),
      stage=COALESCE($7,stage), updated_at=NOW()
    WHERE id=$1
    RETURNING *;`,
    [params.id, b.name, b.email, b.phone, b.company, b.notes, b.stage]
  );
  return rows[0] ? NextResponse.json(rows[0]) : NextResponse.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { rowCount } = await q(`DELETE FROM prospects WHERE id=$1`, [params.id]);
  return rowCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'not found' }, { status: 404 });
}
