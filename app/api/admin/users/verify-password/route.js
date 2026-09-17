import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-vino-app-very-secure');

export async function POST(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato. Effettua il login.' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password di verifica richiesta' }, { status: 400 });
    }

    let user = null;
    if (payload.userId) {
      user = await prisma.user.findUnique({ where: { id: Number(payload.userId) } });
    }
    if (!user && payload.username) {
      const allUsers = await prisma.user.findMany();
      user = allUsers.find(u => u.username.toLowerCase() === payload.username.toLowerCase());
    }

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso riservato agli amministratori' }, { status: 403 });
    }

    const passTrim = String(password).trim();
    const isValid = await bcrypt.compare(passTrim, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: '🔑 Password errata. Accesso negato alla sezione Admin.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password verificata con successo',
      adminUsername: user.username
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json({ error: 'Errore durante la verifica della password' }, { status: 500 });
  }
}
