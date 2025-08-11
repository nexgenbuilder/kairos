// src/app/api/prospects/route.ts
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req);
  const rows = await q`
    SELECT * FROM prospects
    WHERE user_id=${user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const b = await req.json();

  const rows = await q`
    INSERT INTO prospects (id, user_id, name, email, phone, company, notes, stage, created_at, updated_at)
    VALUES (gen_random_uuid(), ${user.id}, ${b.name ?? null}, ${b.email ?? null}, ${b.phone ?? null},
            ${b.company ?? null}, ${b.notes ?? null}, ${b.stage ?? 'new'}, NOW(), NOW())
    RETURNING *;
  `;
  return NextResponse.json(rows[0]);
}

