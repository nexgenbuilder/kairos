import { NextResponse } from 'next/server';
import { createSession, findUserByEmail, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim();
  const password = String(body.password || '');

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });

  const { token } = await createSession(user.id, null, null);

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      active_module: user.active_module,
      modules_enabled: user.modules_enabled,
      role: user.role,
      is_premium: user.is_premium,
    }
  });

  // cookies: sid + active module + role + premium flag
  res.cookies.set('sid', token, { path: '/', httpOnly: true });
  if (user.active_module) res.cookies.set('am', String(user.active_module), { path: '/' });
  else res.cookies.set('am', '', { path: '/', expires: new Date(0) });
  res.cookies.set('role', user.role, { path: '/' });

  if (user.is_premium) {
    res.cookies.set('prem', '1', { path: '/', maxAge: 60 * 60 * 24 * 90 });
  } else {
    res.cookies.set('prem', '', { path: '/', expires: new Date(0) });
  }

  return res;
}


