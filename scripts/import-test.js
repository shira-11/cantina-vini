import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inizio importazione del vino di test...');

  // 1. Inseriamo il vino
  const wine = await prisma.wine.create({
    data: {
      name: 'Clos Haut Peyraguey',
      producerCellar: 'Chateau Clos Haut Peyraguey',
      classification: 'Premier grands crus classès',
      vintage: '2004',
      country: 'Francia',
      grapeVarieties: {
        create: [
          { name: 'Sauvignon Blanc', percentage: 65 },
          { name: 'semillion', percentage: 35 }
        ]
      }
    }
  });

  console.log('Vino creato con ID:', wine.id);

  // 2. Assicuriamoci che la location "Arezzo" esista
  const locationName = 'Cantina Arezzo'; // O solo 'Arezzo', vediamo come si chiama
  let location = await prisma.location.findFirst({
    where: { name: { contains: 'Arezzo' } }
  });

  if (!location) {
    location = await prisma.location.create({
      data: { name: 'Cantina Arezzo' }
    });
  }

  // 3. Inseriamo il movimento di Carico
  const movement = await prisma.movement.create({
    data: {
      wineId: wine.id,
      locationId: location.id,
      movementType: 'Carico Iniziale',
      quantity: 1,
      price: 44.00,
      bottleType: '0.75L',
      date: new Date('2015-09-17T00:00:00Z') // Dalla scheda: Data Inventario 17/09/2015
    }
  });

  console.log('Movimento creato. Quantità:', movement.quantity, 'Prezzo:', movement.price);
  console.log('\\nImportazione completata con successo! Verifica nella pagina principale.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
