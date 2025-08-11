// src/app/api/deals/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const url = new URL(req.url);
  const prospectId = url.searchParams.get('prospect_id');

  if (prospectId) {
    const rows = await q`
      SELECT * FROM deals
      WHERE user_id=${user.id} AND prospect_id=${prospectId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  }

  const rows = await q`
    SELECT * FROM deals
    WHERE user_id=${user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json();

  const rows = await q`
    INSERT INTO deals (id, user_id, prospect_id, name, amount, actual_amount, probability, stage, expected_close_at, heat, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), ${user.id}, ${b.prospect_id ?? null}, ${b.name ?? null},
            ${b.amount ?? 0}, ${b.actual_amount ?? null}, ${b.probability ?? 0},
            ${b.stage ?? 'new'}, ${b.expected_close_at ?? null}, ${b.heat ?? null}, ${b.notes ?? null},
            NOW(), NOW())
    RETURNING *;
  `;
  return NextResponse.json(rows[0]);
}
