import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-vino-app-very-secure');

async function handleLogout(request) {
  const token = request.cookies.get('auth_token')?.value;
  const searchParams = request.nextUrl.searchParams;
  const reasonParam = searchParams.get('reason') || 'manual';

  if (token && prisma.userSession) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.sessionId) {
        await prisma.userSession.update({
          where: { id: Number(payload.sessionId) },
          data: {
            logoutTime: new Date(),
            logoutReason: reasonParam
          }
        }).catch(() => {});
      } else if (payload.userId) {
        const lastSession = await prisma.userSession.findFirst({
          where: { userId: Number(payload.userId), logoutTime: null },
          orderBy: { id: 'desc' }
        }).catch(() => null);
        if (lastSession) {
          await prisma.userSession.update({
            where: { id: lastSession.id },
            data: { logoutTime: new Date(), logoutReason: reasonParam }
          }).catch(() => {});
        }
      }
    } catch (e) {
      // Token non valido o scaduto
    }
  }

  const isGet = request.method === 'GET';
  const redirectUrl = new URL(reasonParam === 'auto_timeout' ? '/login?reason=timeout' : '/login', request.url);
  const response = isGet ? NextResponse.redirect(redirectUrl) : NextResponse.json({ success: true });

  response.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });

  return response;
}

export async function GET(request) {
  return handleLogout(request);
}

export async function POST(request) {
  return handleLogout(request);
}

