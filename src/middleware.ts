import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkLimit } from '@/lib/limiter';

const PUBLIC_PATHS = new Set([
  '/login',
  '/register',
  '/locked',
  '/settings/modules',
  '/admin/delete',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/billing/success',
  '/billing/cancel',
  '/api/billing/webhook',
]);

const FREE_MODE = process.env.NEXT_PUBLIC_FREE_MODE === '1';

function requiredModule(pathname: string): string | null {
  if (pathname.startsWith('/prospects')) return 'prospects';
  if (pathname.startsWith('/tasks')) return 'tasks';
  if (pathname.startsWith('/cashflow')) return 'cashflow';
  if (pathname.startsWith('/content')) return 'content';
  if (pathname.startsWith('/inventory')) return 'inventory';
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Static & framework
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public')
  ) return NextResponse.next();

  // Basic rate limiting for write-heavy API calls
  if (pathname.startsWith('/api/')) {
    if (!PUBLIC_PATHS.has(pathname) && ['POST','PATCH','PUT','DELETE'].includes(req.method)) {
      const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'anon';
      const { allowed, retryAfter } = checkLimit(String(ip));
      if (!allowed) {
        const res = NextResponse.json({ error: 'rate_limited' }, { status: 429 });
        if (retryAfter) res.headers.set('Retry-After', String(retryAfter));
        return res;
      }
    }
    // auth/public API is allowed without cookie; others fall through to auth check
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  // Require login for everything else
  const sid = req.cookies.get('sid')?.value;
  if (!sid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(url);
  }

  // FREE MODE: skip module gating
  if (FREE_MODE) return NextResponse.next();

  const role = req.cookies.get('role')?.value || 'user';
  const prem = req.cookies.get('prem')?.value === '1';
  if (role === 'superadmin' || prem) return NextResponse.next();

  const need = requiredModule(pathname);
  if (!need) return NextResponse.next();

  const am = req.cookies.get('am')?.value || null;
  if (!am) {
    const url = req.nextUrl.clone();
    url.pathname = '/settings/modules';
    url.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(url);
  }

  if (am !== need) {
    const url = req.nextUrl.clone();
    url.pathname = '/locked';
    url.search = `?module=${encodeURIComponent(need)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!.*\\.).*)'] };






