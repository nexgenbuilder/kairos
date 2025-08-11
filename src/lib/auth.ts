import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';

const SESSION_TTL_DAYS = 30;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  active_module: string | null;
  modules_enabled: any;
  role: 'user' | 'superadmin';
  is_premium: boolean;
};

export async function findUserByEmail(email: string): Promise<(SafeUser & { password_hash: string }) | null> {
  const rows = await q`
    SELECT id::text, email, password_hash, name, active_module, modules_enabled, role, is_premium
    FROM public.users WHERE LOWER(email)=LOWER(${email}) LIMIT 1
  `;
  return rows[0] || null;
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const rows = await q`
    SELECT id::text, email, name, active_module, modules_enabled, role, is_premium
    FROM public.users WHERE id=${id} LIMIT 1
  `;
  return rows[0] || null;
}

export async function createUser(email: string, password: string, name?: string | null): Promise<SafeUser> {
  const password_hash = await hashPassword(password);
  const rows = await q`
    INSERT INTO public.users (email, password_hash, name)
    VALUES (${email}, ${password_hash}, ${name ?? null})
    RETURNING id::text, email, name, active_module, modules_enabled, role, is_premium
  `;
  return rows[0];
}

export async function createSession(userId: string, ip?: string | null, ua?: string | null) {
  const token = crypto.randomUUID();
  const now = new Date();
  const expires = addDays(now, SESSION_TTL_DAYS);
  await q`
    INSERT INTO public.sessions (token, user_id, created_at, last_seen_at, expires_at, ip, user_agent)
    VALUES (${token}, ${userId}::uuid, ${now.toISOString()}, ${now.toISOString()}, ${expires.toISOString()}, ${ip ?? null}, ${ua ?? null})
  `;
  return { token, expires };
}

export async function touchSession(token: string) {
  const now = new Date();
  await q`UPDATE public.sessions SET last_seen_at=${now.toISOString()} WHERE token=${token}`;
}

export async function getUserBySessionToken(token: string): Promise<SafeUser | null> {
  const rows = await q`
    SELECT u.id::text, u.email, u.name, u.active_module, u.modules_enabled, u.role, u.is_premium
    FROM public.sessions s
    JOIN public.users u ON u.id = s.user_id
    WHERE s.token=${token} AND s.expires_at > NOW()
    LIMIT 1
  `;
  if (!rows[0]) return null;
  await touchSession(token);
  return rows[0];
}

export async function deleteSession(token: string) {
  await q`DELETE FROM public.sessions WHERE token=${token}`;
}

export function readSidFromRequest(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    if (p.startsWith('sid=')) return decodeURIComponent(p.slice(4));
  }
  return null;
}

/** Require a logged-in user inside a route handler. Returns SafeUser or throws 401 response. */
export async function requireUser(req: Request): Promise<SafeUser> {
  const sid = readSidFromRequest(req);
  if (!sid) {
    throw new Response(JSON.stringify({ error: 'auth required' }), { status: 401 });
  }
  const user = await getUserBySessionToken(sid);
  if (!user) {
    throw new Response(JSON.stringify({ error: 'auth expired' }), { status: 401 });
  }
  return user;
}
