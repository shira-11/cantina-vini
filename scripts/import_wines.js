import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('wines_data_v5.json', 'utf8'));

  // Discover all location names dynamically from the data
  const locNamesSet = new Set();
  for (const card of data) {
    for (const v of card.vintages) {
      for (const loc of Object.keys(v.locations)) {
        locNamesSet.add(loc);
      }
    }
  }

  const locNames = Array.from(locNamesSet);
  console.log(`Found locations in PDF: ${locNames.join(', ')}`);

  const locs = {};
  for (const name of locNames) {
    let l = await prisma.location.findUnique({ where: { name } });
    if (!l) {
      l = await prisma.location.create({ data: { name } });
    }
    locs[name] = l;
  }

  console.log(`Loaded ${data.length} wine cards from JSON.`);

  for (const card of data) {
    const { name, producer, classification, grapeVarieties, photo, region, category, vintages } = card;

    const grapesCreate = grapeVarieties.map(g => ({
      name: g.name,
      percentage: g.percentage
    }));

    for (const v of vintages) {
      const year = String(v.year);

      let wine = await prisma.wine.findFirst({
        where: { name, vintage: year }
      });

      if (wine) {
        wine = await prisma.wine.update({
          where: { id: wine.id },
          data: {
            producer: producer || wine.producer,
            classification: classification || wine.classification,
            photo: photo || wine.photo,
            region: region || wine.region,
            category: category || wine.category,
            grapeVarieties: {
              deleteMany: {},
              create: grapesCreate
            }
          }
        });
      } else {
        wine = await prisma.wine.create({
          data: {
            name,
            vintage: year,
            producer,
            classification,
            photo: photo,
            region: region,
            category: category,
            grapeVarieties: {
              create: grapesCreate
            }
          }
        });
      }

      for (const locName of Object.keys(v.locations)) {
        const targetQty = v.locations[locName];

        const ingressi = await prisma.movement.aggregate({
          where: { wineId: wine.id, locationId: locs[locName].id, movementType: 'Ingresso' },
          _sum: { quantity: true }
        });
        const uscite = await prisma.movement.aggregate({
          where: { wineId: wine.id, locationId: locs[locName].id, movementType: 'Uscita' },
          _sum: { quantity: true }
        });

        const currentQty = (ingressi._sum.quantity || 0) - (uscite._sum.quantity || 0);

        if (currentQty !== targetQty) {
          const diff = targetQty - currentQty;

          if (diff > 0) {
            await prisma.movement.create({
              data: {
                movementType: 'Ingresso',
                quantity: diff,
                date: new Date(),
                wineId: wine.id,
                locationId: locs[locName].id,
                reason: 'Allineamento da PDF',
                price: v.price
              }
            });
            console.log(`  -> [ALLINEAMENTO] +${diff} in ${locName} for ${name}`);
          } else if (diff < 0) {
            await prisma.movement.create({
              data: {
                movementType: 'Uscita',
                quantity: -diff,
                date: new Date(),
                wineId: wine.id,
                locationId: locs[locName].id,
                reason: 'Allineamento da PDF',
                price: v.price
              }
            });
            console.log(`  -> [ALLINEAMENTO] ${diff} in ${locName} for ${name}`);
          }
        }
      }
    }
  }

  console.log("Import successfully completed!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
