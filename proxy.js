import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-vino-app-very-secure');

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Percorsi pubblici che non richiedono autenticazione
  const isPublicPath = 
    pathname === '/login' || 
    pathname === '/recupero-pw' || 
    pathname === '/login-bg.png' || 
    pathname === '/manifest.json' ||
    pathname === '/api/settings' || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/foto_bottiglie') || 
    pathname.startsWith('/uploads') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|json)$/i.test(pathname);
  const isAuthApi = pathname.startsWith('/api/auth');

  if (isPublicPath || isAuthApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Se non c'è il token, reindirizza al login
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verifica il token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Aggiungi username agli header per poterlo leggere nelle API successive
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-username', payload.username);
    requestHeaders.set('x-user-role', payload.role);

    // Protezione rotte admin
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (payload.role !== 'admin') {
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Accesso negato: richiesto ruolo admin' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Token invalido o scaduto
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
