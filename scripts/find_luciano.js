const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => u.username));
  
  const wines = await prisma.wine.findMany({
    where: {
      OR: [
        { name: { contains: 'luciano' } },
        { producer: { contains: 'luciano' } }
      ]
    }
  });
  console.log("Wines matching luciano:", wines.map(w => w.name + ' - ' + w.producer));
}
run();
