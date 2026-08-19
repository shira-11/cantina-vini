require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');

const prisma = new PrismaClient();

const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://cantina-vini-shira-11.aws-eu-west-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const tursoClient = createClient({
  url: tursoUrl,
  authToken: tursoToken
});

async function migrateAndUpload() {
  console.log("Creating tables on Turso cloud database...");

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS Wine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      vintage TEXT,
      country TEXT,
      region TEXT,
      producerCellar TEXT,
      producer TEXT,
      classification TEXT,
      category TEXT,
      type TEXT,
      alcoholContent REAL,
      tempMin REAL,
      tempMax REAL,
      bottleType TEXT,
      notes TEXT,
      photo TEXT,
      photoBack TEXT,
      isArchived BOOLEAN NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS GrapeVariety (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      percentage REAL,
      wineId INTEGER NOT NULL,
      FOREIGN KEY (wineId) REFERENCES Wine(id) ON DELETE CASCADE
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS Location (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      parentId INTEGER
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS Movement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      movementType TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      bottleType TEXT,
      reason TEXT,
      vendor TEXT,
      price REAL,
      tempPrice REAL,
      notes TEXT,
      user TEXT,
      wineId INTEGER NOT NULL,
      locationId INTEGER NOT NULL
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS WinePhoto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      wineId INTEGER NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      isActive BOOLEAN NOT NULL DEFAULT 1,
      autoLogoutEnabled BOOLEAN NOT NULL DEFAULT 1,
      autoLogoutMinutes INTEGER NOT NULL DEFAULT 30,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS UserSession (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      username TEXT NOT NULL,
      loginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
      logoutTime DATETIME,
      logoutReason TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS SystemSettings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS InventorySession (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER NOT NULL DEFAULT 2026,
      status TEXT NOT NULL DEFAULT 'in_progress',
      notes TEXT,
      createdBy TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS InventoryItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      wineId INTEGER NOT NULL,
      locationId INTEGER,
      expectedQty INTEGER NOT NULL DEFAULT 0,
      countedQty INTEGER,
      isChecked BOOLEAN NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Tables created successfully on Turso!");

  const modelMap = {
    Location: () => prisma.location.findMany(),
    User: () => prisma.user.findMany(),
    SystemSettings: () => prisma.systemSettings.findMany(),
    Wine: () => prisma.wine.findMany(),
    GrapeVariety: () => prisma.grapeVariety.findMany(),
    Movement: () => prisma.movement.findMany(),
    WinePhoto: () => prisma.winePhoto.findMany(),
    UserSession: () => prisma.userSession.findMany(),
    InventorySession: () => prisma.inventorySession.findMany(),
    InventoryItem: () => prisma.inventoryItem.findMany()
  };

  // Wipe Turso tables first in reverse dependency order for 100% exact 1-to-1 sync
  const deleteOrder = ['InventoryItem', 'InventorySession', 'UserSession', 'WinePhoto', 'Movement', 'GrapeVariety', 'Wine', 'SystemSettings', 'User', 'Location'];
  for (const tbl of deleteOrder) {
    try {
      await tursoClient.execute(`DELETE FROM ${tbl};`);
    } catch (e) {
      console.log(`Note clearing ${tbl}:`, e.message);
    }
  }

  for (const [tableName, fetcher] of Object.entries(modelMap)) {
    const rows = await fetcher();
    console.log(`Uploading ${rows.length} rows for table ${tableName}...`);
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
          if (val instanceof Date) val = val.toISOString();
          if (typeof val === 'boolean') val = val ? 1 : 0;
          return val;
        });
        return { sql, args };
      });
      await tursoClient.batch(stmts, 'write');
    }
    console.log(`✓ Table ${tableName} sync complete!`);
  }

  console.log("🎉 ALL DATA SUCCESSFULLY UPLOADED TO TURSO!");
}

migrateAndUpload().catch(console.error);
