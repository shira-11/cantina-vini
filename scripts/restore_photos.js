const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  if (!fs.existsSync('wines_data_v5.json')) return;
  const pdfData = JSON.parse(fs.readFileSync('wines_data_v5.json'));
  let matched = 0;

  for (const card of pdfData) {
    if (!card.photoPath) continue; // No photo to apply
    const name = card.name;
    
    for (const v of card.vintages) {
      const year = String(v.year);
      
      // Find exact wine + vintage
      const w = await prisma.wine.findFirst({
        where: { name: name, vintage: year }
      });
      
      if (w && !w.photo) {
        await prisma.wine.update({
          where: { id: w.id },
          data: { photo: '/uploads/wines/' + card.photoPath.split('/').pop() }
        });
        matched++;
      }
    }
  }
  console.log(`Ripristinate ${matched} foto sui vini esistenti.`);
}
main().finally(() => prisma.$disconnect());
