import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { toJSONSafe } from '@/lib/json';

export async function GET() {
  const rows = await q`
    select
      p.*,
      coalesce(ic.interactions_count, 0) as interactions_count,
      ic.last_interaction_at
    from prospects p
    left join (
      select
        prospect_id,
        count(*) as interactions_count,
        max(created_at) as last_interaction_at
      from prospect_interactions
      group by prospect_id
    ) ic on ic.prospect_id = p.id
    order by p.created_at desc
  `;

  return NextResponse.json(toJSONSafe(rows));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, phone, company, notes } = body;

  if (!name) {
    return NextResponse.json(
      { error: 'name is required' },
      { status: 400 }
    );
  }

  const sql = `
    INSERT INTO prospects (name, email, phone, company, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const params = [
    name,
    email ?? null,
    phone ?? null,
    company ?? null,
    notes ?? null,
  ];

  const rows = await q(sql, params);
  return NextResponse.json(toJSONSafe(rows[0]));
}
