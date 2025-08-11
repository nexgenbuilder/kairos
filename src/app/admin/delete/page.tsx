'use client';

import { useEffect, useState } from 'react';

type Tx = { id: number; type: string; amount: string; date: string; category?: string | null; description?: string | null; deal_id?: string | null; prospect_id?: string | null; };
type Task = { id: string; title: string; status?: string; priority?: string; };
type Prospect = { id: string; name: string; email?: string | null; phone?: string | null; };
type Deal = { id: string; prospect_id: string; title?: string | null; stage?: string | null; amount?: string | null; };

export default function AdminDeletePage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [txRes, taskRes, pRes] = await Promise.all([
        fetch('/api/transactions').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/prospects').then(r => r.json()),
      ]);

      setTxs(Array.isArray(txRes) ? txRes.slice(0, 20) : []);
      setTasks(Array.isArray(taskRes) ? taskRes.slice(0, 20) : []);
      setProspects(Array.isArray(pRes) ? pRes.slice(0, 20) : []);

      const dealLists = await Promise.all(
        (Array.isArray(pRes) ? pRes.slice(0, 5) : []).map((p: Prospect) =>
          fetch(`/api/deals?prospect_id=${p.id}`).then(r => r.json()).catch(() => [])
        )
      );
      const flatDeals: Deal[] = [];
      for (const arr of dealLists) {
        if (Array.isArray(arr)) flatDeals.push(...arr);
      }
      setDeals(flatDeals.slice(0, 20));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = async (label: string, url: string) => {
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    let res = await fetch(url, { method: 'DELETE' });
    // Fallback to ?id= if dynamic route isn't matched
    if (res.status === 404 && url.startsWith('/api/transactions/')) {
      const id = url.split('/').pop();
      res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Failed: ${res.status} ${j?.error ?? ''}`);
      return;
    }
    await load();
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Admin Deletes (safe sandbox)</h1>
      {loading && <div>Loading…</div>}

      {/* Transactions */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Transactions</h2>
        <div className="space-y-2">
          {txs.map(tx => (
            <div key={tx.id} className="flex items-center justify-between border rounded p-2">
              <div className="text-sm">
                <div><b>ID:</b> {tx.id}</div>
                <div>{tx.type} • ${tx.amount} • {new Date(tx.date).toISOString().slice(0,10)}</div>
                <div className="text-gray-500">{tx.category ?? '—'} • {tx.description ?? '—'}</div>
              </div>
              <button
                className="px-3 py-1 rounded bg-red-600 text-white"
                onClick={() => confirmDelete('transaction', `/api/transactions/${tx.id}`)}
              >
                Delete
              </button>
            </div>
          ))}
          {txs.length === 0 && <div className="text-sm text-gray-500">No transactions</div>}
        </div>
      </section>

      {/* Tasks */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Tasks</h2>
        <div className="space-y-2">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center justify-between border rounded p-2">
              <div className="text-sm">
                <div><b>ID:</b> {t.id}</div>
                <div>{t.title}</div>
                <div className="text-gray-500">{t.status ?? '—'} • {t.priority ?? '—'}</div>
              </div>
              <button
                className="px-3 py-1 rounded bg-red-600 text-white"
                onClick={() => confirmDelete('task', `/api/tasks/${t.id}`)}
              >
                Delete
              </button>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-sm text-gray-500">No tasks</div>}
        </div>
      </section>

      {/* Deals */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Deals</h2>
        <div className="space-y-2">
          {deals.map(d => (
            <div key={d.id} className="flex items-center justify-between border rounded p-2">
              <div className="text-sm">
                <div><b>ID:</b> {d.id}</div>
                <div>{d.title ?? 'Untitled'} • {d.stage ?? '—'}</div>
                <div className="text-gray-500"><b>Prospect:</b> {d.prospect_id}</div>
              </div>
              <button
                className="px-3 py-1 rounded bg-red-600 text-white"
                onClick={() => confirmDelete('deal', `/api/deals/${d.id}`)}
              >
                Delete
              </button>
            </div>
          ))}
          {deals.length === 0 && <div className="text-sm text-gray-500">No deals</div>}
        </div>
      </section>

      {/* Prospects */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Prospects</h2>
        <p className="text-sm text-red-600 mb-2">Deleting a prospect will also delete their interactions, appointments, deals, and related transactions.</p>
        <div className="space-y-2">
          {prospects.map(p => (
            <div key={p.id} className="flex items-center justify-between border rounded p-2">
              <div className="text-sm">
                <div><b>ID:</b> {p.id}</div>
                <div>{p.name}</div>
                <div className="text-gray-500">{p.email ?? '—'} • {p.phone ?? '—'}</div>
              </div>
              <button
                className="px-3 py-1 rounded bg-red-600 text-white"
                onClick={() => confirmDelete('prospect (and related data)', `/api/prospects/${p.id}`)}
              >
                Delete Prospect
              </button>
            </div>
          ))}
          {prospects.length === 0 && <div className="text-sm text-gray-500">No prospects</div>}
        </div>
      </section>
    </div>
  );
}

