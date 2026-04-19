import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const url = new URL(DATABASE_URL.replace(/^\"|\"$/g, ''));
const user = decodeURIComponent(url.username || 'root');
const password = decodeURIComponent(url.password || '');
const host = url.hostname;
const port = url.port ? parseInt(url.port, 10) : 3306;
const database = url.pathname.replace(/^\//, '');

async function main(){
  console.log('Connecting to MySQL server at %s:%s as %s', host, port, user);
  const conn = await mysql.createConnection({host, port, user, password, multipleStatements: true});
  try {
    const createSql = `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
    await conn.query(createSql);
    console.log('Database "%s" ensured (created if not exists).', database);
  } catch(err){
    console.error('Failed to create database:', err.message || err);
    process.exitCode = 2;
  } finally {
    await conn.end();
  }
}

main().catch(err=>{ console.error(err); process.exit(1); });
