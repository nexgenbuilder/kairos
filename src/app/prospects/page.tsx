'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

/* =======================
   Types
======================= */
type Prospect = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  stage?: 'lead' | 'qualified' | 'proposal' | 'won' | 'lost' | string;
  created_at: string;
  interactions_count?: number;
  last_interaction_at?: string | null;
};

type Interaction = {
  id: string;
  prospect_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'reminder' | 'deal_update';
  summary: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type Appointment = {
  id: string;
  prospect_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  notes: string | null;
  created_at: string;
};

type Deal = {
  id: string;
  prospect_id: string;
  name: string;
  amount: number;
  probability: number; // 0..1
  stage: 'open' | 'won' | 'lost';
  expected_close_at: string | null;
  actual_amount: number | null;
  won_at: string | null;
  heat?: 'cold' | 'warm' | 'hot' | 'on_hold';
  created_at: string;
  updated_at: string;
  notes: string | null;
};

/* =======================
   Utils
======================= */
// Robust fetcher: accepts [], {data: []}, or {rows: []}
const fetcher = async (u: string) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text().catch(() => 'Request failed'));
  const json = await r.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray((json as any)?.data)) return (json as any).data;
  if (Array.isArray((json as any)?.rows)) return (json as any).rows;
  return [];
};

const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString() : '');
const money = (n: any) => `$${Number(n ?? 0).toFixed(2)}`;
const toISOOrNull = (v?: string) => {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00').toISOString();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return new Date(v).toISOString();
  return v;
};

