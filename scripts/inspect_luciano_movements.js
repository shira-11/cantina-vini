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
    console.log(`Wine ID ${w.id} (${w.bottleType}): stock ${stock}`);
    w.movements.forEach(m => console.log(`  - ${m.movementType} ${m.quantity} (${m.bottleType})`));
  });
}
run();
