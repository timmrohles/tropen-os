import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
//
//  auth          →  10 req / 15 min per IP   (brute-force protection)
//  public API    →  20 req / 1 h   per IP    (unauthentifiziert)
//  chat stream   →  30 req / 1 min per IP    (teures Streaming-Endpoint)
//  all API       → 200 req / 1 min per IP    (authenticated routes)
//
// Wird nur aktiv wenn UPSTASH_REDIS_REST_URL gesetzt ist (in dev ohne Upstash übersprungen).

function buildLimiters() {
  if (process.env.NODE_ENV === 'development') return null
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const redis = new Redis({ url, token })
  return {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: 'rl:auth',
      analytics: true,
    }),
    publicApi: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      prefix: 'rl:public',
      analytics: true,
    }),
    chat: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'rl:chat',
      analytics: true,
    }),
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 m'),
      prefix: 'rl:api',
      analytics: true,
    }),
  }
}

const limiters = buildLimiters()

function getIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0].trim() ?? realIP ?? '127.0.0.1'
}

function tooManyRequests(limit: number, reset: number): NextResponse {
  return NextResponse.json(
    { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Reset': String(reset),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    }
  )
}

// ─── Rate-limit helpers ────────────────────────────────────────────────────────

function isAuthRoute(method: string, pathname: string): boolean {
  return (
    method === 'POST' &&
    (
      pathname === '/login' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname.startsWith('/auth/')
    )
  )
}

function pickLimiter(method: string, pathname: string, lims: NonNullable<typeof limiters>) {
  if (isAuthRoute(method, pathname)) return lims.auth
  if (pathname.startsWith('/api/public/')) return lims.publicApi
  if (pathname === '/api/chat/stream') return lims.chat
  if (pathname.startsWith('/api/')) return lims.api
  return null
}

async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  if (!limiters) return null
  const limiter = pickLimiter(request.method, request.nextUrl.pathname, limiters)
  if (!limiter) return null
  const { success, limit, reset } = await limiter.limit(getIP(request))
  return success ? null : tooManyRequests(limit, reset)
}

// ─── Onboarding helpers ────────────────────────────────────────────────────────

function redirectWithCookie(
  dest: string,
  requestUrl: string,
  cookieName: string,
  cookieValue: string,
  cookieOptions: { maxAge: number; path: string; httpOnly?: boolean }
): NextResponse {
  const res = NextResponse.redirect(new URL(dest, requestUrl))
  res.cookies.set(cookieName, cookieValue, cookieOptions)
  return res
}

// ─── Proxy (Auth-Guard + Onboarding-Guard + Rate Limiting) ────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rate Limiting ────────────────────────────────────────────────────────────
  const rateLimitResponse = await checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  // ── API-Routen brauchen keinen Auth-/Onboarding-Guard hier ──────────────────
  if (pathname.startsWith('/api/')) {
    return NextResponse.next({ request })
  }

  // ── Supabase Session + Auth-Guard ────────────────────────────────────────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // /auth/* ist immer öffentlich (Magic-Link-Callback)
  if (pathname.startsWith('/auth/')) return response

  // Startseite ist öffentlich
  if (pathname === '/') return response

  // /login + /forgot-password: eingeloggte User → /home
  if (pathname.startsWith('/login') || pathname.startsWith('/forgot-password')) {
    if (user) return NextResponse.redirect(new URL('/home', request.url))
    return response
  }

  // /reset-password: immer erlaubt (nach Password-Reset-Link)
  if (pathname.startsWith('/reset-password')) return response

  // /superadmin/*: Layout-Guard übernimmt die Auth-Prüfung (Server Component)
  if (pathname.startsWith('/superadmin')) return response

  // Alle anderen Routen brauchen Auth
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Onboarding-Guard ─────────────────────────────────────────────────────────

  const isOnboarding = pathname === '/onboarding'

  // Superadmin überspringt Onboarding komplett
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'superadmin') {
    if (isOnboarding) {
      return redirectWithCookie('/superadmin/clients', request.url, 'is_superadmin', '1', {
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      })
    }
    response.cookies.set('is_superadmin', '1', { maxAge: 365 * 24 * 60 * 60, path: '/' })
    return response
  }
  response.cookies.set('is_superadmin', '', { maxAge: 0, path: '/' })

  // Performance: Cookie-Cache prüfen
  const onboardingCookie = request.cookies.get('onboarding_done')?.value

  if (onboardingCookie === '1') {
    if (isOnboarding) return NextResponse.redirect(new URL('/home', request.url))
    return response
  }

  // Cookie fehlt → DB prüfen
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  const completed = prefs?.onboarding_completed === true

  if (!completed) {
    if (!isOnboarding) return NextResponse.redirect(new URL('/onboarding', request.url))
    return response
  }

  // Onboarding done — set cookie and redirect if on /onboarding
  if (isOnboarding) {
    return redirectWithCookie('/chat', request.url, 'onboarding_done', '1', {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      httpOnly: false,
    })
  }
  response.cookies.set('onboarding_done', '1', {
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
    httpOnly: false,
  })
  return response
}

export const config = {
  matcher: [
    // Alle Routen außer statische Dateien und Next.js-Internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
