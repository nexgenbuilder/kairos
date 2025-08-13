
'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

type Tx = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  occurred_at: string;
  category: string | null;
  description: string | null;
  deal_id: string | null;
  prospect_id: string | null;
};
type TxCat = { id: string; name: string };

const fetcher = async (u: string) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text().catch(() => 'Request failed'));
  const json = await r.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray((json as any)?.data)) return (json as any).data;
  if (Array.isArray((json as any)?.rows)) return (json as any).rows;
  return [];
};
const fmt = (s: string) => new Date(s).toLocaleString();

export default function CashflowPage() {
  const swrOpts = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 800 };
  const { data: txs, mutate: refreshTxs } = useSWR<Tx[]>('/api/transactions', fetcher, swrOpts);
  const { data: cats, mutate: refreshCats } = useSWR<TxCat[]>('/api/tx-categories', fetcher, swrOpts);

  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    occurred_at: '',
    category_id: '',
    category_text: '',
    description: '',
  });

  const income = useMemo(() => (txs ?? []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0), [txs]);
  const expense = useMemo(() => (txs ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0), [txs]);
  const net = income - expense;

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const n = form.category_text.trim();
    if (!n) return;
    const res = await fetch('/api/tx-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n }) });
    if (!res.ok) {
      alert('Category failed: ' + (await res.text().catch(() => '')));
      return;
    }
    setForm(f => ({ ...f, category_text: '' }));
    refreshCats();
  }

  async function addTx(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || isNaN(amount)) return alert('Valid amount required');

    // Resolve category name:
    let category: string | null = null;
    if (form.category_id) {
      const found = (cats ?? []).find(c => c.id === form.category_id);
      category = found?.name ?? null;
    } else if (form.category_text.trim()) {
      category = form.category_text.trim();
    }

    const payload = {
      type: form.type,
      amount,
      occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
      description: form.description || null,
      category,
    };

    const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      alert('Create failed: ' + (await res.text().catch(() => '')));
      return;
    }
    setForm({ type: 'expense', amount: '', occurred_at: '', category_id: '', category_text: '', description: '' });
    refreshTxs();
  }

  async function deleteTx(id: string) {
    if (!confirm('Delete this transaction?')) return;
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) refreshTxs();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Cashflow</h1>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Income</div>
          <div className="text-xl font-semibold text-green-700">${income.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Expense</div>
          <div className="text-xl font-semibold text-red-700">-${expense.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Net</div>
          <div className="text-xl font-semibold">{net >= 0 ? `$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}</div>
        </div>
      </div>

      {/* Add Transaction */}
      <form onSubmit={addTx} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-6">
        <select className="rounded border p-2" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
          <option value="expense">expense</option>
          <option value="income">income</option>
        </select>
        <input className="rounded border p-2" placeholder="Amount *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        <input className="rounded border p-2" type="datetime-local" value={form.occurred_at} onChange={e => setForm({ ...form, occurred_at: e.target.value })} />
        <select className="rounded border p-2" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
          <option value="">Choose category</option>
          {(cats ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="rounded border p-2" placeholder="Or new category…" value={form.category_text} onChange={e => setForm({ ...form, category_text: e.target.value })} />
        <Button type="button" onClick={addCategory}>Add Category</Button>

        <input className="rounded border p-2 md:col-span-5" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <Button className="md:col-span-1" type="submit">Add</Button>
      </form>

      {/* Transactions list */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-2">Recent</h2>
        {!txs || txs.length === 0 ? (
          <div className="text-sm text-gray-500">No transactions yet.</div>
        ) : (
          <ul className="divide-y">
            {txs.map(t => (
              <li key={t.id} className="py-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm">
                    <span className={`inline-block min-w-16 rounded px-2 py-0.5 text-xs mr-2 ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {t.type}
                    </span>
                    <span className="font-semibold">{t.type === 'expense' ? '-' : '+'}${Number(t.amount).toFixed(2)}</span>
                    {t.category ? <span className="ml-2 text-xs text-gray-600">#{t.category}</span> : null}
                  </div>
                  <div className="text-xs text-gray-600">{fmt(t.occurred_at)}{t.description ? ` • ${t.description}` : ''}</div>
                </div>
                <div>
                  <Button variant="danger" onClick={() => deleteTx(t.id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
