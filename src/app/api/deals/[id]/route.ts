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
    'won_at',
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

  if (body.stage !== undefined && body.won_at === undefined) {
    sets.push(`won_at = $${i++}`);
    vals.push(body.stage === 'won' ? new Date().toISOString() : null);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const sql = `UPDATE deals SET ${sets.join(', ')} WHERE id = $${i} RETURNING *;`;
  vals.push(id);

  const rows = await q(sql, vals);
  const deal = rows[0];
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  // Sync transactions so cashflow reflects won deals
  await q`DELETE FROM public.transactions WHERE deal_id = ${deal.id}`;
  if (deal.stage === 'won') {
    const amt = deal.actual_amount ?? deal.amount;
    await q`
      INSERT INTO public.transactions
        (deal_id, prospect_id, type, amount, occurred_at, description, category)
      VALUES
        (${deal.id}, ${deal.prospect_id}, 'income', ${amt}, ${deal.won_at || new Date().toISOString()}, ${deal.name}, 'deal')
    `;
  }

  return NextResponse.json(toJSONSafe(deal));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id || id.length < 10) {
    return NextResponse.json({ error: 'Invalid deal id' }, { status: 400 });
  }

  // With FK ON DELETE CASCADE on transactions(deal_id), related transactions are removed automatically.
  const rows = await q('DELETE FROM public.deals WHERE id = $1 RETURNING id', [id]);
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, deleted: 0 }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deleted: rows.length });
}
