import { NextResponse } from 'next/server';

export async function GET(request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  
  // Rimuovi il cookie impostandolo con maxAge 0
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

