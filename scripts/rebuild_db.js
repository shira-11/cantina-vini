const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  console.log("1. Pulizia database Prisma...");
  await prisma.movement.deleteMany();
  await prisma.grapeVariety.deleteMany();
  await prisma.wine.deleteMany();

  console.log("2. Lettura vecchio wines.db...");
  const oldDb = new Database('wines.db', { fileMustExist: true });
  const oldWines = oldDb.prepare('SELECT * FROM wines').all();

  let count = 0;
  for (const w of oldWines) {
    const isArchived = w.type === 'Sconosciuto';

    // Parse quantity from description: "Totale Disponibile: 6 | Disp. Milano: 0"
    let qty = 0;
    if (w.description) {
      const match = w.description.match(/Totale Disponibile:\s*(\d+)/);
      if (match) qty = parseInt(match[1]);
    }

    const newWine = await prisma.wine.create({
      data: {
        name: w.name,
        vintage: w.vintage,
        category: w.type !== 'Sconosciuto' ? w.type : null,
        region: w.origin !== 'N/D' ? w.origin : null,
        isArchived: isArchived
      }
    });

    if (qty > 0) {
      // Find or create location
      let loc = await prisma.location.findFirst({ where: { name: 'Sconosciuta' } });
      if (!loc) loc = await prisma.location.create({ data: { name: 'Sconosciuta' } });

      await prisma.movement.create({
        data: {
          wineId: newWine.id,
          locationId: loc.id,
          movementType: 'Ingresso',
          quantity: qty,
          date: new Date()
        }
      });
    }
    count++;
  }
  console.log(`Ripristinati ${count} vini dal file originale.`);

  // Now apply photos
  console.log("3. Riapplicazione foto e dati dai PDF (wines_data_v5.json)...");
  if (fs.existsSync('wines_data_v5.json')) {
    const pdfData = JSON.parse(fs.readFileSync('wines_data_v5.json'));
    let photoCount = 0;
    const allWines = await prisma.wine.findMany();
    
    for (const pdfWine of pdfData) {
      if (!pdfWine.photo) continue;
      
      const pName = pdfWine.name.toLowerCase().trim().replace(/['’]/g, "");
      
      const matches = allWines.filter(w => {
        const dbName = w.name.toLowerCase().trim().replace(/['’]/g, "");
        return dbName === pName || dbName.startsWith(pName) || pName.startsWith(dbName);
      });
      
      for (const match of matches) {
        await prisma.wine.update({
          where: { id: match.id },
          data: { photo: pdfWine.photo }
        });
        photoCount++;
      }
    }
    console.log(`Assegnate ${photoCount} foto alle varie annate.`);
  }

}
main().finally(() => prisma.$disconnect());
