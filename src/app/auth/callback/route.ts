import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Wird aufgerufen nach Magic-Link-Klick (Einladung, Passwort-Reset)
// Supabase übergibt ?code=... → wird gegen Session getauscht
// ?next= bestimmt Zielseite (default: /onboarding für Einladungen)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/en/onboarding'
  // Ensure redirect target has a locale prefix
  const next = rawNext.startsWith('/en/') || rawNext.startsWith('/de/')
    ? rawNext
    : `/en${rawNext}`

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
