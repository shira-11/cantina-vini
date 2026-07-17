import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ATTENZIONE: Questo è il codice segreto per forzare il reset della password da web.
const MASTER_SECRET_CODE = 'VINI2026!';

export async function POST(request) {
  try {
    const { username, newPassword, secretCode } = await request.json();

    if (!username || !newPassword || !secretCode) {
      return NextResponse.json({ error: 'Compila tutti i campi' }, { status: 400 });
    }

    if (secretCode !== MASTER_SECRET_CODE) {
      return NextResponse.json({ error: 'Codice di sicurezza non valido' }, { status: 403 });
    }

    const allUsers = await prisma.user.findMany();
    const existingUser = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!existingUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash }
    });

    return NextResponse.json({ message: 'Password aggiornata con successo!' }, { status: 200 });

  } catch (error) {
    console.error('Errore reset password forzato:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
