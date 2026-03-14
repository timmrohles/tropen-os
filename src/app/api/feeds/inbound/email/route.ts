// src/app/api/feeds/inbound/email/route.ts
// Receives Resend inbound email webhooks.
// Each email becomes a feed item for the matching email source.

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emailInboundSchema } from '@/lib/validators/feeds'
import { computeContentHash } from '@/lib/feeds/pipeline'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:feeds:inbound:email')

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = emailInboundSchema.safeParse(body)
  if (!parsed.success) {
    log.warn('[email inbound] invalid payload', { error: parsed.error.message })
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const email = parsed.data
  const toAddress = email.to[0]?.email?.toLowerCase()
  if (!toAddress) return NextResponse.json({ ok: true })

  // Find matching email source by inbound_address in config
  const { data: sources } = await supabaseAdmin
    .from('feed_sources')
    .select('id, organization_id, config')
    .eq('type', 'email')
    .eq('is_active', true)

  const matchingSource = (sources ?? []).find((s: Record<string, unknown>) => {
    const cfg = (s as Record<string, unknown>).config as Record<string, unknown>
    return (cfg?.inbound_address as string)?.toLowerCase() === toAddress
  })

  if (!matchingSource) {
    log.info('[email inbound] no source matched', { toAddress })
    return NextResponse.json({ ok: true })
  }

  const src = matchingSource as Record<string, unknown>
  const title = email.subject || '(kein Betreff)'
  const content = email.text || email.html?.replace(/<[^>]+>/g, ' ') || ''
  const contentHash = computeContentHash(`email:${toAddress}`, title + content.slice(0, 100))

  const { error } = await supabaseAdmin.from('feed_items').upsert(
    {
      source_id: src.id,
      organization_id: src.organization_id,
      title,
      content: content.slice(0, 10_000),
      url: null,
      author: email.from.name ?? email.from.email,
      stage: 1,
      content_hash: contentHash,
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    },
    { onConflict: 'content_hash', ignoreDuplicates: true }
  )

  if (error) log.error('[email inbound] insert failed', { error: error.message })
  return NextResponse.json({ ok: true })
}
