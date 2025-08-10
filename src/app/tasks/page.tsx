'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type { Task } from '@/types';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function TasksPage() {
  const { data, mutate, isLoading } = useSWR<Task[]>('/api/tasks', fetcher);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium' as Task['priority'],
    status: 'inactive' as Task['status'],
  });

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description || null,
        category_id: form.category_id || null,
        priority: form.priority,
        status: form.status, // API accepts status or status_select
      }),
    });
    if (res.ok) {
      setForm({ title: '', description: '', category_id: '', priority: 'medium', status: 'inactive' });
      mutate();
    } else {
      const err = await res.json().catch(() => null);
      alert(`Save failed${err?.error ? ': ' + err.error : ''}`);
    }
  }

  async function setStatus(id: string, status: Task['status']) {
    const prev = data || [];
    mutate(
      prev.map(t => (t.id === id ? { ...t, status } : t)),
      false
    );
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      mutate(); // revert
      alert(`Update failed: ${res.status} ${msg}`);
    } else {
      mutate(); // refetch to get authoritative timestamps
    }
  }
  

  const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : '');

  const StatusBadge = ({ s }: { s?: Task['status'] }) => {
    const cls =
      s === 'completed'
        ? 'bg-green-100 text-green-800'
        : s === 'active'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800';
    return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{cap(s)}</span>;
  };

  const ActionButtons = ({ id }: { id: string }) => (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setStatus(id, 'inactive')}
        className="rounded border px-2 py-1 text-xs"
        title="Mark Inactive"
      >
        Inactive
      </button>
      <button
        type="button"
        onClick={() => setStatus(id, 'active')}
        className="rounded border px-2 py-1 text-xs"
        title="Mark Active"
      >
        Active
      </button>
      <button
        type="button"
        onClick={() => setStatus(id, 'completed')}
        className="rounded border px-2 py-1 text-xs"
        title="Mark Completed"
      >
        Complete
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>

      {/* Create Task */}
      <form onSubmit={addTask} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-6">
        <input
          className="rounded border p-2 md:col-span-3"
          placeholder="Title *"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          required
        />
        <select
          className="rounded border p-2"
          value={form.priority}
          onChange={e => setForm({ ...form, priority: e.target.value as any })}
        >
          <option value="low">Priority: Low</option>
          <option value="medium">Priority: Medium</option>
          <option value="high">Priority: High</option>
        </select>
        <select
          className="rounded border p-2"
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value as any })}
        >
          <option value="inactive">Inactive</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <input
          className="rounded border p-2 md:col-span-6"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <button className="rounded bg-black px-4 py-2 text-white md:col-span-6">Add Task</button>
      </form>

      {/* List */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2">Priority</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Activated</th>
              <th className="p-2">Completed</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="p-3" colSpan={8}>Loading…</td></tr>
            ) : (
              (data ?? []).map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{t.title}</td>
                  <td className="p-2 text-center">{cap(t.priority)}</td>
                  <td className="p-2"><StatusBadge s={t.status} /></td>
                  <td className="p-2">{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</td>
                  <td className="p-2">{t.activated_at ? new Date(t.activated_at).toLocaleString() : ''}</td>
                  <td className="p-2">{t.completed_at ? new Date(t.completed_at).toLocaleString() : ''}</td>
                  <td className="p-2">{t.description ?? ''}</td>
                  <td className="p-2"><ActionButtons id={t.id} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

