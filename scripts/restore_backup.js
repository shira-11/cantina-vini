const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  console.error('❌ Nessuna cartella backups trovata!');
  process.exit(1);
}

const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.db')).sort().reverse();

if (files.length === 0) {
  console.error('❌ Nessun file di backup trovato nella cartella backups!');
  process.exit(1);
}

const targetFileName = process.argv[2] || files[0];
const backupPath = path.join(backupDir, targetFileName);

if (!fs.existsSync(backupPath)) {
  console.error('❌ File non trovato:', backupPath);
  console.log('Elenco backup disponibili:', files);
  process.exit(1);
}

const target1 = path.join(__dirname, '..', 'cantina.db');
const target2 = path.join(__dirname, '..', 'prisma', 'cantina.db');

fs.copyFileSync(backupPath, target1);
fs.copyFileSync(backupPath, target2);

console.log(`✅ Database ripristinato dal backup: ${targetFileName}`);
console.log('🍷 Database pronto e funzionante con vini e giacenze intatte.');
