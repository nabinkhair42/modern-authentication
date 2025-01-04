import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await getSession()
  const pathname = request.nextUrl.pathname

  // Protected routes (require authentication)
  const protectedRoutes = ['/profile', '/settings']
  
  // Guest-only routes
  const guestRoutes = ['/signin', '/signup', '/forgot-password']

  // Check protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!session) {
      const url = new URL('/signin', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Check guest routes
  if (guestRoutes.some(route => pathname.startsWith(route))) {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/settings/:path*',
    '/signin',
    '/signup',
    '/forgot-password',
  ],
}
