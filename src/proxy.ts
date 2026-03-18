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

// ─── Proxy (Auth-Guard + Onboarding-Guard + Rate Limiting) ────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rate Limiting ────────────────────────────────────────────────────────────
  if (limiters) {
    const ip = getIP(request)

    if (
      request.method === 'POST' &&
      (
        pathname === '/login' ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password' ||
        pathname.startsWith('/auth/')
      )
    ) {
      const { success, limit, reset } = await limiters.auth.limit(ip)
      if (!success) return tooManyRequests(limit, reset)
    } else if (pathname.startsWith('/api/public/')) {
      const { success, limit, reset } = await limiters.publicApi.limit(ip)
      if (!success) return tooManyRequests(limit, reset)
    } else if (pathname === '/api/chat/stream') {
      const { success, limit, reset } = await limiters.chat.limit(ip)
      if (!success) return tooManyRequests(limit, reset)
    } else if (pathname.startsWith('/api/')) {
      const { success, limit, reset } = await limiters.api.limit(ip)
      if (!success) return tooManyRequests(limit, reset)
    }
  }

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
  if (pathname.startsWith('/auth/')) {
    return response
  }

  // Startseite ist öffentlich
  if (pathname === '/') {
    return response
  }

  // /login + /forgot-password: eingeloggte User → /chat
  if (pathname.startsWith('/login') || pathname.startsWith('/forgot-password')) {
    if (user) return NextResponse.redirect(new URL('/chat', request.url))
    return response
  }

  // /reset-password: immer erlaubt (nach Password-Reset-Link)
  if (pathname.startsWith('/reset-password')) {
    return response
  }

  // /superadmin/*: Layout-Guard übernimmt die Auth-Prüfung (Server Component)
  if (pathname.startsWith('/superadmin')) {
    return response
  }

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
    const target = isOnboarding
      ? NextResponse.redirect(new URL('/superadmin/clients', request.url))
      : response
    target.cookies.set('is_superadmin', '1', { maxAge: 365 * 24 * 60 * 60, path: '/' })
    return target
  }
  response.cookies.set('is_superadmin', '', { maxAge: 0, path: '/' })

  // Performance: Cookie-Cache prüfen
  const onboardingCookie = request.cookies.get('onboarding_done')?.value

  if (onboardingCookie === '1') {
    if (isOnboarding) {
      return NextResponse.redirect(new URL('/chat', request.url))
    }
    return response
  }

  // Cookie fehlt → DB prüfen
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  const completed = prefs?.onboarding_completed === true

  if (completed) {
    const target = isOnboarding
      ? NextResponse.redirect(new URL('/chat', request.url))
      : response
    target.cookies.set('onboarding_done', '1', {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      httpOnly: false,
    })
    return target
  }

  if (!isOnboarding) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Alle Routen außer statische Dateien und Next.js-Internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
