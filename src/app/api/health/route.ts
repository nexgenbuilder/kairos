import { NextResponse } from 'next/server';
import { withClient } from '@/lib/db';

export async function GET() {
  try {
    const res = await withClient(c => c.query('SELECT 1 as ok'));
    return NextResponse.json({ ok: true, db: res.rows?.[0]?.ok === 1 ? 'up' : 'unknown' });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || 'db' }, { status: 500 });
  }
}
