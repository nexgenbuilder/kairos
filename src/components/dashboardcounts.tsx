// src/components/DashboardCounts.tsx
'use client';

import { useEffect, useState } from 'react';

type Counts = {
  prospects: number;
  deals: number;
  tasks: number;
  transactions: number;
};

export default function DashboardCounts() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) {
            setCounts(null);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setCounts(data.counts || null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCounts(null);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading your dashboard…</p>;
  }

  if (!counts) {
    return <p className="text-gray-500 text-sm">Welcome back! Use the links below to get started.</p>;
  }

  return (
    <div className="flex flex-wrap gap-6 text-sm">
      <div><span className="font-semibold">{counts.prospects}</span> prospects</div>
      <div><span className="font-semibold">{counts.tasks}</span> tasks</div>
      <div><span className="font-semibold">{counts.deals}</span> deals</div>
      <div><span className="font-semibold">{counts.transactions}</span> transactions</div>
    </div>
  );
}
