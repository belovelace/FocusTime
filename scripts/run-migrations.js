// Run SQL migration from db/migrations/init.sql using DATABASE_URL from .env
// Usage: node scripts/run-migrations.js

import fs from 'fs/promises';
import { URL } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env');
  process.exit(1);
}

const url = new URL(DATABASE_URL.replace(/^\"|\"$/g, ''));
if (url.protocol !== 'mysql:' && url.protocol !== 'mysql2:') {
  console.error('Unsupported protocol in DATABASE_URL. Expected mysql://');
  process.exit(1);
}

const user = decodeURIComponent(url.username || 'root');
const password = decodeURIComponent(url.password || '');
const host = url.hostname;
const port = url.port ? parseInt(url.port, 10) : 3306;
const database = url.pathname.replace(/^\//, '');

async function main() {
  const sql = await fs.readFile(new URL('../db/migrations/init.sql', import.meta.url), 'utf8');
  console.log('Connecting to MySQL %s@%s:%s/%s', user, host, port, database);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  try {
    console.log('Running migration...');
    const [result] = await conn.query(sql);
    console.log('Migration executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 2;
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
