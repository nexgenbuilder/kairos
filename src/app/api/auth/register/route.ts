import { NextResponse } from 'next/server';
import { createUser, createSession } from '@/lib/auth';
import { q } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = body.name ? String(body.name) : null;

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 });
  }

  const user = await createUser(email, password, name);

  // default to prospects in enabled/active for new users
  const rows = await q`
    UPDATE public.users
    SET
      active_module = COALESCE(active_module, 'prospects'),
      modules_enabled = CASE
        WHEN modules_enabled @> to_jsonb('prospects'::text)
          THEN modules_enabled
        ELSE modules_enabled || to_jsonb('prospects'::text)
      END
    WHERE id = ${user.id}
    RETURNING id::text, email, name, active_module, modules_enabled, role, is_premium
  `;
  const updated = rows[0];

  const { token } = await createSession(updated.id, null, null);

  const res = NextResponse.json({ ok: true, user: updated });
  res.cookies.set('sid', token, { path: '/', httpOnly: true });
  res.cookies.set('am', updated.active_module || 'prospects', { path: '/' });
  res.cookies.set('role', updated.role, { path: '/' });

  if (updated.is_premium) {
    res.cookies.set('prem', '1', { path: '/', maxAge: 60 * 60 * 24 * 90 });
  } else {
    res.cookies.set('prem', '', { path: '/', expires: new Date(0) });
  }

  return res;
}

