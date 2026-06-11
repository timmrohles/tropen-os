import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:cockpit:feed-highlights')

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const orgId = auth.organization_id
    if (!orgId) return NextResponse.json({ items: [] })

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: items } = await supabaseAdmin
      .from('feed_items')
      .select('id, title, url, score, published_at, feed_sources(name)')
      .eq('organization_id', orgId)
      .is('dismissed_at', null)
      .gte('created_at', yesterday.toISOString())
      .order('score', { ascending: false })
      .limit(5)

    const mapped = (items ?? []).map((item: Record<string, unknown>) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      score: item.score,
      published_at: item.published_at,
      source_name: (item.feed_sources as { name?: string } | null)?.name ?? 'Feed',
    }))

    return NextResponse.json({ items: mapped })
  } catch (err) {
    log.error('feed-highlights error', { error: String(err) })
    return NextResponse.json({ items: [] })
  }
})
