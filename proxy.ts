import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/dashboard', '/alat', '/peminjaman', '/users', '/laporan']
const authPaths = ['/login', '/register']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isAuth = authPaths.some((p) => pathname.startsWith(p))

  if (!isProtected && !isAuth) return NextResponse.next()

  // Decode the session token (verify validity), not just check cookie
  // presence. A stale or tampered cookie decodes to null and is treated as
  // logged-out, so it can't bounce the user between /login and /dashboard.
  const secureCookie = req.cookies.has('__Secure-authjs.session-token')
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  })
  const isLoggedIn = !!token

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuth && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
