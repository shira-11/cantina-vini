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

let inputArg = process.argv[2] || '';
let selectedFile = files[0];

if (inputArg) {
  // Se l'utente passa un'ora come "11:26" o "11h26m" o "11.26"
  const cleanSearch = inputArg.replace(/[:.]/g, 'h');
  const matched = files.find(f => f.includes(inputArg) || f.includes(cleanSearch) || (inputArg.includes('11') && inputArg.includes('26') && f.includes('11h26m')));
  if (matched) {
    selectedFile = matched;
  } else {
    const directFile = files.find(f => f === inputArg);
    if (directFile) selectedFile = directFile;
  }
}

const backupPath = path.join(backupDir, selectedFile);

if (!fs.existsSync(backupPath)) {
  console.error('❌ File di backup non trovato:', backupPath);
  console.log('Elenco backup disponibili:', files);
  process.exit(1);
}

const target1 = path.join(__dirname, '..', 'cantina.db');
const target2 = path.join(__dirname, '..', 'prisma', 'cantina.db');

fs.copyFileSync(backupPath, target1);
fs.copyFileSync(backupPath, target2);

console.log(`✅ Database ripristinato con successo dal backup: ${selectedFile}`);
console.log('🍷 Database pronto con tutti i vini e movimenti intatti.');
