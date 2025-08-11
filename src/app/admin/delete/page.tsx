'use client';

import { useEffect, useState } from 'react';

type Prospect = { id: string; name: string | null };
type Deal = { id: string; name: string | null; prospect_id: string | null };
type Task = { id: string; title: string | null };
type Tx = { id: number; type: string; amount: string; description: string | null };

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts, credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export default function AdminDeletePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const [p, d, t, x] = await Promise.all([
        api<Prospect[]>('/api/prospects'),
        api<Deal[]>('/api/deals'),
        api<Task[]>('/api/tasks'),
        api<Tx[]>('/api/transactions'),
      ]);
      setProspects(p);
      setDeals(d);
      setTasks(t);
      setTxs(x);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function del(url: string, cb: () => void) {
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      cb();
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Admin • Delete (safe sandbox)</h1>
      {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>}
      {loading ? <div>Loading…</div> : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Prospects</h2>
            <ul className="space-y-2">
              {prospects.map(p => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="truncate">{p.name || p.id}</span>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => del(`/api/prospects/${p.id}`, () => setProspects(ps => ps.filter(x => x.id !== p.id)))}
                  >Delete</button>
                </li>
              ))}
              {prospects.length === 0 && <li className="text-gray-400">None</li>}
            </ul>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Deals</h2>
            <ul className="space-y-2">
              {deals.map(d => (
                <li key={d.id} className="flex items-center justify-between">
                  <span className="truncate">{d.name || d.id}</span>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => del(`/api/deals/${d.id}`, () => setDeals(ds => ds.filter(x => x.id !== d.id)))}
                  >Delete</button>
                </li>
              ))}
              {deals.length === 0 && <li className="text-gray-400">None</li>}
            </ul>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Tasks</h2>
            <ul className="space-y-2">
              {tasks.map(t => (
                <li key={t.id} className="flex items-center justify-between">
                  <span className="truncate">{t.title || t.id}</span>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => del(`/api/tasks/${t.id}`, () => setTasks(ts => ts.filter(x => x.id !== t.id)))}
                  >Delete</button>
                </li>
              ))}
              {tasks.length === 0 && <li className="text-gray-400">None</li>}
            </ul>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold mb-3">Transactions</h2>
            <ul className="space-y-2">
              {txs.map(x => (
                <li key={x.id} className="flex items-center justify-between">
                  <span className="truncate">#{x.id} • {x.type} ${x.amount} • {x.description || '—'}</span>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => del(`/api/transactions/${x.id}`, () => setTxs(xs => xs.filter(xx => xx.id !== x.id)))}
                  >Delete</button>
                </li>
              ))}
              {txs.length === 0 && <li className="text-gray-400">None</li>}
            </ul>
          </section>
        </div>
      )}

      <button
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
        onClick={load}
      >
        Refresh
      </button>
    </div>
  );
}