/* =======================
   Page
======================= */
export default function ProspectsPage() {
  // master list
  const { data: prospects, mutate: refreshProspects, isLoading } = useSWR<Prospect[]>('/api/prospects', fetcher);

  // selection
  const [selectedId, setSelectedId] = useState<string>('');

  // dependent data
  const { data: interactions, mutate: refreshInteractions } = useSWR<Interaction[]>(
    selectedId ? `/api/prospect-interactions?prospect_id=${selectedId}` : null,
    fetcher
  );
  const { data: appts, mutate: refreshAppts } = useSWR<Appointment[]>(
    selectedId ? `/api/appointments?prospect_id=${selectedId}` : '/api/appointments',
    fetcher
  );
  const { data: dealsRaw, mutate: refreshDeals } = useSWR<any>(
    selectedId ? `/api/deals?prospect_id=${selectedId}` : null,
    fetcher
  );

  // Normalize to a typed array for the rest of the UI
  const dealsList: Deal[] = useMemo(() => {
    const d = dealsRaw as any;
    if (Array.isArray(d)) return d as Deal[];
    if (Array.isArray(d?.data)) return d.data as Deal[];
    if (Array.isArray(d?.rows)) return d.rows as Deal[];
    return [];
  }, [dealsRaw]);

  const selected = useMemo(() => (prospects ?? []).find(p => p.id === selectedId), [prospects, selectedId]);

  // forms
  const [pForm, setPForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [iForm, setIForm] = useState<{ prospect_id: string; type: Interaction['type']; summary: string; due_at: string }>({
    prospect_id: '',
    type: 'call',
    summary: '',
    due_at: '',
  });
  const [aForm, setAForm] = useState({ prospect_id: '', title: '', starts_at: '', ends_at: '', location: '', notes: '' });

  // deals form
  const [dForm, setDForm] = useState({
    prospect_id: '',
    name: '',
    amount: '',
    probability: '0.30',
    expected_close_at: '',
    heat: 'warm' as 'cold' | 'warm' | 'hot' | 'on_hold',
    notes: '',
  });

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ name: string; amount: string; probability: string; expected_close_at: string; heat: Deal['heat']; notes: string }>({
    name: '',
    amount: '',
    probability: '0.30',
    expected_close_at: '',
    heat: 'warm',
    notes: '',
  });

  // metrics
  const projected = useMemo(() => {
    return dealsList
      .filter(d => d.stage === 'open')
      .reduce((sum, d) => sum + Number(d.amount || 0) * Number(d.probability || 0), 0);
  }, [dealsList]);

  const collected = useMemo(() => {
    return dealsList
      .filter(d => d.stage === 'won')
      .reduce((s, d) => s + Number(d.actual_amount ?? d.amount ?? 0), 0);
  }, [dealsList]);

  /* =======================
     Handlers
  ======================= */
  async function createProspect(e: React.FormEvent) {
    e.preventDefault();
    const name = pForm.name.trim();
    if (!name) return;
    const res = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pForm),
    });
    if (res.ok) {
      setPForm({ name: '', email: '', phone: '', company: '', notes: '' });
      await refreshProspects();
    } else {
      const err = await res.text().catch(() => '');
      alert('Create failed: ' + err);
    }
  }

  async function logInteraction(e: React.FormEvent) {
    e.preventDefault();
    const pid = iForm.prospect_id || selectedId;
    if (!pid) return alert('Pick a prospect');
    const res = await fetch('/api/prospect-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_id: pid,
        type: iForm.type,
        summary: iForm.summary || null,
        due_at: iForm.due_at || null, // API normalizes
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      alert('Interaction failed: ' + err);
      return;
    }
    setIForm({ prospect_id: '', type: 'call', summary: '', due_at: '' });
    await Promise.all([refreshInteractions(), refreshProspects()]);
  }

  async function addAppointment(e: React.FormEvent) {
    e.preventDefault();
    const pid = aForm.prospect_id || selectedId;
    if (!pid) return alert('Pick a prospect');
    if (!aForm.title.trim()) return alert('Title required');
    if (!aForm.starts_at || !aForm.ends_at) return alert('Start/End required');

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_id: pid,
        title: aForm.title,
        starts_at: toISOOrNull(aForm.starts_at),
        ends_at: toISOOrNull(aForm.ends_at),
        location: aForm.location || null,
        notes: aForm.notes || null,
      }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      alert('Appointment failed: ' + msg);
      return;
    }
    setAForm({ prospect_id: '', title: '', starts_at: '', ends_at: '', location: '', notes: '' });
    await refreshAppts();
  }

  async function quickReminder(days: number) {
    if (!selectedId) return alert('Select a prospect row first.');
    const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch('/api/prospect-interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_id: selectedId,
        type: 'reminder',
        summary: `Auto reminder (+${days}d)`,
        due_at: due,
      }),
    });
    if (res.ok) {
      await Promise.all([refreshInteractions(), refreshProspects()]);
    } else {
      const err = await res.text().catch(() => '');
      alert('Failed to set reminder: ' + err);
    }
  }

  async function addDeal(e: React.FormEvent) {
    e.preventDefault();
    const pid = dForm.prospect_id || selectedId;
    if (!pid) return alert('Pick a prospect');
    if (!dForm.name.trim()) return alert('Deal name required');
    if (!dForm.amount || isNaN(Number(dForm.amount))) return alert('Amount must be a number');

    const payload = {
      prospect_id: pid,
      name: dForm.name,
      amount: Number(dForm.amount),
      probability: Math.max(0, Math.min(1, Number(dForm.probability) || 0)),
      expected_close_at: toISOOrNull(dForm.expected_close_at) as string | null,
      heat: dForm.heat,
      notes: dForm.notes || null,
    };

    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      alert('Deal create failed: ' + msg);
      return;
    }
    setDForm({ prospect_id: '', name: '', amount: '', probability: '0.30', expected_close_at: '', heat: 'warm', notes: '' });
    await Promise.all([refreshDeals(), refreshProspects()]);
  }

  function startEdit(d: Deal) {
    setEditingId(d.id);
    setEdit({
      name: d.name,
      amount: String(d.amount),
      probability: String(d.probability),
      expected_close_at: d.expected_close_at ? d.expected_close_at.slice(0, 16) : '',
      heat: d.heat ?? 'warm',
      notes: d.notes || '',
    });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: edit.name,
        amount: Number(edit.amount),
        probability: Math.max(0, Math.min(1, Number(edit.probability) || 0)),
        expected_close_at: toISOOrNull(edit.expected_close_at),
        heat: edit.heat,
        notes: edit.notes || null,
      }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      alert('Update failed: ' + msg);
      return;
    }
    setEditingId(null);
    await Promise.all([refreshDeals(), refreshProspects()]);
  }

  async function markWon(id: string) {
    const actual = prompt('Actual amount collected? (leave blank to use proposed amount)');
    const payload: any = { stage: 'won', won_at: new Date().toISOString() };
    if (actual && !isNaN(Number(actual))) payload.actual_amount = Number(actual);
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return alert('Failed to mark won');
    await Promise.all([refreshDeals(), refreshProspects()]);
  }

  async function markLost(id: string) {
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'lost', actual_amount: null, won_at: null }),
    });
    if (!res.ok) return alert('Failed to mark lost');
    await Promise.all([refreshDeals(), refreshProspects()]);
  }

  /* =======================
     Render
  ======================= */
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prospects</h1>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1 text-sm" onClick={() => quickReminder(1)} title="Reminder in 1 day">+1d</button>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => quickReminder(3)} title="Reminder in 3 days">+3d</button>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => quickReminder(7)} title="Reminder in 7 days">+7d</button>
        </div>
      </div>

      {/* Create Prospect */}
      <form onSubmit={createProspect} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-6">
        <input className="rounded border p-2" placeholder="Name *" value={pForm.name} onChange={e=>setPForm({...pForm, name:e.target.value})} required />
        <input className="rounded border p-2" placeholder="Email" value={pForm.email} onChange={e=>setPForm({...pForm, email:e.target.value})}/>
        <input className="rounded border p-2" placeholder="Phone" value={pForm.phone} onChange={e=>setPForm({...pForm, phone:e.target.value})}/>
        <input className="rounded border p-2" placeholder="Company" value={pForm.company} onChange={e=>setPForm({...pForm, company:e.target.value})}/>
        <input className="rounded border p-2 md:col-span-2" placeholder="Notes" value={pForm.notes} onChange={e=>setPForm({...pForm, notes:e.target.value})}/>
        <button className="rounded bg-black px-4 py-2 text-white md:col-span-6">Add Prospect</button>
      </form>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Prospects Table */}
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">Company</th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Interactions</th>
                <th className="p-2">Last Interaction</th>
                <th className="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-3" colSpan={7}>Loading…</td></tr>
              ) : (
                (prospects ?? []).map(p => (
                  <tr
                    key={p.id}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${selectedId === p.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedId(p.id)}
                    title="Click to load interactions, deals & appointments"
                  >
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.company ?? ''}</td>
                    <td className="p-2">{p.email ?? ''}</td>
                    <td className="p-2">{p.phone ?? ''}</td>
                    <td className="p-2 text-center">{p.interactions_count ?? 0}</td>
                    <td className="p-2">{fmt(p.last_interaction_at)}</td>
                    <td className="p-2">{fmt(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Interactions + Deals + Appointments */}
        <div className="space-y-6">
          {/* Log Interaction */}
          <form onSubmit={logInteraction} className="rounded-xl border bg-white p-4 space-y-3">
            <h2 className="font-semibold">Log Interaction</h2>
            <select className="w-full rounded border p-2" value={iForm.prospect_id || selectedId} onChange={e=>setIForm({...iForm, prospect_id:e.target.value})}>
              <option value="">Select prospect…</option>
              {(prospects ?? []).map(p => <option key={p.id} value={p.id}>{p.name || '(no name)'}</option>)}
            </select>
            <select className="w-full rounded border p-2" value={iForm.type} onChange={e=>setIForm({...iForm, type:e.target.value as any})}>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="note">Note</option>
              <option value="reminder">Reminder</option>
              <option value="deal_update">Deal update</option>
            </select>
            <input className="w-full rounded border p-2" placeholder="Summary / Notes" value={iForm.summary} onChange={e=>setIForm({...iForm, summary:e.target.value})}/>
            <input className="w-full rounded border p-2" type="datetime-local" value={iForm.due_at} onChange={e=>setIForm({...iForm, due_at:e.target.value})}/>
            <button className="rounded bg-black px-4 py-2 text-white">Save Interaction</button>
          </form>

          {/* Deals */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Deals {selected ? `— ${selected.name}` : ''}</h2>
              <div className="text-xs text-gray-700">
                Projected: <span className="font-semibold">{money(projected)}</span> •{' '}
                Collected: <span className="font-semibold">{money(collected)}</span>
              </div>
            </div>

            <form onSubmit={addDeal} className="grid gap-2 md:grid-cols-6">
              <select className="rounded border p-2 md:col-span-2" value={dForm.prospect_id || selectedId} onChange={e=>setDForm({...dForm, prospect_id:e.target.value})}>
                <option value="">Select prospect…</option>
                {(prospects ?? []).map(p => <option key={p.id} value={p.id}>{p.name || '(no name)'}</option>)}
              </select>
              <input className="rounded border p-2" placeholder="Deal name *" value={dForm.name} onChange={e=>setDForm({...dForm, name:e.target.value})}/>
              <input className="rounded border p-2" placeholder="Amount *" value={dForm.amount} onChange={e=>setDForm({...dForm, amount:e.target.value})}/>
              <input className="rounded border p-2" type="number" step="0.01" min="0" max="1" placeholder="Prob 0–1" value={dForm.probability} onChange={e=>setDForm({...dForm, probability:e.target.value})}/>
              <input className="rounded border p-2" type="date" value={dForm.expected_close_at} onChange={e=>setDForm({...dForm, expected_close_at:e.target.value})}/>
              <select className="rounded border p-2" value={dForm.heat} onChange={e=>setDForm({...dForm, heat: e.target.value as any})}>
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="hot">Hot</option>
                <option value="on_hold">On hold</option>
              </select>
              <input className="rounded border p-2 md:col-span-6" placeholder="Notes" value={dForm.notes} onChange={e=>setDForm({...dForm, notes:e.target.value})}/>
              <button className="rounded bg-black px-4 py-2 text-white md:col-span-6">Add Deal</button>
            </form>

            {dealsRaw === undefined ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : dealsList.length === 0 ? (
              <div className="text-sm text-gray-500">No deals yet.</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto text-sm">
                {dealsList.map(d => (
                  <li key={d.id} className="rounded border p-2">
                    {editingId === d.id ? (
                      <div className="grid gap-2 md:grid-cols-6">
                        <input className="rounded border p-2 md:col-span-2" value={edit.name} onChange={e=>setEdit({...edit, name:e.target.value})}/>
                        <input className="rounded border p-2" value={edit.amount} onChange={e=>setEdit({...edit, amount:e.target.value})}/>
                        <input className="rounded border p-2" type="number" step="0.01" min="0" max="1" value={edit.probability} onChange={e=>setEdit({...edit, probability:e.target.value})}/>
                        <input className="rounded border p-2" type="datetime-local" value={edit.expected_close_at} onChange={e=>setEdit({...edit, expected_close_at:e.target.value})}/>
                        <select className="rounded border p-2" value={edit.heat} onChange={e=>setEdit({...edit, heat: e.target.value as any})}>
                          <option value="cold">Cold</option>
                          <option value="warm">Warm</option>
                          <option value="hot">Hot</option>
                          <option value="on_hold">On hold</option>
                        </select>
                        <input className="rounded border p-2 md:col-span-6" placeholder="Notes" value={edit.notes} onChange={e=>setEdit({...edit, notes:e.target.value})}/>
                        <div className="md:col-span-6 flex gap-2">
                          <button type="button" className="rounded border px-3 py-1" onClick={()=>saveEdit(d.id)}>Save</button>
                          <button type="button" className="rounded border px-3 py-1" onClick={()=>{setEditingId(null);}}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="font-medium">
                            {d.name}{' '}
                            <span className="text-xs text-gray-500">
                              ({d.stage}{d.heat ? ` • ${d.heat}` : ''})
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {money(d.amount)} • p={Number(d.probability).toFixed(2)}
                            {d.expected_close_at ? ` • exp ${fmt(d.expected_close_at)}` : ''}
                            {d.won_at ? ` • won ${fmt(d.won_at)}` : ''}
                            {d.actual_amount != null ? ` • actual ${money(d.actual_amount)}` : ''}
                          </div>
                          {d.notes ? <div className="text-xs text-gray-700 mt-1">{d.notes}</div> : null}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="rounded border px-2" onClick={()=>startEdit(d)}>Edit</button>
                          <button type="button" className="rounded border px-2" onClick={()=>markWon(d.id)}>Won</button>
                          <button type="button" className="rounded border px-2" onClick={()=>markLost(d.id)}>Lost</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* New Appointment */}
          <form onSubmit={addAppointment} className="rounded-xl border bg-white p-4 space-y-3">
            <h2 className="font-semibold">New Appointment</h2>
            <select className="w-full rounded border p-2" value={aForm.prospect_id || selectedId} onChange={e=>setAForm({...aForm, prospect_id:e.target.value})}>
              <option value="">Select prospect…</option>
              {(prospects ?? []).map(p => <option key={p.id} value={p.id}>{p.name || '(no name)'}</option>)}
            </select>
            <input className="w-full rounded border p-2" placeholder="Title *" value={aForm.title} onChange={e=>setAForm({...aForm, title:e.target.value})}/>
            <input className="w-full rounded border p-2" type="datetime-local" value={aForm.starts_at} onChange={e=>setAForm({...aForm, starts_at:e.target.value})}/>
            <input className="w-full rounded border p-2" type="datetime-local" value={aForm.ends_at} onChange={e=>setAForm({...aForm, ends_at:e.target.value})}/>
            <input className="w-full rounded border p-2" placeholder="Location" value={aForm.location} onChange={e=>setAForm({...aForm, location:e.target.value})}/>
            <input className="w-full rounded border p-2" placeholder="Notes" value={aForm.notes} onChange={e=>setAForm({...aForm, notes:e.target.value})}/>
            <button className="rounded bg-black px-4 py-2 text-white">Create Appointment</button>
          </form>

          {/* Appointments List */}
          <div className="rounded-xl border bg-white p-4">
            <h2 className="font-semibold mb-2">Appointments {selected ? `— ${selected.name}` : ''}</h2>
            {!selectedId ? (
              <div className="text-sm text-gray-500">Select a prospect row to view appointments.</div>
            ) : !appts ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : appts.length === 0 ? (
              <div className="text-sm text-gray-500">No appointments yet.</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto">
                {appts.map(a => (
                  <li key={a.id} className="rounded border p-2">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-gray-600">
                      {fmt(a.starts_at)} — {fmt(a.ends_at)}
                      {a.location ? ` • ${a.location}` : ''}
                    </div>
                    {a.notes ? <div className="text-sm mt-1">{a.notes}</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Interactions List */}
          <div className="rounded-xl border bg-white p-4">
            <h2 className="font-semibold mb-2">Recent Interactions {selected ? `— ${selected.name}` : ''}</h2>
            {!selectedId ? (
              <div className="text-sm text-gray-500">Select a prospect row to view history.</div>
            ) : !interactions ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : interactions.length === 0 ? (
              <div className="text-sm text-gray-500">No interactions yet.</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto">
                {interactions.map(i => (
                  <li key={i.id} className="rounded border p-2">
                    <div className="text-xs text-gray-600">
                      {i.type.toUpperCase()} • {fmt(i.created_at)} {i.due_at ? `• due ${fmt(i.due_at)}` : ''}
                    </div>
                    <div className="text-sm">{i.summary ?? ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



