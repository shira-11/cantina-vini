import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-vino-app-very-secure');

async function checkAdmin(request) {
  const roleHeader = request.headers.get('x-user-role');
  if (roleHeader) return roleHeader === 'admin';

  const token = request.cookies.get('auth_token')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Accesso negato: richiesto ruolo Admin' }, { status: 403 });
  }

  try {
    // Auto-chiudi le sessioni senza segnale di presenza (heartbeat) da più di 90 secondi (1.5 minuti)
    const cutoffTime = new Date(Date.now() - 90 * 1000);
    const staleSessions = await prisma.userSession.findMany({
      where: {
        logoutTime: null,
        updatedAt: { lt: cutoffTime }
      }
    }).catch(() => []);

    for (const stale of staleSessions) {
      const logoutDate = stale.updatedAt || new Date();
      await prisma.userSession.update({
        where: { id: stale.id },
        data: {
          logoutTime: logoutDate,
          logoutReason: 'auto_timeout'
        }
      }).catch(() => {});
    }

    // Pulizia automatica in background: elimina definitivamente le sessioni più vecchie di 6 mesi (180 giorni)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    await prisma.userSession.deleteMany({
      where: {
        loginTime: { lt: sixMonthsAgo }
      }
    }).catch(() => {});

    const sessions = await prisma.userSession.findMany({
      orderBy: { id: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            username: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Errore nel recupero delle sessioni' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Accesso negato: richiesto ruolo Admin' }, { status: 403 });
  }

  try {
    // Svuotamento manuale: elimina definitivamente lo storico delle sessioni già concluse
    await prisma.userSession.deleteMany({
      where: {
        logoutTime: { not: null }
      }
    });
    return NextResponse.json({ success: true, message: 'Storico delle sessioni concluse eliminato definitivamente.' });
  } catch (error) {
    console.error('Error deleting sessions:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione dello storico sessioni' }, { status: 500 });
  }
}
