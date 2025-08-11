'use client';
import { useState } from 'react';

export default function PremiumWaitlistPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const r = await fetch('/api/premium/waitlist', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, name, note }),
    });
    const j = await r.json();
    if (!r.ok) setMsg(j.error || 'Something went wrong');
    else setMsg('Thanks! We’ll email you when Premium opens.');
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-3">Premium (Coming Soon)</h1>
      <p className="text-sm mb-4">
        During beta, everything is free. Want guaranteed access and priority support when Premium launches?
        Join the waitlist:
      </p>
      <form onSubmit={submit} className="grid gap-2">
        <input className="border rounded p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border rounded p-2" placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded p-2" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} />
        <button className="bg-black text-white rounded p-2">Join waitlist</button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>
    </div>
  );
}
