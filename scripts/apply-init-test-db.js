const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  try {
    const sql = fs.readFileSync('db/migrations/init.sql', 'utf8');
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      multipleStatements: true,
    });

    console.log('Creating database focustime_test if not exists...');
    await conn.query("CREATE DATABASE IF NOT EXISTS focustime_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    await conn.query('USE focustime_test');

    console.log('Applying init.sql to focustime_test...');
    await conn.query(sql);
    console.log('init.sql applied successfully to focustime_test');

    await conn.end();
  } catch (err) {
    console.error('Error applying init.sql:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();