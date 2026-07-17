const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  console.log("1. Fix dati da wines.db...");
  const oldDb = new Database('wines.db', { fileMustExist: true });
  const oldWines = oldDb.prepare('SELECT * FROM wines').all();
  
  let count = 0;
  for (const w of oldWines) {
    let producerCellar = null;
    let classification = null;
    
    if (w.description) {
      const cantinaMatch = w.description.match(/Cantina:\s*([^|]+)/);
      if (cantinaMatch) producerCellar = cantinaMatch[1].trim();
      
      const classMatch = w.description.match(/Classificazione:\s*([^|]+)/);
      if (classMatch) classification = classMatch[1].trim();
    }
    
    // In rebuild_db I wrongly mapped w.origin to region. It should be country.
    // Let's find the wine by name and vintage to update it.
    // Wait, multiple wines might have the same name and vintage if there were duplicates.
    // It's safer to just fetch all Prisma wines and update them based on matching oldWines.
  }
  
  // Actually, let's just update all Prisma wines by finding the corresponding oldWines row.
  const prismaWines = await prisma.wine.findMany();
  for (const pw of prismaWines) {
    const oldW = oldWines.find(o => o.name === pw.name && o.vintage === pw.vintage);
    if (oldW) {
      let producerCellar = null;
      let classification = null;
      
      if (oldW.description) {
        const cantinaMatch = oldW.description.match(/Cantina:\s*([^|]+)/);
        if (cantinaMatch) producerCellar = cantinaMatch[1].trim();
        
        const classMatch = oldW.description.match(/Classificazione:\s*([^|]+)/);
        if (classMatch) classification = classMatch[1].trim();
      }
      
      await prisma.wine.update({
        where: { id: pw.id },
        data: {
          country: oldW.origin !== 'N/D' ? oldW.origin : null,
          region: null, // Reset region since it was wrongly populated with country
          producerCellar: producerCellar,
          classification: classification
        }
      });
      count++;
    }
  }
  console.log(`Aggiornati ${count} vini con nazione, cantina e classificazione da wines.db.`);

  // 2. Enrich from PDF data
  if (fs.existsSync('wines_data_v5.json')) {
    const pdfData = JSON.parse(fs.readFileSync('wines_data_v5.json'));
    let pdfCount = 0;
    
    for (const pdfWine of pdfData) {
      const pName = pdfWine.name.toLowerCase().trim().replace(/['’]/g, "");
      
      const matches = prismaWines.filter(w => {
        const dbName = w.name.toLowerCase().trim().replace(/['’]/g, "");
        return dbName === pName || dbName.startsWith(pName) || pName.startsWith(dbName);
      });
      
      for (const match of matches) {
        // Only update if it brings new info
        const dataToUpdate = {};
        if (pdfWine.region && pdfWine.region.trim() !== '') dataToUpdate.region = pdfWine.region;
        if (pdfWine.producer && pdfWine.producer.trim() !== '') dataToUpdate.producer = pdfWine.producer;
        
        // category was already mapped from w.type, but if pdf has a better one we can keep w.type.
        
        if (Object.keys(dataToUpdate).length > 0) {
          await prisma.wine.update({
            where: { id: match.id },
            data: dataToUpdate
          });
          pdfCount++;
        }
      }
    }
    console.log(`Arricchiti ${pdfCount} vini con dati extra (regione, produttore) dai PDF.`);
  }

}

main().finally(() => prisma.$disconnect());
