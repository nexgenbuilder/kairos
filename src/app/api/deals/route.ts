// src/app/api/deals/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get('prospect_id');

  if (pid) {
    const rows = await q`
      SELECT
        id::text, prospect_id::text, name, amount, probability, stage,
        expected_close_at, actual_amount, won_at, heat, created_at, updated_at, notes
      FROM public.deals
      WHERE user_id=${user.id} AND prospect_id=${pid}::uuid
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  }

  const rows = await q`
    SELECT
      id::text, prospect_id::text, name, amount, probability, stage,
      expected_close_at, actual_amount, won_at, heat, created_at, updated_at, notes
    FROM public.deals
    WHERE user_id=${user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));

  const prospect_id = String(b.prospect_id || '').trim();
  if (!prospect_id) return NextResponse.json({ error: 'prospect_id required' }, { status: 400 });

  const name = String(b.name || '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const amount = Number(b.amount || 0);
  const probability = Math.max(0, Math.min(1, Number(b.probability || 0)));
  const expected_close_at = b.expected_close_at ? new Date(b.expected_close_at).toISOString() : null;
  const heat = (b.heat || 'warm') as 'cold' | 'warm' | 'hot' | 'on_hold';
  const notes = b.notes ? String(b.notes) : null;
  const stage = 'open';

  const rows = await q`
    INSERT INTO public.deals
      (user_id, prospect_id, name, amount, probability, stage,
       expected_close_at, actual_amount, won_at, heat, created_at, updated_at, notes)
    VALUES
      (${user.id}, ${prospect_id}::uuid, ${name}, ${amount}, ${probability}, ${stage},
       ${expected_close_at}, NULL, NULL, ${heat}, NOW(), NOW(), ${notes})
    RETURNING
      id::text, prospect_id::text, name, amount, probability, stage,
      expected_close_at, actual_amount, won_at, heat, created_at, updated_at, notes
  `;
  return NextResponse.json(rows[0]);
}


