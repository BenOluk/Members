import { NextResponse, type NextRequest } from 'next/server';

// Primeira barreira: sem cookie de sessão não há navegação.
// A validação real do token acontece em requireUser() (application/session).
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has('sanctum_session');
  const { pathname } = req.nextUrl;

  if (!hasSession && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Tudo, exceto assets do Next e arquivos estáticos (com extensão).
  matcher: ['/((?!_next|favicon\\.ico|.*\\..*).*)'],
};
