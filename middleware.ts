import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { routing } from '@/i18n/routing'
import { proxy } from '@/proxy'

const handleI18n = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = request.headers.get('x-request-id') || uuidv4()

  // API routes: rate limiting via proxy (Upstash sliding window, fails open in dev/no-config)
  if (pathname.startsWith('/api/')) {
    const response = await proxy(request)
    response.headers.set('x-request-id', requestId)
    return response
  }

  // App routes: i18n routing + tracing headers
  const response = handleI18n(request)
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-pathname', pathname)
  const locale = pathname.split('/')[1]
  if (routing.locales.includes(locale as 'en' | 'de')) {
    response.headers.set('x-locale', locale)
  }
  return response
}

export const config = {
  // Include /api/* so rate limiting runs; exclude auth callback, share links, static files
  matcher: ['/((?!auth|s/|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
