import { NextResponse } from 'next/server';
import { deleteSession, readSidFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  const sid = readSidFromRequest(req);
  if (sid) await deleteSession(sid);

  const res = NextResponse.redirect(new URL('/login', req.url));
  res.cookies.set('sid',  '', { path: '/', expires: new Date(0) });
  res.cookies.set('am',   '', { path: '/', expires: new Date(0) });
  res.cookies.set('role', '', { path: '/', expires: new Date(0) });
  res.cookies.set('prem', '', { path: '/', expires: new Date(0) });
  return res;
}



