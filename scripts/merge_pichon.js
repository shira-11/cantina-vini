const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldWine = await prisma.wine.findUnique({ where: { id: 4665 }, include: { movements: true } });
  const newWine = await prisma.wine.findUnique({ where: { id: 6675 }, include: { movements: true } });

  if (!oldWine || !newWine) return console.log("Wines not found");

  const targetQty = {};
  for (const m of newWine.movements) {
    if (!targetQty[m.locationId]) targetQty[m.locationId] = 0;
    targetQty[m.locationId] += m.quantity;
  }

  const currentQty = {};
  for (const m of oldWine.movements) {
    if (!currentQty[m.locationId]) currentQty[m.locationId] = 0;
    currentQty[m.locationId] += m.quantity;
  }

  await prisma.wine.update({
    where: { id: oldWine.id },
    data: {
      photo: newWine.photo,
      photoBack: newWine.photoBack,
      category: oldWine.category || newWine.category,
      region: oldWine.region || newWine.region,
      country: oldWine.country || newWine.country
    }
  });

  for (const locIdStr of Object.keys(targetQty)) {
    const locId = parseInt(locIdStr);
    const target = targetQty[locId] || 0;
    const current = currentQty[locId] || 0;
    const diff = target - current;

    if (diff !== 0) {
      await prisma.movement.create({
        data: {
          movementType: diff > 0 ? 'Ingresso' : 'Uscita',
          quantity: diff,
          date: new Date(),
          wineId: oldWine.id,
          locationId: locId,
          reason: 'Fusione Duplicati - Allineamento a PDF',
          price: 0
        }
      });
    }
  }

  await prisma.wine.delete({ where: { id: newWine.id } });
  console.log("Merge completed");
}

main().finally(() => prisma.$disconnect());
