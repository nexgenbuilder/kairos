import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT id::text, name
    FROM public.transaction_categories
    WHERE user_id=${user.id}
    ORDER BY name
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const rows = await q`
    INSERT INTO public.transaction_categories (user_id, name)
    VALUES (${user.id}, ${name})
    ON CONFLICT (user_id, name) DO NOTHING
    RETURNING id::text, name
  `;
  if (rows[0]) return NextResponse.json(rows[0]);

  const existing = await q`
    SELECT id::text, name
    FROM public.transaction_categories
    WHERE user_id=${user.id} AND name=${name}
    LIMIT 1
  `;
  return NextResponse.json(existing[0] ?? { id: null, name });
}
