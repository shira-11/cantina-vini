import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-vino-app-very-secure');

export async function GET(request) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({ user: { username: payload.username, role: payload.role } });
  } catch (error) {
    return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
  }
}
