import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const id = params.id;
  const body = await req.json();

  const fields = [
    'name',
    'amount',
    'actual_amount',
    'stage',
    'expected_close_date',
    'notes',
  ];

  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;

  for (const key of fields) {
    if (body[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      vals.push(body[key]);
    }
  }
  sets.push(`updated_at = now()`);

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const sql = `UPDATE deals SET ${sets.join(', ')} WHERE id = $${i} RETURNING *;`;
  vals.push(id);

  const { rows } = await q(sql, vals);
  if (!rows[0]) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }
  return NextResponse.json(toJSONSafe(rows[0]));
}
