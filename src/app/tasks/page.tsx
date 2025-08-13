'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Trash } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category_name?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'inactive' | 'active' | 'completed';
  created_at: string;
  activated_at: string | null;
  completed_at: string | null;
  updated_at: string;
};
type Category = { id: string; name: string };

const fetcher = async (u: string) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text().catch(() => 'Request failed'));
  const json = await r.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray((json as any)?.data)) return (json as any).data;
  if (Array.isArray((json as any)?.rows)) return (json as any).rows;
  return [];
};

export default function TasksPage() {
  const swrOpts = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 800 };
  const { data: tasks, mutate: refreshTasks } = useSWR<Task[]>('/api/tasks', fetcher, swrOpts);
  const { data: cats, mutate: refreshCats } = useSWR<Category[]>('/api/task-categories', fetcher, swrOpts);

  const [newTask, setNewTask] = useState({ title: '', description: '', category_id: '', priority: 'medium' as Task['priority'] });
  const [catName, setCatName] = useState('');

  // Group by status
  const inactive  = useMemo(() => (tasks ?? []).filter(t => t.status === 'inactive'), [tasks]);
  const active    = useMemo(() => (tasks ?? []).filter(t => t.status === 'active'),   [tasks]);
  const completed = useMemo(() => (tasks ?? []).filter(t => t.status === 'completed'),[tasks]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: newTask.title,
      description: newTask.description || null,
      category_id: newTask.category_id || null,
      priority: newTask.priority,
    };
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert('Create failed: ' + (await res.text().catch(() => '')));
      return;
    }
    setNewTask({ title: '', description: '', category_id: '', priority: 'medium' });
    refreshTasks();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return;
    const res = await fetch('/api/task-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      alert('Category failed: ' + (await res.text().catch(() => '')));
      return;
    }
    setCatName('');
    refreshCats();
  }

  async function updateStatus(id: string, status: Task['status']) {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    refreshTasks();
  }

  async function updatePriority(id: string, priority: Task['priority']) {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priority }) });
    refreshTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return;
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) refreshTasks();
  }

  function Lane({ title, items }: { title: string; items: Task[] }) {
    return (
      <div className="rounded-xl border bg-white p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <span className="text-xs text-gray-500">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-gray-500">Nothing here</div>
        ) : (
          <ul className="space-y-2">
            {items.map(t => (
              <li key={t.id} className="group rounded-lg border p-2 hover:shadow-sm transition">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    {t.description ? (
                      <div
                        className="text-xs text-gray-600 overflow-hidden max-h-5 group-hover:max-h-24 transition-all"
                        title={t.description || ''}
                      >
                        {t.description}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.category_name ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 whitespace-nowrap">{t.category_name}</span>
                    ) : null}
                    <button
                      className="p-1 rounded hover:bg-red-50 text-red-600"
                      title="Delete task"
                      onClick={() => deleteTask(t.id)}
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    className="h-8 w-full rounded border px-2 text-xs"
                    value={t.status}
                    onChange={e => updateStatus(t.id, e.currentTarget.value as Task['status'])}
                  >
                    <option value="inactive">inactive</option>
                    <option value="active">active</option>
                    <option value="completed">completed</option>
                  </select>
                  <select
                    className="h-8 w-full rounded border px-2 text-xs"
                    value={t.priority}
                    onChange={e => updatePriority(t.id, e.currentTarget.value as Task['priority'])}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>

      {/* Create Task (compact) */}
      <form onSubmit={createTask} className="grid gap-2 rounded-xl border bg-white p-3 md:grid-cols-6">
        <input className="rounded border p-2 md:col-span-2" placeholder="Title *"
               value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
        <input className="rounded border p-2 md:col-span-2" placeholder="Description"
               value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
        <select className="rounded border p-2"
                value={newTask.category_id}
                onChange={e => setNewTask({ ...newTask, category_id: e.target.value })}>
          <option value="">No category</option>
          {(cats ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="rounded border p-2"
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <Button className="md:col-span-6" type="submit">Add Task</Button>
      </form>

      {/* Create Category (compact) */}
      <form onSubmit={addCategory} className="grid gap-2 rounded-xl border bg-white p-3 md:grid-cols-6">
        <input className="rounded border p-2 md:col-span-5" placeholder="New category name"
               value={catName} onChange={e => setCatName(e.target.value)} />
        <Button type="submit">Add Category</Button>
      </form>

      {/* Board layout: 3 columns on md+ */}
      <div className="grid gap-4 md:grid-cols-3">
        <Lane title="Inactive"  items={inactive} />
        <Lane title="Active"    items={active} />
        <Lane title="Completed" items={completed} />
      </div>
    </div>
  );
}

