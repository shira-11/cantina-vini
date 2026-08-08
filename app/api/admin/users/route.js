import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    let users;
    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          autoLogoutEnabled: true,
          autoLogoutMinutes: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (e) {
      console.warn("Retrying GET users with core fields:", e);
      users = await prisma.user.findMany({
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
    }

    const formattedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      autoLogoutEnabled: u.autoLogoutEnabled ?? true,
      autoLogoutMinutes: u.autoLogoutMinutes ?? 30,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Errore nel caricamento degli utenti" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { username, password, role, isActive, autoLogoutEnabled, autoLogoutMinutes } = data;

    const trimmedUsername = username ? username.trim() : '';

    if (!trimmedUsername || !password) {
      return NextResponse.json({ error: "Username e password obbligatori" }, { status: 400 });
    }

    const allUsers = await prisma.user.findMany();
    const existingUser = allUsers.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (existingUser) {
      return NextResponse.json({ error: `L'utente "${trimmedUsername}" esiste già.` }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userData = {
      username: trimmedUsername,
      passwordHash,
      role: role || 'viewer',
      isActive: isActive !== undefined ? isActive : true
    };

    if (autoLogoutEnabled !== undefined) userData.autoLogoutEnabled = autoLogoutEnabled;
    if (autoLogoutMinutes !== undefined) userData.autoLogoutMinutes = Number(autoLogoutMinutes);

    let newUser;
    try {
      newUser = await prisma.user.create({
        data: userData
      });
    } catch (createErr) {
      console.warn("Retrying user creation with core fields:", createErr);
      delete userData.autoLogoutEnabled;
      delete userData.autoLogoutMinutes;
      newUser = await prisma.user.create({
        data: userData
      });
    }

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      isActive: newUser.isActive,
      autoLogoutEnabled: newUser.autoLogoutEnabled ?? true,
      autoLogoutMinutes: newUser.autoLogoutMinutes ?? 30
    }, { status: 201 });
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json({ error: "Errore nella creazione dell'utente: " + (error.message || "") }, { status: 500 });
  }
}
