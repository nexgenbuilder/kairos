// src/app/inventory/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Item = {
  id: string;
  name: string;
  sku: string | null;
  qty: number | null;
  unit_cost: number | null;
  unit_price: number | null;
  category: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    qty: '',
    unit_cost: '',
    unit_price: '',
    category: '',
    location: '',
    notes: ''
  });

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/inventory${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    const data = await res.json();
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      sku: form.sku || null,
      qty: form.qty ? Number(form.qty) : 0,
      unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
      unit_price: form.unit_price ? Number(form.unit_price) : null,
      category: form.category || null,
      location: form.location || null,
      notes: form.notes || null
    };
    const res = await fetch('/api/inventory', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setForm({ name: '', sku: '', qty: '', unit_cost: '', unit_price: '', category: '', location: '', notes: '' });
      load();
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Inventory</h1>

      <form onSubmit={addItem} className="grid gap-2 md:grid-cols-4 bg-white border rounded p-3">
        <input className="border p-2 rounded" placeholder="Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
        <input className="border p-2 rounded" placeholder="SKU" value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} />
        <input className="border p-2 rounded" placeholder="Qty" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} />
        <input className="border p-2 rounded" placeholder="Unit cost" value={form.unit_cost} onChange={e=>setForm(f=>({...f,unit_cost:e.target.value}))} />
        <input className="border p-2 rounded" placeholder="Unit price" value={form.unit_price} onChange={e=>setForm(f=>({...f,unit_price:e.target.value}))} />
        <input className="border p-2 rounded" placeholder="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} />
        <input className="border p-2 rounded" placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
        <input className="border p-2 rounded md:col-span-3" placeholder="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        <button className="bg-blue-600 text-white rounded px-4 py-2">Add</button>
      </form>

      <div className="flex gap-2">
        <input className="border p-2 rounded" placeholder="Search name/sku/category/location" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="border rounded px-3" onClick={load}>Search</button>
      </div>

      {loading ? <p>Loading…</p> : (
        <div className="overflow-x-auto bg-white border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">SKU</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Cost</th>
                <th className="p-2">Price</th>
                <th className="p-2">Category</th>
                <th className="p-2">Location</th>
                <th className="p-2">Notes</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.sku}</td>
                  <td className="p-2 text-right">{it.qty ?? 0}</td>
                  <td className="p-2 text-right">{it.unit_cost ?? ''}</td>
                  <td className="p-2 text-right">{it.unit_price ?? ''}</td>
                  <td className="p-2">{it.category}</td>
                  <td className="p-2">{it.location}</td>
                  <td className="p-2">{it.notes}</td>
                  <td className="p-2 text-right">
                    <button className="text-red-600 underline" onClick={()=>del(it.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td className="p-3 text-gray-500" colSpan={9}>No items.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
