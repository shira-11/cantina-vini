const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'prisma', 'cantina.db');
console.log('Running database migration for Railway/Production at:', dbPath);

if (fs.existsSync(dbPath)) {
  try {
    const db = new Database(dbPath);

    try {
      db.prepare('ALTER TABLE User ADD COLUMN autoLogoutEnabled BOOLEAN DEFAULT 1').run();
      console.log('Added autoLogoutEnabled column');
    } catch (e) {
      console.log('autoLogoutEnabled column exists or skipped');
    }

    try {
      db.prepare('ALTER TABLE User ADD COLUMN autoLogoutMinutes INTEGER DEFAULT 30').run();
      console.log('Added autoLogoutMinutes column');
    } catch (e) {
      console.log('autoLogoutMinutes column exists or skipped');
    }

    try {
      db.prepare('ALTER TABLE User ADD COLUMN maxDevices INTEGER DEFAULT 2').run();
      console.log('Added maxDevices column');
    } catch (e) {
      console.log('maxDevices column exists or skipped');
    }

    try {
      db.prepare('UPDATE Wine SET isArchived = 0 WHERE isArchived IS NULL').run();
      console.log('Updated null isArchived values to 0');
    } catch (e) {
      console.log('isArchived update skipped:', e.message);
    }

    try {
      db.exec(`
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
        )
      `);
      console.log('Created UserSession table');
    } catch (e) {
      console.log('UserSession table status:', e.message);
    }

    try {
      db.prepare('ALTER TABLE Location ADD COLUMN parentId INTEGER').run();
      console.log('Added parentId column to Location');
    } catch (e) {
      console.log('parentId column on Location exists or skipped');
    }

    try {
      db.exec(`
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
        )
      `);
      console.log('Created InventorySession table');
    } catch (e) {
      console.log('InventorySession table status:', e.message);
    }

    try {
      db.exec(`
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
        )
      `);
      console.log('Created InventoryItem table');
    } catch (e) {
      console.log('InventoryItem table status:', e.message);
    }

    try {
      const locationsToEnsure = [
        'Cantina Arezzo',
        'Cantina Milano',
        'Cantina Saint Moritz',
        'Cantina Levanzo',
        'Casa Nera'
      ];
      for (const locName of locationsToEnsure) {
        const existing = db.prepare('SELECT id FROM Location WHERE name = ?').get(locName);
        if (!existing) {
          db.prepare('INSERT INTO Location (name) VALUES (?)').run(locName);
          console.log(`Inserted missing location: ${locName}`);
        }
      }
    } catch (e) {
      console.log('Location sync status:', e.message);
    }
  } catch (err) {
    console.error('Migration execution error:', err);
  }
} else {
  console.warn('Database file not found at:', dbPath);
}
