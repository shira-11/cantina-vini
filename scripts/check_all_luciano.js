const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const wines = await prisma.wine.findMany({
    select: { name: true, producer: true, category: true, isArchived: true }
  });
  const filtered = wines.filter(w => w.producer && w.producer.toLowerCase().includes('luciano'));
  console.log(filtered);
}
run();
