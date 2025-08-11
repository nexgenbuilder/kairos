'use client';

import useSWR from 'swr';
import { useState } from 'react';

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

type Transaction = {
  id: string;
  amount: number;
  description: string | null;
  occurred_at: string;
};

const fetcher = async (u: string) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text().catch(() => 'Request failed'));
  return r.json();
};

const money = (n: number | string | null | undefined) =>
  `$${Number(n ?? 0).toFixed(2)}`;

export default function CashflowPage() {
  const { data, error, isLoading, mutate } = useSWR<APIResponse>('/api/cashflow', fetcher);
  const { data: txs, mutate: mutateTx } = useSWR<Transaction[]>('/api/transactions', fetcher);

  const summary = data?.summary ?? { revenue: 0, pipeline: 0 };
  const monthly = data?.monthly ?? [];

  const [tForm, setTForm] = useState({ amount: '', description: '', occurred_at: '' });

  async function addTx(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(tForm.amount),
        description: tForm.description || null,
        occurred_at: tForm.occurred_at || undefined,
      }),
    });
    if (res.ok) {
      setTForm({ amount: '', description: '', occurred_at: '' });
      await mutateTx();
      await mutate();
    } else {
      const err = await res.text().catch(() => '');
      alert('Save failed: ' + err);
      return;
    }
  }

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
              <div className="text-xs text-gray-500">Total Revenue</div>
              <div className="text-2xl font-semibold">{money(summary.revenue)}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-gray-500">Projected Pipeline</div>
              <div className="text-2xl font-semibold">{money(summary.pipeline)}</div>
            </div>
          </div>

          {/* Add Transaction */}
          <form onSubmit={addTx} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
            <input
              className="rounded border p-2"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={tForm.amount}
              onChange={e => setTForm({ ...tForm, amount: e.target.value })}
              required
            />
            <input
              className="rounded border p-2 md:col-span-2"
              placeholder="Description"
              value={tForm.description}
              onChange={e => setTForm({ ...tForm, description: e.target.value })}
            />
            <input
              className="rounded border p-2"
              type="date"
              value={tForm.occurred_at}
              onChange={e => setTForm({ ...tForm, occurred_at: e.target.value })}
            />
            <button className="rounded bg-black px-4 py-2 text-white md:col-span-4">Add Transaction</button>
          </form>

          {/* Transactions list */}
          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {txs?.length ? (
                  txs.map(t => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{new Date(t.occurred_at).toLocaleDateString()}</td>
                      <td className="p-2 text-right">{money(t.amount)}</td>
                      <td className="p-2">{t.description ?? ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={3}>No transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Monthly table */}
          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Month</th>
                  <th className="p-2 text-right">Revenue</th>
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
