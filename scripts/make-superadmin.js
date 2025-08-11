require('dotenv').config();
const { Pool } = require('pg');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-superadmin.js you@example.com');
  process.exit(1);
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(
      `UPDATE public.users SET role='superadmin' WHERE LOWER(email)=LOWER($1)`,
      [email]
    );
    console.log(rowCount ? `✓ ${email} is now superadmin` : `No user found for ${email}`);
  } finally {
    client.release(); await pool.end();
  }
})().catch(e => { console.error(e); process.exit(1); });
