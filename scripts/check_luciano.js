const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({ where: { username: 'Luciano' } });
  console.log("Luciano user data:", user);
}
run();
