import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const name = b.name ? String(b.name) : null;
  const note = b.note ? String(b.note) : null;
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  try {
    await q`INSERT INTO public.premium_waitlist (email, name, note) VALUES (${email}, ${name}, ${note})`;
  } catch (_) {
    // ignore duplicate
  }
  return NextResponse.json({ ok: true });
}
