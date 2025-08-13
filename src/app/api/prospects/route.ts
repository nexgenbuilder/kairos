// src/app/api/prospects/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

// Allowed stage values (lowercase) – must match the DB constraint
const ALLOWED_STAGES = new Set(['new', 'lead', 'qualified', 'proposal', 'won', 'lost']);

export async function GET(req: Request) {
  const user = await requireUser(req);

  const rows = await q`
    SELECT
      p.id::text,
      p.name,
      p.email,
      p.phone,
      p.company,
      p.notes,
      p.stage,
      p.created_at,
      COALESCE(ic.cnt, 0)::int AS interactions_count,
      lc.last_at AS last_interaction_at
    FROM public.prospects p
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS cnt
      FROM public.prospect_interactions pi
      WHERE pi.prospect_id = p.id
    ) ic ON true
    LEFT JOIN LATERAL (
      SELECT MAX(pi.created_at) AS last_at
      FROM public.prospect_interactions pi
      WHERE pi.prospect_id = p.id
    ) lc ON true
    WHERE p.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json().catch(() => ({}));

  const name = String(b.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const email   = b.email   ? String(b.email).trim()   : null;
  const phone   = b.phone   ? String(b.phone).trim()   : null;
  const company = b.company ? String(b.company).trim() : null;
  const notes   = b.notes   ? String(b.notes).trim()   : null;

  // Force a safe default; ignore bogus/styled values from the client
  let stage = String(b.stage ?? '').toLowerCase();
  if (!ALLOWED_STAGES.has(stage)) stage = 'lead';

  const rows = await q`
    INSERT INTO public.prospects
      (user_id, name, email, phone, company, notes, stage, created_at, updated_at)
    VALUES
      (${user.id}, ${name}, ${email}, ${phone}, ${company}, ${notes}, ${stage}, NOW(), NOW())
    RETURNING
      id::text, name, email, phone, company, notes, stage, created_at
  `;

  return NextResponse.json(rows[0]);
}

