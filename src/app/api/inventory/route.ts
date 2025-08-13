// src/app/api/inventory/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

function like(s: string) {
  return `%${s.toLowerCase()}%`;
}

/** GET /api/inventory?q=...&category=...&location=... */
export async function GET(req: Request) {
  const user = await requireUser(req);
  const url = new URL(req.url);
  const qstr = (url.searchParams.get('q') || '').trim().toLowerCase();
  const category = (url.searchParams.get('category') || '').trim();
  const location = (url.searchParams.get('location') || '').trim();

  const conds: string[] = [`user_id = $1::uuid`];
  const vals: any[] = [user.id];
  let i = 2;

  if (qstr) {
    conds.push(`(LOWER(name) LIKE $${i} OR LOWER(sku) LIKE $${i})`);
    vals.push(like(qstr));
    i++;
  }
  if (category) {
    conds.push(`category = $${i}`);
    vals.push(category);
    i++;
  }
  if (location) {
    conds.push(`location = $${i}`);
    vals.push(location);
    i++;
  }

  const rows = await q(
    `
    SELECT
      id::text, name, sku, qty, unit_cost, unit_price, category, location, notes,
      created_at, updated_at
    FROM public.inventory_items
    WHERE ${conds.join(' AND ')}
    ORDER BY created_at DESC
    `,
    vals
  );

  return NextResponse.json(rows);
}

/** POST /api/inventory */
export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json().catch(() => ({}));

  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }
  const sku = body.sku ? String(body.sku) : null;
  const qty = body.qty !== undefined ? Number(body.qty) : 0;
  const unit_cost = body.unit_cost !== undefined ? Number(body.unit_cost) : null;
  const unit_price = body.unit_price !== undefined ? Number(body.unit_price) : null;
  const category = body.category ? String(body.category) : null;
  const location = body.location ? String(body.location) : null;
  const notes = body.notes ? String(body.notes) : null;

  const rows = await q(
    `
    INSERT INTO public.inventory_items
      (user_id, name, sku, qty, unit_cost, unit_price, category, location, notes, created_at, updated_at)
    VALUES
      ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING id::text, name, sku, qty, unit_cost, unit_price, category, location, notes, created_at, updated_at
    `,
    [user.id, name, sku, qty, unit_cost, unit_price, category, location, notes]
  );

  return NextResponse.json(rows[0]);
}
