import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Errore nel caricamento degli utenti" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { username, password, role, isActive } = data;

    if (!username || !password) {
      return NextResponse.json({ error: "Username e password obbligatori" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "L'utente esiste già" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || 'viewer',
        isActive: isActive !== undefined ? isActive : true
      },
      select: { id: true, username: true, role: true, isActive: true }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json({ error: "Errore nella creazione dell'utente" }, { status: 500 });
  }
}
