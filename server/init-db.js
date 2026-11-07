import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runInit() {
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'invmage'}`;

  console.log(`[DB Init] Initializing PostgreSQL database with schema...`);
  console.log(`[DB Init] Target: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('[DB Init] Connected successfully.');

    const schemaPath = path.resolve(__dirname, '../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('[DB Init] Applying schema.sql...');
    await client.query(sql);
    console.log('[DB Init] Schema applied successfully!');

    // Check count
    const { rows } = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('[DB Init] Tables present in public schema:');
    rows.forEach(r => console.log(` - ${r.table_name}`));

    await client.end();
    console.log('[DB Init] Finished.');
  } catch (err) {
    console.error('[DB Init] Error:', err.message);
    process.exit(1);
  }
}

runInit();

