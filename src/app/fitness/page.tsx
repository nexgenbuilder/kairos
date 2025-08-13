'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';

type FitnessEntry = {
  id: string;
  occurred_at: string | null;
  activity: string;
  sets: number | null;
  reps: number | null;
  distance: number | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Trackable = { activity: string; category: string };

const fetcher = async (u: string) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(await r.text().catch(() => 'Request failed'));
  const json = await r.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray((json as any)?.data)) return (json as any).data;
  if (Array.isArray((json as any)?.rows)) return (json as any).rows;
  return json;
};

// Base catalog used by BOTH form and trackables
const CATALOG: Record<string, string[]> = {
  Cardio: ['Running', 'Jogging', 'Walking', 'Cycling', 'Rowing', 'Swimming'],
  Strength: ['Pushups', 'Pull-ups', 'Sit-ups', 'Lunges', 'Planks'],
  Lifting: ['Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Barbell Row'],
  Flexibility: ['Stretching', 'Yoga'],
  'Mind-Body': ['Pilates', 'Tai Chi'],
  Sports: ['Basketball', 'Soccer', 'Tennis'],
  Uncategorized: [],
};
const categories = Object.keys(CATALOG);

function fmtWhen(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
}
function fmtDuration(min: number | null | undefined) {
  if (!min || !Number.isFinite(min)) return '';
  const whole = Math.floor(min);
  let sec = Math.round((min - whole) * 60);
  let m = whole;
  if (sec === 60) { m += 1; sec = 0; }
  if (m === 0 && sec > 0) return `${sec}s`;
  if (sec === 0) return `${m} min`;
  return `${m}m ${sec}s`;
}
function parseDurationToMinutes(input: string): number | null {
  const s = (input ?? '').trim();
  if (!s) return null;
  const parts = s.split(':');
  if (parts.length === 2 || parts.length === 3) {
    let h = 0, m = 0, sec = 0;
    if (parts.length === 3) {
      h = Number(parts[0] || 0);
      m = Number(parts[1] || 0);
      sec = Number(parts[2] || 0);
      m += h * 60;
    } else {
      m = Number(parts[0] || 0);
      sec = Number(parts[1] || 0);
    }
    if (Number.isFinite(m) && Number.isFinite(sec)) return m + sec / 60;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function FitnessPage() {
  const swrOpts = { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 800 };

  const { data: entries, mutate: refreshEntries } = useSWR<FitnessEntry[]>('/api/fitness', fetcher, swrOpts);
  const { data: trackables, mutate: refreshTrackables } = useSWR<Trackable[]>('/api/fitness/trackables', fetcher, swrOpts);

  const trackedByCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    (trackables ?? []).forEach(t => {
      const list = map.get(t.category) ?? [];
      if (!list.includes(t.activity)) list.push(t.activity);
      map.set(t.category, list);
    });
    return map;
  }, [trackables]);

  const allActivitiesFor = (cat: string) => {
    const base = CATALOG[cat] ?? [];
    const extra = trackedByCategory.get(cat) ?? [];
    return Array.from(new Set([...base, ...extra])).sort((a, b) => a.localeCompare(b));
  };

  // Log Activity state
  const [logCat, setLogCat] = useState<string>('');
  const [logAct, setLogAct] = useState<string>('');
  const [form, setForm] = useState({
    occurred_at: '',
    sets: '',
    reps: '',
    distance: '',
    duration: '',
    notes: '',
  });
  const logOptions = useMemo(() => (logCat ? allActivitiesFor(logCat) : []), [logCat, trackedByCategory]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!logCat || !logAct) {
      alert('Pick a category and activity.');
      return;
    }
    const durationMinutes = parseDurationToMinutes(form.duration);
    const body: any = {
      activity: logAct,
      occurred_at: form.occurred_at || null,
      sets: form.sets ? Number(form.sets) : null,
      reps: form.reps ? Number(form.reps) : null,
      distance: form.distance ? Number(form.distance) : null,
      duration_minutes: durationMinutes,
      notes: form.notes || null,
    };
    const res = await fetch('/api/fitness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      alert('Failed: ' + (await res.text().catch(() => '')));
      return;
    }
    setForm({ occurred_at: '', sets: '', reps: '', distance: '', duration: '', notes: '' });
    setLogAct('');
    refreshEntries();
  }

  // Trackables state
  const [trkCat, setTrkCat] = useState<string>('Strength');
  const [trkAct, setTrkAct] = useState<string>('');
  const trkOptions = useMemo(() => allActivitiesFor(trkCat), [trkCat, trackedByCategory]);

  async function addTrackable(e: React.FormEvent) {
    e.preventDefault();
    if (!trkCat || !trkAct) {
      alert('Pick a category and an activity to track.');
      return;
    }
    const res = await fetch('/api/fitness/trackables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: trkCat, activity: trkAct }),
    });
    if (!res.ok) {
      alert('Trackable failed: ' + (await res.text().catch(() => '')));
      return;
    }
    refreshTrackables();
  }

  async function removeTrackable(a: string) {
    if (!confirm(`Stop tracking "${a}"?`)) return;
    const res = await fetch(`/api/fitness/trackables?activity=${encodeURIComponent(a)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      alert('Remove failed: ' + (await res.text().catch(() => '')));
      return;
    }
    refreshTrackables();
  }

  const totalMinutes = useMemo(
    () => (entries ?? []).reduce((s, e) => s + Number(e.duration_minutes || 0), 0),
    [entries]
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Fitness</h1>

      {/* Log Activity */}
      <form onSubmit={addEntry} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-6">
        <select
          className="rounded border p-2"
          value={logCat}
          onChange={e => {
            setLogCat(e.target.value);
            setLogAct('');
          }}
        >
          <option value="">Select category...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="rounded border p-2"
          value={logAct}
          onChange={e => setLogAct(e.target.value)}
          disabled={!logCat}
        >
          <option value="">{logCat ? 'Select activity...' : 'Select category first'}</option>
          {logOptions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <input className="rounded border p-2" type="datetime-local"
          value={form.occurred_at} onChange={e => setForm(prev => ({ ...prev, occurred_at: e.target.value }))} />
        <input className="rounded border p-2" placeholder="Sets" inputMode="numeric"
          value={form.sets} onChange={e => setForm(prev => ({ ...prev, sets: e.target.value }))} />
        <input className="rounded border p-2" placeholder="Reps" inputMode="numeric"
          value={form.reps} onChange={e => setForm(prev => ({ ...prev, reps: e.target.value }))} />
        <input className="rounded border p-2" placeholder="Distance (mi)" inputMode="decimal"
          value={form.distance} onChange={e => setForm(prev => ({ ...prev, distance: e.target.value }))} />

        <input className="rounded border p-2 md:col-span-6"
          placeholder="Duration (min or mm:ss, e.g. 45 or 45:30)"
          value={form.duration} onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))} />
        <input className="rounded border p-2 md:col-span-6"
          placeholder="Notes" value={form.notes}
          onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} />

        <Button className="md:col-span-6" type="submit" disabled={!logCat || !logAct}>
          Log Activity
        </Button>
      </form>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Log */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Activity Log</h2>
            <div className="text-xs text-gray-500">{entries?.length ?? 0} total • {fmtDuration(totalMinutes)}</div>
          </div>
          {!entries?.length ? (
            <div className="text-sm text-gray-500 mt-2">No fitness entries yet.</div>
          ) : (
            <ul className="mt-3 space-y-2 max-h-80 overflow-auto">
              {(entries ?? []).map(e => (
                <li key={e.id} className="rounded border p-2 text-sm">
                  <div className="font-medium">
                    {e.activity}{' '}
                    <span className="text-xs text-gray-500">{fmtWhen(e.occurred_at)}</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    {e.sets ? `sets ${e.sets} • ` : ''}
                    {e.reps ? `reps ${e.reps} • ` : ''}
                    {e.distance ? `dist ${e.distance} mi • ` : ''}
                    {e.duration_minutes ? `time ${fmtDuration(e.duration_minutes)}` : ''}
                  </div>
                  {e.notes ? <div className="text-xs text-gray-700 mt-1">{e.notes}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tracked Activities */}
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Tracked Activities</h2>

          <form onSubmit={addTrackable} className="flex flex-wrap items-center gap-2">
            <select className="rounded border p-2" value={trkCat} onChange={e => { setTrkCat(e.target.value); setTrkAct(''); }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="rounded border p-2" value={trkAct} onChange={e => setTrkAct(e.target.value)}>
              <option value="">Select activity...</option>
              {allActivitiesFor(trkCat).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <Button type="submit">Track</Button>
          </form>

          {!(trackables?.length ?? 0) ? (
            <div className="text-sm text-gray-500">No tracked activities yet.</div>
          ) : (
            <div className="space-y-3">
              {categories.map(cat => {
                const list = (trackables ?? []).filter(t => t.category === cat);
                if (!list.length) return null;
                return (
                  <div key={cat} className="border rounded">
                    <div className="px-3 py-1 text-xs font-medium bg-gray-50 border-b">{cat}</div>
                    <ul className="p-2 space-y-2">
                      {list.map(t => (
                        <li key={`${t.category}:${t.activity}`} className="flex items-center justify-between">
                          <div className="text-sm">{t.activity}</div>
                          <Button type="button" variant="danger" size="sm" onClick={() => removeTrackable(t.activity)}>
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-xs text-gray-600">
            The entry form (left) uses your tracked list + base catalog for the activity dropdown.
            Duration accepts minutes or mm:ss.
          </div>
        </div>
      </div>
    </div>
  );
}





