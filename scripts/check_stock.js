const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const wines = await prisma.wine.findMany({
    where: { producer: { contains: 'luciano' } },
    include: { movements: true }
  });
  wines.forEach(w => {
    let stock = 0;
    w.movements.forEach(m => {
      if (m.movementType === 'Ingresso') stock += m.quantity;
      if (m.movementType === 'Uscita') stock -= m.quantity;
    });
    console.log(`${w.name} - ${w.producer}: stock ${stock}`);
  });
}
run();
