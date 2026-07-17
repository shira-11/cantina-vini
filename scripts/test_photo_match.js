const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

function normalize(s) {
  return s.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

async function main() {
  const allWines = await prisma.wine.findMany();
  const pdfData = JSON.parse(fs.readFileSync('wines_data_v5.json'));
  
  let matchCount = 0;
  let missing = 0;
  
  for (const card of pdfData) {
    if (!card.photo) continue;
    
    const pdfNorm = normalize(card.name);
    
    // Find all wines in DB that match this name
    const matches = allWines.filter(w => {
        const dbNorm = normalize(w.name);
        return dbNorm === pdfNorm || dbNorm.startsWith(pdfNorm) || pdfNorm.startsWith(dbNorm);
    });
    
    if (matches.length > 0) {
        matchCount++;
        for (const m of matches) {
            await prisma.wine.update({
                where: { id: m.id },
                data: { photo: card.photo }
            });
        }
    } else {
        missing++;
    }
  }
  
  console.log(`Matched photos for ${matchCount} wines in PDF. No match for ${missing} PDF wines.`);
}

main().finally(() => prisma.$disconnect());
