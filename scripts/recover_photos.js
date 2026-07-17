const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("1. Caricamento dati...");
  
  if (!fs.existsSync('wines_data_v5.json')) {
    console.log("File PDF dati non trovato.");
    return;
  }
  const pdfData = JSON.parse(fs.readFileSync('wines_data_v5.json')).filter(p => p.photo);
  
  const allWines = await prisma.wine.findMany();
  const missingPhotos = allWines.filter(w => !w.photo);
  console.log(`Vini senza foto: ${missingPhotos.length}`);
  
  let recoveredCount = 0;

  for (const wine of missingPhotos) {
    const dbNameRaw = wine.name.toLowerCase().replace(/['’]/g, "");
    // Split in words, removing short words like "di", "del", "la", "il"
    const dbWords = dbNameRaw.split(/\s+/).filter(w => w.length > 2);
    
    let bestMatch = null;
    let maxOverlap = 0;

    for (const pdfWine of pdfData) {
      const pdfNameRaw = pdfWine.name.toLowerCase().replace(/['’]/g, "");
      const pdfWords = pdfNameRaw.split(/\s+/).filter(w => w.length > 2);
      
      // Calculate overlap: how many words in pdfWords are in dbWords
      let overlap = 0;
      for (const pw of pdfWords) {
        if (dbWords.includes(pw) || dbWords.some(dw => dw.includes(pw) || pw.includes(dw))) {
          overlap++;
        }
      }

      // If at least 2 significant words match, or if it's a 1-word name and it matches
      const requiredOverlap = Math.min(pdfWords.length, 2);
      
      if (overlap >= requiredOverlap && overlap > maxOverlap) {
        bestMatch = pdfWine;
        maxOverlap = overlap;
      }
    }

    if (bestMatch) {
      // console.log(`Matched: [DB] ${wine.name} -> [PDF] ${bestMatch.name}`);
      await prisma.wine.update({
        where: { id: wine.id },
        data: { photo: bestMatch.photo }
      });
      recoveredCount++;
    }
  }

  console.log(`Recuperate e assegnate con successo ${recoveredCount} foto usando la ricerca avanzata per parole!`);
}

main().finally(() => prisma.$disconnect());
