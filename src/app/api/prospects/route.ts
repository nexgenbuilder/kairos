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
