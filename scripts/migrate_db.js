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
  } catch (err) {
    console.error('Migration execution error:', err);
  }
} else {
  console.warn('Database file not found at:', dbPath);
}
