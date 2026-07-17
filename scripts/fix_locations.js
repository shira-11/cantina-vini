const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("1. Creazione cantine fisiche...");
  const locationNames = ["Cantina Arezzo", "Cantina Milano", "Cantina Saint Moritz", "Cantina Levanzo"];
  const locationIds = {};

  for (const name of locationNames) {
    let loc = await prisma.location.findFirst({ where: { name } });
    if (!loc) loc = await prisma.location.create({ data: { name } });
    locationIds[name] = loc.id;
  }

  const locSconosciuta = await prisma.location.findFirst({ where: { name: 'Sconosciuta' } });

  console.log("2. Lettura vecchio wines.db per distribuire le giacenze...");
  const oldDb = new Database('wines.db', { fileMustExist: true });
  const oldWines = oldDb.prepare('SELECT * FROM wines').all();
  
  const prismaWines = await prisma.wine.findMany({ include: { movements: true } });

  let updatedCount = 0;

  for (const pw of prismaWines) {
    const oldW = oldWines.find(o => o.name === pw.name && o.vintage === pw.vintage);
    if (oldW && oldW.description) {
      let qtyTot = 0;
      let qtyMilano = 0;
      
      const matchTot = oldW.description.match(/Totale Disponibile:\s*(\d+)/);
      if (matchTot) qtyTot = parseInt(matchTot[1]);
      
      const matchMilano = oldW.description.match(/Disp.\s+Milano:\s*(\d+)/);
      if (matchMilano) qtyMilano = parseInt(matchMilano[1]);

      let qtyArezzo = qtyTot - qtyMilano;
      if (qtyArezzo < 0) qtyArezzo = 0;

      if (qtyTot > 0) {
        await prisma.movement.deleteMany({ where: { wineId: pw.id } });

        if (qtyArezzo > 0) {
          await prisma.movement.create({
            data: {
              wineId: pw.id,
              locationId: locationIds["Cantina Arezzo"],
              movementType: 'Ingresso',
              quantity: qtyArezzo,
              date: new Date('2026-06-21T00:00:00Z')
            }
          });
        }
        
        if (qtyMilano > 0) {
          await prisma.movement.create({
            data: {
              wineId: pw.id,
              locationId: locationIds["Cantina Milano"],
              movementType: 'Ingresso',
              quantity: qtyMilano,
              date: new Date('2026-06-21T00:00:00Z')
            }
          });
        }
        updatedCount++;
      }
    }
  }

  if (locSconosciuta) {
    const movs = await prisma.movement.count({ where: { locationId: locSconosciuta.id } });
    if (movs === 0) {
      await prisma.location.delete({ where: { id: locSconosciuta.id } });
      console.log("Cantina 'Sconosciuta' eliminata con successo perché ora vuota.");
    }
  }

  console.log(`Aggiornate giacenze per ${updatedCount} vini distribuendole correttamente tra Arezzo e Milano.`);
}

main().finally(() => prisma.$disconnect());
