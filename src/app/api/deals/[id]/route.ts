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
    'probability',
    'stage',
    'expected_close_at',
    'heat',
    'notes',
  ];

  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;

  for (const key of fields) {
    if (body[key] !== undefined) {
      if (key === 'stage') {
        // Stage updates may adjust won_at automatically
        sets.push(`stage = $${i}`);
        vals.push(body[key]);
        i++;
        if (body[key] === 'won') {
          sets.push(`won_at = NOW()`);
        } else if (body[key] !== 'won') {
          sets.push(`won_at = NULL`);
        }
      } else {
        sets.push(`${key} = $${i++}`);
        vals.push(body[key]);
      }
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const sql = `UPDATE deals SET ${sets.join(', ')} WHERE id = $${i} RETURNING *;`;
  vals.push(id);

  const rows = await q(sql, vals);
  if (!rows[0]) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }
  return NextResponse.json(toJSONSafe(rows[0]));
}
