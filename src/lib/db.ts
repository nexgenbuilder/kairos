// src/lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false as any
});

// Support both: q`select ... ${x}` and q('select ... $1', [x])
export async function q(strings: TemplateStringsArray | string, ...values: any[]): Promise<any[]> {
  let text: string;
  let params: any[] = [];

  // Template-tag call
  if (Array.isArray(strings) && 'raw' in strings) {
    const parts = strings as TemplateStringsArray;
    const chunks: string[] = [];
    parts.forEach((part, i) => {
      chunks.push(part);
      if (i < values.length) {
        params.push(values[i]);
        chunks.push(`$${params.length}`);
      }
    });
    text = chunks.join('');
  } else {
    // Normal function call: q(text, params?)
    text = String(strings);
    params = (values && values[0]) || [];
  }

  const res = await pool.query(text, params);
  return res.rows;
}




