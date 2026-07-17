const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration...");
  
  // Create physical locations
  const locationNames = ['Arezzo', 'Milano', 'Saint Moritz', 'Levanzo'];
  const locations = {};
  
  for (const name of locationNames) {
    const loc = await prisma.location.upsert({
      where: { name: 'Cantina ' + name },
      update: {},
      create: { name: 'Cantina ' + name },
    });
    locations[name] = loc;
  }
  
  const workbook = xlsx.readFile('data base reggioni.xls');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  let insertedWines = 0;
  let insertedMovements = 0;

  for (const row of data) {
    const name = row['Nome Vino'];
    if (!name) continue; // Skip empty rows

    // Create the Wine
    const wine = await prisma.wine.create({
      data: {
        name: String(name),
        vintage: row['Annata'] ? String(row['Annata']) : null,
        country: row['Nazione'] || null,
        producerCellar: row['Cantina produttore'] || null,
        producer: row['Cantina produttore'] || null, // Assuming producer is same as producerCellar from excel
        category: row['Categoria'] || null,
        classification: row['Classificazione'] || null,
      }
    });
    insertedWines++;

    // Create initial stock movements based on locations
    const stockMapping = [
      { key: 'Disp. Arezzo', location: locations['Arezzo'] },
      { key: 'Disp. Milano', location: locations['Milano'] },
      { key: 'Disp. S.Moritz', location: locations['Saint Moritz'] },
      { key: 'Disp. Levanzo', location: locations['Levanzo'] },
    ];

    for (const stock of stockMapping) {
      const quantity = parseInt(row[stock.key] || 0, 10);
      if (quantity > 0) {
        await prisma.movement.create({
          data: {
            wineId: wine.id,
            locationId: stock.location.id,
            movementType: 'Ingresso',
            quantity: quantity,
            bottleType: 'Bordolese 0,75 Lt',
            reason: 'Migrazione Iniziale',
            date: new Date(),
          }
        });
        insertedMovements++;
      }
    }
  }

  console.log('✅ Migration complete! Created ' + insertedWines + ' wines and ' + insertedMovements + ' initial stock movements.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
