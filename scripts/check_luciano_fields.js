const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const wines = await prisma.wine.findMany({
    where: { producer: { contains: 'luciano' } }
  });
  console.log(wines);
}
run();
