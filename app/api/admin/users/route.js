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
          maxDevices: true,
          allowedLocations: true,
          canAccessInventory: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (e) {
      console.warn("Retrying GET users with raw query fallback:", e);
      try {
        users = await prisma.$queryRawUnsafe('SELECT id, username, role, isActive, autoLogoutEnabled, autoLogoutMinutes, maxDevices, allowedLocations, canAccessInventory, createdAt, updatedAt FROM User ORDER BY createdAt DESC');
      } catch(rawErr) {
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
    }

    // Auto-cleanup stale sessions (over 90 seconds old without heartbeat)
    const cutoffTime = new Date(Date.now() - 90 * 1000);
    await prisma.userSession.updateMany({
      where: {
        logoutTime: null,
        updatedAt: { lt: cutoffTime }
      },
      data: {
        logoutTime: new Date(),
        logoutReason: 'auto_timeout'
      }
    }).catch(() => {});

    // Count active sessions per user
    const activeSessions = await prisma.userSession.findMany({
      where: { logoutTime: null },
      select: { userId: true, username: true }
    }).catch(() => []);

    const formattedUsers = users.map(u => {
      const activeCount = activeSessions.filter(s => (s.userId && s.userId === u.id) || (s.username && s.username.toLowerCase() === u.username.toLowerCase())).length;
      return {
        id: u.id,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        autoLogoutEnabled: u.autoLogoutEnabled ?? true,
        autoLogoutMinutes: u.autoLogoutMinutes ?? 30,
        maxDevices: u.maxDevices ?? 2,
        allowedLocations: u.allowedLocations ?? "ALL",
        canAccessInventory: (u.canAccessInventory === 0 || u.canAccessInventory === false || u.canAccessInventory === '0') ? false : true,
        activeDevicesCount: activeCount,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Errore nel caricamento degli utenti" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { username, password, role, isActive, autoLogoutEnabled, autoLogoutMinutes, maxDevices, allowedLocations, canAccessInventory } = data;

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
      isActive: isActive !== undefined ? isActive : true,
      canAccessInventory: canAccessInventory !== undefined ? Boolean(canAccessInventory) : true,
      maxDevices: maxDevices !== undefined ? Number(maxDevices) : 2,
      allowedLocations: typeof allowedLocations === 'string' ? allowedLocations : (Array.isArray(allowedLocations) ? JSON.stringify(allowedLocations) : "ALL")
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
      delete userData.maxDevices;
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
      autoLogoutMinutes: newUser.autoLogoutMinutes ?? 30,
      maxDevices: newUser.maxDevices ?? 2,
      allowedLocations: newUser.allowedLocations ?? "ALL"
    }, { status: 201 });
  } catch (error) {
    console.error("POST user error:", error);
    return NextResponse.json({ error: "Errore nella creazione dell'utente: " + (error.message || "") }, { status: 500 });
  }
}
