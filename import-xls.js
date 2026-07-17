const xlsx = require('xlsx');
const db = require('./lib/db');

function importData() {
  const workbook = xlsx.readFile('data base cantina.xls');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  let inserted = 0;

  for (const row of data) {
    const name = row['Nome Vino'];
    if (!name) continue; // Skip empty rows

    const vintage = row['Annata'] ? row['Annata'].toString() : 'N/D';
    const origin = row['Nazione'] || 'N/D';
    let type = row['Categoria'] || 'Sconosciuto';
    
    // Parse extra info for description
    const cantina = row['Cantina produttore'];
    const classificazione = row['Classificazione'];
    const disponibile = row['Disponibile'];
    const milano = row['Disp. Milano'];
    
    let descriptionParts = [];
    if (cantina) descriptionParts.push(`Cantina: ${cantina}`);
    if (classificazione) descriptionParts.push(`Classificazione: ${classificazione}`);
    if (disponibile !== undefined) descriptionParts.push(`Totale Disponibile: ${disponibile}`);
    if (milano !== undefined) descriptionParts.push(`Disp. Milano: ${milano}`);
    
    const description = descriptionParts.join(' | ');

    // Insert into DB
    const stmt = db.prepare(`
      INSERT INTO wines (name, type, origin, vintage, description, photo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(name, type, origin, vintage, description, null);
    inserted++;
  }

  console.log(`Importati ${inserted} vini con successo!`);
}

importData();
