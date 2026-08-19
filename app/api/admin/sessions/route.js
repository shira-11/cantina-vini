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
    await prisma.userSession.deleteMany({
      where: {
        logoutTime: { not: null }
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sessions:', error);
    return NextResponse.json({ error: 'Errore durante la cancellazione delle sessioni' }, { status: 500 });
  }
}
