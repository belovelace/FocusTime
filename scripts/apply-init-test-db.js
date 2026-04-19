const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  try {
    const sql = fs.readFileSync('db/migrations/init.sql', 'utf8');

    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || '1234';
    const dbName = process.env.DB_NAME || process.env.TARGET_DB || 'focustime_test';

    const conn = await mysql.createConnection({
      host,
      user,
      password,
      multipleStatements: true,
    });

    console.log(`Creating database ${dbName} if not exists...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.query(`USE \`${dbName}\``);

    console.log(`Applying init.sql to ${dbName}...`);
    await conn.query(sql);
    console.log(`init.sql applied successfully to ${dbName}`);

    await conn.end();
  } catch (err) {
    console.error('Error applying init.sql:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();