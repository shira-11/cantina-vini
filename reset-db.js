const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Emptying database...");
  await prisma.movement.deleteMany({});
  await prisma.grapeVariety.deleteMany({});
  await prisma.wine.deleteMany({});
  await prisma.location.deleteMany({});
  console.log("Database empty!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
