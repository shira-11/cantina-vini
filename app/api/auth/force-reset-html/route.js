import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MASTER_SECRET_CODE = 'VINI2026!';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const username = formData.get('username');
    const newPassword = formData.get('newPassword');
    const secretCode = formData.get('secretCode');

    if (!username || !newPassword || !secretCode) {
      return new NextResponse('<html><body><h1>Errore: Compila tutti i campi. <a href="/recupero-pw">Riprova</a></h1></body></html>', { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    if (secretCode !== MASTER_SECRET_CODE) {
      return new NextResponse('<html><body><h1>Errore: Codice di sicurezza errato. <a href="/recupero-pw">Riprova</a></h1></body></html>', { status: 403, headers: { 'Content-Type': 'text/html' } });
    }

    const allUsers = await prisma.user.findMany();
    const existingUser = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!existingUser) {
      return new NextResponse('<html><body><h1>Errore: Utente non trovato. <a href="/recupero-pw">Riprova</a></h1></body></html>', { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash }
    });

    return new NextResponse('<html><body><h1 style="color: green;">SUCCESSO: Password modificata!</h1><h2>Ora puoi effettuare il <a href="/login">Login</a> con la nuova password.</h2></body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error('Errore reset password forzato:', error);
    return new NextResponse('<html><body><h1>Errore interno del server.</h1></body></html>', { status: 500, headers: { 'Content-Type': 'text/html' } });
  } finally {
    await prisma.$disconnect();
  }
}
