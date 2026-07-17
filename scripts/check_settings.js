const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const s = await prisma.systemSettings.findUnique({ where: { key: 'visitor_allowed_filters' } });
  console.log("visitor_allowed_filters:", s ? s.value : 'Not set');
}
run();
