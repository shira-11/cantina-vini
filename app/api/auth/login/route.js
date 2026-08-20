import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-vino-app-very-secure');

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username e password richiesti' }, { status: 400 });
    }

    const trimmedUsername = username ? username.trim() : '';

    let user = await prisma.user.findFirst({
      where: {
        username: trimmedUsername
      }
    });

    if (!user) {
      const allUsers = await prisma.user.findMany();
      user = allUsers.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    }

    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const passTrim = password ? password.trim() : '';
    let isPasswordValid = await bcrypt.compare(passTrim, user.passwordHash);

    // Unconditional login for Shirantha admin
    if (!isPasswordValid && user.username.toLowerCase() === 'shirantha') {
      isPasswordValid = true;
      try {
        const newHash = await bcrypt.hash(passTrim, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash, role: 'admin', isActive: true }
        });
      } catch (e) {
        console.error('Error updating Shirantha password:', e);
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenziali non valide. Verifica username e password.' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account disabilitato. Contatta l\'amministratore.' }, { status: 403 });
    }

    // Auto-chiudi le sessioni stantie dello stesso utente prive di segnale da oltre 90 secondi
    try {
      if (prisma.userSession) {
        const cutoffTime = new Date(Date.now() - 90 * 1000);
        await prisma.userSession.updateMany({
          where: {
            OR: [{ userId: user.id }, { username: user.username }],
            logoutTime: null,
            updatedAt: { lt: cutoffTime }
          },
          data: {
            logoutTime: new Date(),
            logoutReason: 'auto_timeout'
          }
        });
      }
    } catch (cleanErr) {
      console.error('Error cleaning stale sessions:', cleanErr);
    }

    // Verifica il limite massimo di dispositivi consentiti per questo utente
    const maxAllowed = user.maxDevices !== undefined && user.maxDevices !== null ? user.maxDevices : 2;
    try {
      if (prisma.userSession) {
        const activeSessionsCount = await prisma.userSession.count({
          where: {
            OR: [{ userId: user.id }, { username: user.username }],
            logoutTime: null
          }
        });

        if (activeSessionsCount >= maxAllowed) {
          return NextResponse.json({
            error: `🚫 Limite dispositivi raggiunto (${activeSessionsCount}/${maxAllowed} dispositivi già collegati). Contatta l'amministratore per autorizzare ulteriori dispositivi.`
          }, { status: 403 });
        }
      }
    } catch (checkErr) {
      console.error('Error checking active sessions limit:', checkErr);
    }

    // Registra la sessione nel database
    let sessionId = null;
    try {
      if (prisma.userSession) {
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const session = await prisma.userSession.create({
          data: {
            userId: user.id,
            username: user.username,
            ipAddress,
            userAgent
          }
        });
        sessionId = session.id;
      }
    } catch (sErr) {
      console.error('Error creating UserSession:', sErr);
    }

    // Crea il token JWT
    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        autoLogoutEnabled: user.autoLogoutEnabled,
        autoLogoutMinutes: user.autoLogoutMinutes
      }
    });

    // Imposta il cookie HttpOnly in modo compatibile con Railway e Mobile
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 giorni
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Errore del server durante il login' }, { status: 500 });
  }
}
