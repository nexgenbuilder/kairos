// src/lib/db.ts
import { Pool, PoolClient, QueryResult } from 'pg';

const connStr = process.env.DATABASE_URL!;
if (!connStr) throw new Error('DATABASE_URL missing');

const pool = new Pool({
  connectionString: connStr,
  max: Number(process.env.PGPOOL_MAX ?? 20),
  min: 2,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('connect', async (client) => {
  try {
    await client.query(`SET application_name = 'personal-ops-app'`);
    await client.query(`SET statement_timeout = '${process.env.PG_STATEMENT_TIMEOUT ?? '8000'}'`);
    await client.query(`SET idle_in_transaction_session_timeout = '5000'`);
  } catch {}
});

async function run(sql: string, params: any[] = []): Promise<any[]> {
  const res: QueryResult = await pool.query(sql, params);
  return (res as any).rows ?? res;
}

export async function withClient<T>(fn: (c: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try { return await fn(client); }
  finally { client.release(); }
}

// Supports both usages:
//   q`SELECT * FROM table WHERE id=${id}`
//   q('SELECT * FROM table WHERE id=$1', [id])
export const q: any = (first: TemplateStringsArray | string, ...values: any[]) => {
  // Tagged template: first is TemplateStringsArray
  if (Array.isArray(first) && Object.prototype.hasOwnProperty.call(first, 'raw')) {
    const strings = first as TemplateStringsArray;
    let text = '';
    const params: any[] = [];
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) {
        params.push(values[i]);
        text += `$${params.length}`;
      }
    }
    return run(text, params);
  }

  // q(sql, params)
  const sql = String(first);
  const params = values[0] ?? [];
  return run(sql, params);
};

export default pool;

