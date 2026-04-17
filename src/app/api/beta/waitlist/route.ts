// POST /api/beta/waitlist — public, no auth required
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const schema = z.object({
  email:    z.string().email(),
  platform: z.enum(['lovable', 'bolt', 'cursor', 'other']).optional(),
  message:  z.string().max(1000).optional(),
  source:   z.string().max(50).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 })
  }

  const { email, platform, message, source } = parsed.data

  const { error } = await supabaseAdmin.from('beta_waitlist').insert({
    email,
    platform:  platform ?? null,
    message:   message ?? null,
    source:    source ?? 'beta-landing',
  })

  if (error) {
    if (error.code === '23505') {
      // Unique violation — email already on waitlist, treat as success
      return NextResponse.json({ ok: true, alreadyRegistered: true })
    }
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
