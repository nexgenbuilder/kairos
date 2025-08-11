const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
      ? { rejectUnauthorized: false }
      : false
  });

  const client = await pool.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY);');
    const applied = new Set(
      (await client.query('SELECT id FROM migrations')).rows.map(r => r.id)
    );

    const dir = path.join(process.cwd(), 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`Applying ${file}...`);
      await client.query(sql);
      await client.query('INSERT INTO migrations (id) VALUES ($1);', [file]);
    }

    console.log('Migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
