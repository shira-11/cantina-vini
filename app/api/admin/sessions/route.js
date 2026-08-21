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

    const sessions = await prisma.userSession.findMany({
      where: {
        isArchived: false
      },
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
    // Non cancelliamo definitivamente dal DB! Archiviamo solo lo storico concluso per pulire la vista
    await prisma.userSession.updateMany({
      where: {
        logoutTime: { not: null }
      },
      data: {
        isArchived: true
      }
    });
    return NextResponse.json({ success: true, message: 'Vista storico concluso ripulita con successo.' });
  } catch (error) {
    console.error('Error archiving sessions:', error);
    return NextResponse.json({ error: 'Errore nel ripulire lo storico delle sessioni' }, { status: 500 });
  }
}
