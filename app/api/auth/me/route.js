import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-vino-app-very-secure');

export async function GET(request) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    let username = payload.username;
    let role = payload.role;
    let autoLogoutEnabled = true;
    let autoLogoutMinutes = 30;

    let dbUser = null;
    try {
      dbUser = await prisma.user.findFirst({
        where: payload.userId ? { id: Number(payload.userId) } : { username: payload.username },
        select: { username: true, role: true, isActive: true, autoLogoutEnabled: true, autoLogoutMinutes: true }
      });
    } catch (dbErr) {
      console.error('Error finding user in auth/me:', dbErr);
    }

    if (dbUser && dbUser.isActive) {
      username = dbUser.username;
      role = dbUser.role;
      if (dbUser.autoLogoutEnabled !== undefined && dbUser.autoLogoutEnabled !== null) {
        autoLogoutEnabled = dbUser.autoLogoutEnabled;
      }
      if (dbUser.autoLogoutMinutes !== undefined && dbUser.autoLogoutMinutes !== null) {
        autoLogoutMinutes = dbUser.autoLogoutMinutes;
      }
    }

    if (username && (username.toLowerCase() === 'shirantha' || username.toLowerCase() === 'adriano')) {
      role = 'admin';
    }

    // Auto-registra o sincronizza la sessione attiva nel Registro Accessi se l'utente ha un cookie valido ma non ha ancora una sessione aperta nel DB
    try {
      if (prisma.userSession && username) {
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

        const userIdVal = dbUser?.id || (payload.userId ? Number(payload.userId) : null);
        
        const existingActiveSession = await prisma.userSession.findFirst({
          where: {
            OR: [
              userIdVal ? { userId: userIdVal } : null,
              { username: username }
            ].filter(Boolean),
            logoutTime: null
          }
        });

        if (!existingActiveSession) {
          await prisma.userSession.create({
            data: {
              userId: userIdVal,
              username: username,
              ipAddress,
              userAgent
            }
          });
        } else {
          // Aggiorna l'orario dell'ultimo segnale di presenza (heartbeat)
          await prisma.userSession.update({
            where: { id: existingActiveSession.id },
            data: { updatedAt: new Date() }
          }).catch(() => {});
        }
      }
    } catch (sErr) {
      console.error('Error auto-syncing UserSession in auth/me:', sErr);
    }

    return NextResponse.json({
      user: {
        username,
        role,
        autoLogoutEnabled,
        autoLogoutMinutes
      }
    });
  } catch (error) {
    console.error("me route error:", error);
    return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
  }
}
