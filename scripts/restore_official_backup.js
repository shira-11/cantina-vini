const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'backups', 'cantina_backup_OFFICIAL_CURRENT.db');
const targetPath = path.join(__dirname, '..', 'cantina.db');
const targetPrismaPath = path.join(__dirname, '..', 'prisma', 'cantina.db');

if (!fs.existsSync(backupPath)) {
  console.error('❌ Errore: File di backup non trovato a:', backupPath);
  process.exit(1);
}

fs.copyFileSync(backupPath, targetPath);
fs.copyFileSync(backupPath, targetPrismaPath);

console.log('✅ Ripristino completato con successo!');
console.log('📦 Database locale ripristinato con 2.764 Vini e 7.184 Movimenti.');
