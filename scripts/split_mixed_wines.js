const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isDefaultBottle(bottleType) {
  if (!bottleType) return true;
  const lower = bottleType.toLowerCase();
  return lower.includes('0.75') || lower.includes('0,75') || lower.includes('normale') || lower === '' || lower === 'null';
}

async function main() {
  console.log('Fetching all wines with their movements...');
  const wines = await prisma.wine.findMany({
    include: {
      movements: true
    }
  });

  let splitCount = 0;

  for (const wine of wines) {
    if (!wine.movements || wine.movements.length === 0) continue;

    // Group movements by bottle type (normalized to distinguish default vs others)
    const movementsByBottleType = {};
    for (const mov of wine.movements) {
      const bType = mov.bottleType || 'Normale 0.75';
      const key = isDefaultBottle(bType) ? 'DEFAULT' : bType.trim();
      if (!movementsByBottleType[key]) {
        movementsByBottleType[key] = {
          label: bType,
          movements: []
        };
      }
      movementsByBottleType[key].movements.push(mov);
    }

    const types = Object.keys(movementsByBottleType);
    if (types.length > 1) {
      console.log(`\nWine ID ${wine.id} (${wine.name} ${wine.vintage}) has mixed bottle types: ${types.join(', ')}`);
      
      // Determine which one stays in the original record.
      // Preferably the 'DEFAULT' one.
      let primaryType = types.includes('DEFAULT') ? 'DEFAULT' : types[0];
      
      // We will set the bottleType of the original wine to the primary type's label
      const primaryLabel = movementsByBottleType[primaryType].label;
      await prisma.wine.update({
        where: { id: wine.id },
        data: { bottleType: primaryLabel }
      });

      // For all other types, we create a new wine record and move the movements
      for (const type of types) {
        if (type === primaryType) continue;

        const label = movementsByBottleType[type].label;
        console.log(`  -> Splitting into new record for bottle type: ${label}`);
        
        // Clone the wine record
        const newWine = await prisma.wine.create({
          data: {
            name: wine.name,
            vintage: wine.vintage,
            country: wine.country,
            region: wine.region,
            producerCellar: wine.producerCellar,
            producer: wine.producer,
            classification: wine.classification,
            category: wine.category,
            type: wine.type,
            alcoholContent: wine.alcoholContent,
            tempMin: wine.tempMin,
            tempMax: wine.tempMax,
            bottleType: label, // Set the bottle type
            notes: wine.notes,
            photo: wine.photo,
            photoBack: wine.photoBack,
            isArchived: wine.isArchived
          }
        });

        // Reassign movements
        for (const mov of movementsByBottleType[type].movements) {
          await prisma.movement.update({
            where: { id: mov.id },
            data: { wineId: newWine.id }
          });
        }
        
        // Clone grape varieties
        const grapes = await prisma.grapeVariety.findMany({ where: { wineId: wine.id } });
        for (const grape of grapes) {
          await prisma.grapeVariety.create({
            data: {
              name: grape.name,
              percentage: grape.percentage,
              wineId: newWine.id
            }
          });
        }
        splitCount++;
      }
    } else if (types.length === 1) {
      // Just ensure the wine record has the bottle type set to the single type it has
      const label = movementsByBottleType[types[0]].label;
      if (wine.bottleType !== label) {
        await prisma.wine.update({
          where: { id: wine.id },
          data: { bottleType: label }
        });
      }
    }
  }

  console.log(`\nMigration complete. Split ${splitCount} variants into new records.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
