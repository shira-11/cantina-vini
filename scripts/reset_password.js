const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.error('Uso corretto: node reset_password.js <nome_utente> <nuova_password>');
    console.error('Esempio: node reset_password.js admin "nuovaPassword123"');
    process.exit(1);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!existingUser) {
      console.error(`❌ Errore: L'utente '${username}' non esiste nel database!`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { username },
      data: { passwordHash }
    });

    console.log(`✅ Password ripristinata con successo per l'utente '${username}'.`);
    console.log(`Ora puoi fare il login usando la nuova password.`);
  } catch (err) {
    console.error('❌ Errore durante il ripristino della password:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
