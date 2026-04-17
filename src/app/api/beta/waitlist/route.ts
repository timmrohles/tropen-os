import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'

const schema = z.object({
  email:    z.string().email(),
  platform: z.string().max(80).optional(),
  message:  z.string().max(1000).optional(),
  source:   z.string().max(80).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 422 })
  }

  const { email, platform, message, source } = parsed.data

  const { error } = await supabaseAdmin.from('beta_waitlist').insert({
    email,
    platform: platform ?? null,
    message:  message  ?? null,
    source:   source   ?? 'beta-landing',
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadyRegistered: true })
    }
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
