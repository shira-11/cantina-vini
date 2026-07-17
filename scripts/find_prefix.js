const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allWines = await prisma.wine.findMany();
  const noPhoto = allWines.filter(w => !w.photo);
  const withPhoto = allWines.filter(w => w.photo);
  const proposals = [];

  for (const newW of withPhoto) {
    let newClean = newW.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    newClean = newClean.replace(/ti/g, 't').replace(/ll/g, 'l');

    let matches = [];

    for (const oldW of noPhoto) {
      let oldClean = oldW.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (oldClean.length < 15) continue;
      oldClean = oldClean.replace(/ti/g, 't').replace(/ll/g, 'l');

      if (oldClean.startsWith(newClean)) {
        const diffLength = oldClean.length - newClean.length;
        if (diffLength > 0 && diffLength <= 14) {
          matches.push(oldW);
        }
      }
    }

    if (matches.length === 1) {
        proposals.push({ old: matches[0], new: newW });
    }
  }

  for (const p of proposals) {
    console.log(`ID ${p.old.id} "${p.old.name}" <==> ID ${p.new.id} "${p.new.name}"`);
  }
}

main().finally(() => prisma.$disconnect());
