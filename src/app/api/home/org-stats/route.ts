import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:home:org-stats')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, organization_id, ki_context')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !['admin', 'owner', 'superadmin'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = profile.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Get org workspace IDs
    const { data: workspaces } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('organization_id', orgId)
      .is('archived_at', null)

    const wsIds = (workspaces ?? []).map((w: { id: string }) => w.id)

    // Parallel: weekly stats + onboarding totals + budget
    const [
      chatsWeekRes,
      artifactsWeekRes,
      budgetMonthRes,
      orgRes,
      totalChatsRes,
      totalProjectsRes,
      totalFeedsRes,
      totalArtifactsRes,
    ] = await Promise.all([
      // Active users + chat count this week
      wsIds.length > 0
        ? supabaseAdmin
            .from('conversations')
            .select('user_id')
            .in('workspace_id', wsIds)
            .gte('created_at', weekAgo.toISOString())
        : Promise.resolve({ data: [] }),

      // Artifacts this week
      supabaseAdmin
        .from('artifacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', weekAgo.toISOString()),

      // Budget used this month
      wsIds.length > 0
        ? supabaseAdmin
            .from('usage_logs')
            .select('cost_eur')
            .in('workspace_id', wsIds)
            .gte('created_at', monthStart.toISOString())
        : Promise.resolve({ data: [] }),

      // Org budget limit
      supabaseAdmin
        .from('organizations')
        .select('budget_limit')
        .eq('id', orgId)
        .maybeSingle(),

      // Onboarding: total chats (all time)
      wsIds.length > 0
        ? supabaseAdmin
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .in('workspace_id', wsIds)
        : Promise.resolve({ count: 0 }),

      // Onboarding: total projects
      supabaseAdmin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null),

      // Onboarding: total feeds
      supabaseAdmin
        .from('feed_sources')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      // Onboarding: total artifacts
      supabaseAdmin
        .from('artifacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ])

    const chatsWeek = (chatsWeekRes.data ?? []) as { user_id: string }[]
    const activeUsers = new Set(chatsWeek.map(r => r.user_id)).size
    const chatCount = chatsWeek.length

    const artifactCount = artifactsWeekRes.count ?? 0

    const totalUsed = ((budgetMonthRes as { data: { cost_eur: number | null }[] | null }).data ?? [])
      .reduce((s, r) => s + (r.cost_eur ?? 0), 0)
    const budgetLimit = (orgRes.data as { budget_limit: number | null } | null)?.budget_limit
    const budgetUsedPercent = budgetLimit ? Math.round((totalUsed / Number(budgetLimit)) * 100) : null
    const budgetWarning = budgetUsedPercent !== null && budgetUsedPercent > 80

    return NextResponse.json({
      // Weekly stats
      activeUsers,
      chatCount,
      artifactCount,
      budgetUsedPercent,
      budgetWarning,
      // Onboarding totals
      totalChats: totalChatsRes.count ?? 0,
      totalProjects: totalProjectsRes.count ?? 0,
      totalFeeds: totalFeedsRes.count ?? 0,
      totalArtifacts: totalArtifactsRes.count ?? 0,
      hasContext: !!(profile.ki_context?.trim()),
    })
  } catch (err) {
    log.error('org-stats error', { error: String(err) })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
