const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function test() {
  const grapeVarieties = await prisma.grapeVariety.findMany({ distinct: ['name'], select: { name: true }, where: { name: { not: null, not: '' } } });
  console.log(grapeVarieties.map(g => g.name).sort());
}
test();
