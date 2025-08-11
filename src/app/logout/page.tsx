'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const r = useRouter();
  useEffect(() => {
    (async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      r.replace('/login');
    })();
  }, [r]);
  return <div className="p-6">Logging out…</div>;
}
