const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const locs = await prisma.location.findMany();
  console.log(locs);
}
run();
