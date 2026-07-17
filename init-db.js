const db = require('./lib/db');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      origin TEXT NOT NULL,
      vintage TEXT NOT NULL,
      description TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Database initialized successfully.');
}

initDb();
