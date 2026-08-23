const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const sourcePath = path.join(__dirname, '..', 'prisma', 'cantina.db');

if (!fs.existsSync(sourcePath)) {
  console.error('❌ Errore: cantina.db non trovato a:', sourcePath);
  process.exit(1);
}

const db = new Database(sourcePath);
const wines = db.prepare('SELECT COUNT(*) as c FROM Wine').get().c;
const movs = db.prepare('SELECT COUNT(*) as c FROM Movement').get().c;

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const day = pad(now.getDate());
const month = pad(now.getMonth() + 1);
const year = now.getFullYear();
const hours = pad(now.getHours());
const minutes = pad(now.getMinutes());

const fileName = `cantina_backup_${day}_${month}_${year}_${hours}h${minutes}m.db`;

const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const targetPath = path.join(backupDir, fileName);
fs.copyFileSync(sourcePath, targetPath);

console.log('✅ Backup con Data e Ora creato con successo!');
console.log('📁 File salvato:', fileName);
console.log('📍 Percorso:', targetPath);
console.log(`🍷 Contenuto: ${wines} Vini, ${movs} Movimenti.`);
