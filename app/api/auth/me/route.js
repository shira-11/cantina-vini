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

    const dbUser = await prisma.user.findFirst({
      where: payload.userId ? { id: Number(payload.userId) } : { username: payload.username },
      select: { username: true, role: true, autoLogoutEnabled: true, autoLogoutMinutes: true, isActive: true }
    });

    if (dbUser && dbUser.isActive) {
      username = dbUser.username;
      role = dbUser.role;
      autoLogoutEnabled = dbUser.autoLogoutEnabled;
      autoLogoutMinutes = dbUser.autoLogoutMinutes;
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
    return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
  }
}
