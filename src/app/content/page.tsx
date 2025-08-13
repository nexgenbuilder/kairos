'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

type Content = {
  id: string;
  title: string;
  type: string | null;
  status: 'draft' | 'scheduled' | 'published' | string | null;
  url: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function ContentPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('post');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/content');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addContent() {
    const body = {
      title: title.trim(),
      type: type || null,
      status,
      url: url.trim() || null,
      notes: notes.trim() || null,
    };
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setTitle('');
      setType('post');
      setStatus('draft');
      setUrl('');
      setNotes('');
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || 'Failed to add content');
    }
  }

  async function setItemStatus(id: string, status: 'draft' | 'scheduled' | 'published') {
    const res = await fetch(`/api/content/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      load();
    }
  }

  async function removeItem(id: string) {
    if (!confirm('Delete this content item?')) return;
    const res = await fetch(`/api/content/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Create Content</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Type</label>
            <Select value={type} onChange={e => setType(e.target.value)}>
              <option value="post">post</option>
              <option value="video">video</option>
              <option value="idea">idea</option>
              <option value="tweet">tweet</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <Select value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="published">published</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">URL</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={addContent}>Add</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Content Items</CardTitle>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">No content yet</div>
        ) : (
          <div className="space-y-3">
            {items.map(c => (
              <div key={c.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.title}</div>
                  <div className="flex items-center gap-2">
                    {c.type ? <Badge color="purple">{c.type}</Badge> : null}
                    {c.status ? (
                      <Badge color={c.status === 'published' ? 'green' : c.status === 'scheduled' ? 'yellow' : 'gray'}>
                        {c.status}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {c.url ? <div className="text-sm"><a className="text-blue-600 hover:underline" href={c.url} target="_blank">{c.url}</a></div> : null}
                {c.notes ? <div className="text-sm text-gray-600">{c.notes}</div> : null}
                <div className="mt-2 flex items-center gap-2">
                  <Select value={c.status || 'draft'} onChange={e => setItemStatus(c.id, e.target.value as any)}>
                    <option value="draft">draft</option>
                    <option value="scheduled">scheduled</option>
                    <option value="published">published</option>
                  </Select>
                  <Button variant="danger" onClick={() => removeItem(c.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
