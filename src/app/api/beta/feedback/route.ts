import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'

const schema = z.object({
  audit_run_id: z.string().uuid().optional(),
  ratings:      z.record(z.string(), z.boolean()).optional(),
  message:      z.string().max(2000).optional(),
  platform:     z.string().max(80).optional(),
})

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 422 })
  }

  const { audit_run_id, ratings, message, platform } = parsed.data

  const { error } = await supabaseAdmin.from('beta_feedback').insert({
    user_id:      auth.id,
    audit_run_id: audit_run_id ?? null,
    ratings:      ratings      ?? {},
    message:      message      ?? null,
    platform:     platform     ?? null,
  })

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
