const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const localDbPath = path.join(process.cwd(), 'prisma', 'cantina.db');
const localDb = new Database(localDbPath);

const tursoUrl = 'libsql://cantina-vini-shira-11.aws-eu-west-1.turso.io';
const tursoToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcwOTA3ODEsImlkIjoiMDFhMDE2ZTQtZGQwMS03ZTUxLWIyMmEtMWJhNDQ3MjE5NWIxIiwia2lkIjoiSHc3R0dMbmtHd1YwdUs1OW9ZSGc2QnhHdlZqWWkya0ZHQzU0UTlkRW9ycyIsInJpZCI6ImNkNGE5YWVlLTQ0MDAtNDFkYS05YWZhLWY0MjNhYzlmNzEwMiJ9.P2tjJLvzc_P9p-c66kaixjFxeiWQaApSMV6t3uDOYLxkEoFJtTc9nIBNfbDJ2_0o4yn7aQNUd-JQ94p1zBP9Dw';

const tursoClient = createClient({
  url: tursoUrl,
  authToken: tursoToken
});

async function syncTursoToLocal() {
  console.log("Synchronizing Turso Cloud Database to Local cantina.db...");

  const tables = ['Location', 'User', 'SystemSettings', 'Wine', 'GrapeVariety', 'Movement', 'WinePhoto', 'UserSession', 'InventorySession', 'InventoryItem'];

  for (const table of tables) {
    const res = await tursoClient.execute(`SELECT * FROM ${table}`);
    console.log(`Downloading ${res.rows.length} rows for table ${table}...`);
    
    localDb.prepare(`DELETE FROM ${table}`).run();

    if (res.rows.length > 0) {
      const keys = Object.keys(res.rows[0]);
      const placeholders = keys.map(() => '?').join(', ');
      const insertStmt = localDb.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);

      const insertMany = localDb.transaction((rows) => {
        for (const row of rows) {
          const values = keys.map(k => row[k]);
          insertStmt.run(...values);
        }
      });

      insertMany(res.rows);
    }
    console.log(`✓ Local ${table} synchronized!`);
  }

  console.log("🎉 LOCAL DATABASE IS NOW 100% PERFECTLY SYNCHRONIZED WITH TURSO CLOUD!");
}

syncTursoToLocal().catch(console.error);
