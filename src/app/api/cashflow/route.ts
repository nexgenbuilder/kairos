import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export async function GET() {
  const dealSummary = await q`
    select
      coalesce(sum(case when stage = 'won'
                        then coalesce(actual_amount, amount)
                        else 0 end), 0)::double precision as revenue,
      coalesce(sum(case when stage <> 'lost'
                        then amount * probability
                        else 0 end), 0)::double precision as pipeline
    from deals
  `;
  const txSummary = await q`select coalesce(sum(amount),0)::double precision as tx from transactions`;
  const summary = {
    revenue: Number(dealSummary[0]?.revenue || 0) + Number(txSummary[0]?.tx || 0),
    pipeline: Number(dealSummary[0]?.pipeline || 0),
  };

  const monthly = await q`
    with deals as (
      select
        date_trunc('month', coalesce(won_at, expected_close_at, created_at))::date as month,
        sum(case when stage = 'won'
                 then coalesce(actual_amount, amount)
                 else 0 end)::double precision as revenue,
        sum(case when stage <> 'lost'
                 then amount * probability
                 else 0 end)::double precision as pipeline
      from deals
      group by 1
    ),
    tx as (
      select date_trunc('month', occurred_at)::date as month,
             sum(amount)::double precision as revenue
      from transactions
      group by 1
    ),
    months as (
      select month from deals
      union
      select month from tx
    )
    select m.month,
           coalesce(d.revenue,0) + coalesce(t.revenue,0) as revenue,
           coalesce(d.pipeline,0) as pipeline
    from months m
    left join deals d on d.month = m.month
    left join tx t on t.month = m.month
    order by m.month
  `;

  return NextResponse.json({ summary, monthly });
}

