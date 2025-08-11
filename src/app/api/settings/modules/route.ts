import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';

const ALLOWED = ['prospects','tasks','cashflow','content','inventory'] as const;
type Mod = typeof ALLOWED[number];

function setAmCookie(res: NextResponse, mod: Mod | null) {
  if (!mod) res.cookies.set('am', '', { path: '/', expires: new Date(0) });
  else res.cookies.set('am', mod, { path: '/', maxAge: 60 * 60 * 24 * 90 });
}

async function deleteAllExcept(userId: string, keep: Mod) {
  // (Legacy free mode behavior – NOT used during beta)
  if (keep !== 'tasks') {
    await q`DELETE FROM public.tasks WHERE user_id=${userId}`;
    await q`DELETE FROM public.task_categories WHERE user_id=${userId}`;
  }
  if (keep !== 'prospects') {
    await q`DELETE FROM public.prospects WHERE user_id=${userId}`;
  }
  if (keep !== 'cashflow') {
    await q`DELETE FROM public.transactions WHERE user_id=${userId} AND deal_id IS NULL`;
  }
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  return NextResponse.json({
    allowed: ALLOWED,
    active: user.active_module,
    enabled: Array.isArray(user.modules_enabled) ? user.modules_enabled : [],
    role: user.role,
    is_premium: user.is_premium,
    beta_free: process.env.BETA_FREE === '1',
  });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const isBeta = process.env.BETA_FREE === '1';
  const ctype = req.headers.get('content-type') || '';

  let active = '';
  let confirm = '';
  if (ctype.includes('application/json')) {
    const b = await req.json().catch(() => ({}));
    active = String(b.active_module ?? '').trim();
    confirm = String(b.confirm ?? '').trim().toLowerCase();
  } else {
    const fd = await req.formData().catch(() => null);
    active = String(fd?.get('active_module') ?? '').trim();
    confirm = String((fd?.get('confirm') ?? '')).trim().toLowerCase();
  }

  if (!ALLOWED.includes(active as Mod)) {
    return NextResponse.json({ error: 'invalid module' }, { status: 400 });
  }

  // During beta: allow enabling multiple modules, no destructive reset.
  if (isBeta) {
    const rows = await q`
      UPDATE public.users
      SET
        active_module = ${active},
        modules_enabled = CASE
          WHEN modules_enabled @> to_jsonb(${active}::text)
            THEN modules_enabled
          ELSE modules_enabled || to_jsonb(${active}::text)
        END
      WHERE id = ${user.id}
      RETURNING id::text, email, name, active_module, modules_enabled, role, is_premium
    `;
    const updated = rows[0];
    const res = NextResponse.redirect(new URL('/settings/modules', req.url));
    setAmCookie(res, updated.active_module as Mod);
    res.cookies.set('role', updated.role, { path: '/' });
    return res;
  }

  // Non-beta (legacy free limitation): only one module, destructive on switch for free users
  const switching = user.active_module && user.active_module !== active;
  const freeUser = !user.is_premium && user.role !== 'superadmin';
  if (switching && freeUser) {
    if (!ctype.includes('application/json')) {
      if (confirm !== 'yes' && confirm !== 'on' && confirm !== 'true') {
        return NextResponse.redirect(new URL('/settings/modules?warn=confirm', req.url));
      }
    }
    await deleteAllExcept(user.id, active as Mod);
  }

  const rows = await q`
    UPDATE public.users
    SET
      active_module = ${active},
      modules_enabled = CASE
        WHEN modules_enabled @> to_jsonb(${active}::text)
          THEN modules_enabled
        ELSE modules_enabled || to_jsonb(${active}::text)
      END
    WHERE id = ${user.id}
    RETURNING id::text, email, name, active_module, modules_enabled, role, is_premium
  `;
  const updated = rows[0];

  const isForm = !ctype.includes('application/json');
  if (isForm) {
    const res = NextResponse.redirect(new URL('/settings/modules', req.url));
    setAmCookie(res, updated.active_module as Mod);
    res.cookies.set('role', updated.role, { path: '/' });
    return res;
  }

  const res = NextResponse.json({ ok: true, user: updated });
  setAmCookie(res, updated.active_module as Mod);
  res.cookies.set('role', updated.role, { path: '/' });
  return res;
}
