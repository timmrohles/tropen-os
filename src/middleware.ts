import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // /auth/* ist immer öffentlich (Magic-Link-Callback)
  if (pathname.startsWith('/auth/')) {
    return response
  }

  // Startseite ist öffentlich
  if (pathname === '/') {
    return response
  }

  // /login + /forgot-password: eingeloggte User → /workspaces
  if (pathname.startsWith('/login') || pathname.startsWith('/forgot-password')) {
    if (user) return NextResponse.redirect(new URL('/workspaces', request.url))
    return response
  }

  // /reset-password: immer erlaubt für eingeloggte User (nach Password-Reset-Link)
  // Onboarding-Guard überspringen – User braucht Zugang auch ohne onboarding_completed
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

  // ── Onboarding-Guard ──────────────────────────────────────────────────────
  // Prüft user_preferences.onboarding_completed (mit Cookie-Cache für Performance)

  const isOnboarding = pathname === '/onboarding'

  // Superadmin überspringt Onboarding komplett – Cookie wird immer gegen DB verifiziert
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
  // Kein Superadmin → Cookie entfernen falls noch vorhanden
  response.cookies.set('is_superadmin', '', { maxAge: 0, path: '/' })

  // Performance: Cookie-Cache prüfen (wird beim Abschluss von /onboarding gesetzt)
  const onboardingCookie = request.cookies.get('onboarding_done')?.value

  if (onboardingCookie === '1') {
    // Onboarding abgeschlossen – /onboarding nicht mehr zugänglich
    if (isOnboarding) {
      return NextResponse.redirect(new URL('/workspaces', request.url))
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
    // Onboarding abgeschlossen → Cookie setzen, bei /onboarding weiterleiten
    const target = isOnboarding
      ? NextResponse.redirect(new URL('/workspaces', request.url))
      : response
    target.cookies.set('onboarding_done', '1', {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      httpOnly: false, // muss per JS beim Logout löschbar sein
    })
    return target
  }

  // Onboarding nicht abgeschlossen → zu /onboarding (außer wenn bereits dort)
  if (!isOnboarding) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)']
}
