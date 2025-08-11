'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? 'Registration failed');
      setBusy(false);
      return;
    }
    r.push('/');
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="Name (optional)"
               value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Email"
               value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" placeholder="Password"
               value={password} onChange={e => setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={busy} className="px-4 py-2 rounded bg-black text-white">
          {busy ? 'Creating…' : 'Register'}
        </button>
      </form>
      <div className="mt-3 text-sm">
        Have an account? <a className="underline" href="/login">Log in</a>
      </div>
    </div>
  );
}
