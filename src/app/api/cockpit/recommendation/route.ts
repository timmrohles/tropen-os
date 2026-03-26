import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:cockpit:recommendation')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ recommendation: null }, { status: 401 })

  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const orgId = profile?.organization_id
    if (!orgId) return NextResponse.json({ recommendation: null })

    // Rule 1: Unread feed items today?
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: feedCount } = await supabaseAdmin
      .from('feed_items')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .is('dismissed_at', null)
      .gte('created_at', today.toISOString())

    if (feedCount && feedCount > 0) {
      return NextResponse.json({
        recommendation: {
          text: `${feedCount} neue Artikel warten auf dich.`,
          actionLabel: 'Feeds öffnen',
          actionHref: '/feeds',
        },
      })
    }

    // Rule 2: Last conversation > 3 days ago?
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const { data: lastConv } = await supabaseAdmin
      .from('conversations')
      .select('updated_at')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastConv || new Date(lastConv.updated_at) < threeDaysAgo) {
      return NextResponse.json({
        recommendation: {
          text: 'Schon eine Weile kein Chat mehr — womit kann ich helfen?',
          actionLabel: 'Chat starten',
          actionHref: '/chat',
        },
      })
    }

    // Rule 3: Budget > 80%?
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('budget_limit')
      .eq('id', orgId)
      .maybeSingle()

    if (org?.budget_limit) {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const { data: usage } = await supabaseAdmin
        .from('usage_logs')
        .select('cost_eur')
        .eq('organization_id', orgId)
        .gte('created_at', monthStart.toISOString())
      const usedEur = (usage ?? []).reduce((sum, r) => sum + (Number(r.cost_eur) || 0), 0)
      const pct = Math.round((usedEur / Number(org.budget_limit)) * 100)
      if (pct >= 80) {
        return NextResponse.json({
          recommendation: {
            text: `Das Monatsbudget ist zu ${pct}% ausgeschöpft.`,
            actionLabel: 'Budget ansehen',
            actionHref: '/settings#kosten',
          },
        })
      }
    }

    return NextResponse.json({ recommendation: null })
  } catch (err) {
    log.error('recommendation error', { error: String(err) })
    return NextResponse.json({ recommendation: null })
  }
}
