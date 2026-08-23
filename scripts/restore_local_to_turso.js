require('dotenv').config();
const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const localDbPath = path.join(process.cwd(), 'cantina.db');
const localDb = new Database(localDbPath);

const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://cantina-vini-shira-11.aws-eu-west-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const tursoClient = createClient({
  url: tursoUrl,
  authToken: tursoToken
});

async function restoreLocalToTurso() {
  console.log("Restoring local cantina.db data directly to Turso Cloud DB...");

  const tables = ['Location', 'User', 'SystemSettings', 'Wine', 'GrapeVariety', 'Movement', 'WinePhoto', 'UserSession', 'InventorySession', 'InventoryItem'];

  // Wipe Turso tables first in reverse order
  const deleteOrder = ['InventoryItem', 'InventorySession', 'UserSession', 'WinePhoto', 'Movement', 'GrapeVariety', 'Wine', 'SystemSettings', 'User', 'Location'];
  for (const tbl of deleteOrder) {
    try {
      await tursoClient.execute(`DELETE FROM ${tbl};`);
    } catch (e) {
      console.log(`Note clearing ${tbl}:`, e.message);
    }
  }

  for (const tableName of tables) {
    const rows = localDb.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`Uploading ${rows.length} rows for table ${tableName} to Turso...`);
    if (rows.length === 0) continue;

    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const stmts = batch.map(row => {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
        const args = keys.map(k => {
          let val = row[k];
          if (typeof val === 'boolean') val = val ? 1 : 0;
          return val;
        });
        return { sql, args };
      });
      await tursoClient.batch(stmts, 'write');
    }
    console.log(`✓ Table ${tableName} (${rows.length} rows) successfully restored to Turso!`);
  }

  console.log("🎉 ALL WAREHOUSE AND MOVEMENT DATA 100% PERFECTLY RESTORED TO TURSO!");
}

restoreLocalToTurso().catch(console.error);
