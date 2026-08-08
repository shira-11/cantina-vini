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
    
    let autoLogoutEnabled = true;
    let autoLogoutMinutes = 30;

    if (payload.userId) {
      const user = await prisma.user.findUnique({
        where: { id: Number(payload.userId) },
        select: { autoLogoutEnabled: true, autoLogoutMinutes: true }
      });
      if (user) {
        autoLogoutEnabled = user.autoLogoutEnabled;
        autoLogoutMinutes = user.autoLogoutMinutes;
      }
    }

    return NextResponse.json({
      user: {
        username: payload.username,
        role: payload.role,
        autoLogoutEnabled,
        autoLogoutMinutes
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
  }
}
