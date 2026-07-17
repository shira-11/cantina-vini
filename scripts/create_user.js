const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const role = process.argv[4] || 'admin';

  if (!username || !password) {
    console.error('Usage: node create_user.js <username> <password> [role]');
    process.exit(1);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      console.error(`Utente '${username}' esiste già!`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role
      }
    });

    console.log(`✅ Utente creato con successo: ${user.username} (ruolo: ${user.role})`);
  } catch (err) {
    console.error('Errore durante la creazione:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
