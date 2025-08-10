export async function GET() {
  const summaryRows = await q`
    select
      coalesce(sum(case when stage = 'won'
                        then coalesce(actual_amount, amount)
                        else 0 end), 0)::double precision as revenue,
      coalesce(sum(case when stage <> 'lost'
                        then amount * probability
                        else 0 end), 0)::double precision as pipeline
    from deals
  `;
  const summary = summaryRows[0] ?? { revenue: 0, pipeline: 0 };

  const monthly = await q`
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
    order by 1
  `;

  return NextResponse.json({ summary, monthly });
}

