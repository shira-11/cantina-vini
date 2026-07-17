const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const wines = await prisma.wine.findMany({
    where: { producer: { contains: 'luciano' } },
    select: { name: true, producer: true, isArchived: true }
  });
  console.log(wines);
}
run();
