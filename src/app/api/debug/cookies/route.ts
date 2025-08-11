import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  return NextResponse.json({ cookie: cookieHeader });
}
