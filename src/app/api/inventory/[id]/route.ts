// src/app/api/inventory/[id]/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

type Ctx = { params: { id: string } };

/** PATCH /api/inventory/[id] — partial update */
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const id = String(params.id || '').trim();
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  const fields = ['name','sku','qty','unit_cost','unit_price','category','location','notes'] as const;
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;

  for (const f of fields) {
    if (body[f] !== undefined) {
      sets.push(`${f} = $${i++}`);
      if (f === 'qty' || f === 'unit_cost' || f === 'unit_price') {
        vals.push(body[f] === null ? null : Number(body[f]));
      } else {
        vals.push(body[f] === null ? null : String(body[f]));
      }
    }
  }
  sets.push(`updated_at = NOW()`);

  const sql = `
    UPDATE public.inventory_items
    SET ${sets.join(', ')}
    WHERE id = $${i}::uuid AND user_id = $${i + 1}::uuid
    RETURNING id::text, name, sku, qty, unit_cost, unit_price, category, location, notes, created_at, updated_at
  `;
  vals.push(id, user.id);

  const rows = await q(sql, vals);
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

/** DELETE /api/inventory/[id] */
export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireUser(req);
  const id = String(params.id || '').trim();
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const rows = await q(
    `DELETE FROM public.inventory_items WHERE id = $1::uuid AND user_id = $2::uuid RETURNING id`,
    [id, user.id]
  );

  return rows[0]
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'not found' }, { status: 404 });
}

