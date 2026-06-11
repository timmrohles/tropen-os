import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:cockpit:recent-activity')

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const [convsRes, artifactsRes] = await Promise.all([
      supabaseAdmin
        .from('conversations')
        .select('id, title, updated_at')
        .eq('created_by', auth.id)
        .order('updated_at', { ascending: false })
        .limit(4),

      supabaseAdmin
        .from('artifacts')
        .select('id, title, updated_at')
        .eq('created_by', auth.id)
        .order('updated_at', { ascending: false })
        .limit(2),
    ])

    const convItems = (convsRes.data ?? []).map(c => ({
      id: c.id,
      type: 'conversation' as const,
      title: c.title ?? null,
      updated_at: c.updated_at,
    }))

    const artifactItems = (artifactsRes.data ?? []).map(a => ({
      id: a.id,
      type: 'artifact' as const,
      title: a.title ?? null,
      updated_at: a.updated_at,
    }))

    const items = [...convItems, ...artifactItems]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6)

    return NextResponse.json({ items })
  } catch (err) {
    log.error('recent-activity error', { error: String(err) })
    return NextResponse.json({ items: [] })
  }
})
