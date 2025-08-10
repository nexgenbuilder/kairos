'use client';

import useSWR from 'swr';

type CashSummary = {
  revenue: number;
  pipeline: number;
};

type MonthlyRow = {
  month: string;      // ISO date from API (YYYY-MM-01)
  revenue: number;
  pipeline: number;
};

type APIResponse = {
  summary: CashSummary;
  monthly: MonthlyRow[];
};

const fetcher = async (u: string): Promise<APIResponse> => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text().catch(() => 'Request failed'));
  return r.json();
};

const money = (n: number | string | null | undefined) =>
  `$${Number(n ?? 0).toFixed(2)}`;

export default function CashflowPage() {
  const { data, error, isLoading } = useSWR<APIResponse>('/api/cashflow', fetcher);

  const summary = data?.summary ?? { revenue: 0, pipeline: 0 };
  const monthly = data?.monthly ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cashflow</h1>

      {error ? (
        <div className="rounded border bg-red-50 p-3 text-red-700">
          Failed to load: {String(error.message || error)}
        </div>
      ) : isLoading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Total Revenue (Won)</div>
              <div className="text-2xl font-semibold">{money(summary.revenue)}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Projected Pipeline</div>
              <div className="text-2xl font-semibold">{money(summary.pipeline)}</div>
            </div>
          </div>

          {/* Monthly table */}
          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-right">Revenue (Won)</th>
                  <th className="p-2 text-right">Projected Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={3}>
                      No data yet.
                    </td>
                  </tr>
                ) : (
                  monthly.map((m) => {
                    const monthLabel = new Date(m.month).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                    });
                    return (
                      <tr key={m.month} className="border-b hover:bg-gray-50">
                        <td className="p-2">{monthLabel}</td>
                        <td className="p-2 text-right">{money(m.revenue)}</td>
                        <td className="p-2 text-right">{money(m.pipeline)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
