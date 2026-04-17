import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { supabaseAdmin } from '@/lib/supabase-admin'

const schema = z.object({
  email:    z.string().email(),
  platform: z.string().max(80).optional(),
  message:  z.string().max(1000).optional(),
  source:   z.string().max(80).optional(),
})

// 5 submissions per IP per hour — fail-open if Upstash not configured
const limiter = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Ratelimit({
      redis: new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'rl:beta-waitlist',
    })
  : null

export async function POST(req: NextRequest) {
  // Rate limit by IP
  if (limiter) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
              ?? req.headers.get('x-real-ip')
              ?? '127.0.0.1'
    const { success } = await limiter.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte eine Stunde.' }, { status: 429 })
    }
  }

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
