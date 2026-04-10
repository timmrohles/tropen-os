import createMiddleware from 'next-intl/middleware'
import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { routing } from '@/i18n/routing'

const handleI18n = createMiddleware(routing)

export function middleware(request: NextRequest) {
  const response = handleI18n(request)

  // Pass through request ID for tracing
  const requestId = request.headers.get('x-request-id') || uuidv4()
  response.headers.set('x-request-id', requestId)

  // Expose detected locale to root layout for <html lang="...">
  const locale = request.nextUrl.pathname.split('/')[1]
  if (routing.locales.includes(locale as 'en' | 'de')) {
    response.headers.set('x-locale', locale)
  }

  return response
}

export const config = {
  // Match all pathnames except:
  // - api routes
  // - auth callback (must stay at root for Supabase OAuth)
  // - share links /s/[token] (permanent links, no locale prefix)
  // - Next.js internals and static files
  matcher: ['/((?!api|auth|s|_next|_vercel|.*\\..*).*)'],
}
