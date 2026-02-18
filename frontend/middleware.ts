import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccess } from '@/lib/permissions';

// 📖 Decodifica el JWT sin librerías externas
// (Edge Runtime no soporta 'jsonwebtoken', solo Web APIs nativas)
function decodeJWT(token: string): { role?: string; sub?: string; email?: string } | null {
  try {
    const payload = token.split('.')[1];
    // El payload está en base64url, atob lo decodifica
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 📖 Leer el token — mismo nombre que usa tu setCookie('token', ...)
  const token = request.cookies.get('token')?.value;

  // ============================
  // RUTAS PÚBLICAS: /login
  // ============================
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    // Si ya tiene token válido → redirigir al dashboard directamente
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ============================
  // RUTAS PROTEGIDAS: /dashboard
  // ============================
  if (pathname.startsWith('/dashboard')) {

    // Sin token → mandar a login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Decodificar token
    const payload = decodeJWT(token);

    // Token inválido o sin rol → mandar a login
    if (!payload || !payload.role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 📖 Verificar permiso según rol
    if (!canAccess(pathname, payload.role)) {
      // Sin permiso → volver al dashboard con parámetro de error
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};