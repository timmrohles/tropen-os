/* eslint-disable unicorn/filename-case */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('lib:home:fetchOrgStats')

export interface OrgStats {
  activeUsers: number
  chatCount: number
  artifactCount: number
  budgetUsedPercent: number | null
  budgetWarning: boolean
  totalChats: number
  totalProjects: number
  totalFeeds: number
  totalArtifacts: number
  hasContext: boolean
}

export async function fetchOrgStats(orgId: string, kiContext: string | null): Promise<OrgStats | null> {
  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: workspaces } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('organization_id', orgId)
      .is('archived_at', null)

    const wsIds = (workspaces ?? []).map((w: { id: string }) => w.id)

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
      wsIds.length > 0
        ? supabaseAdmin
            .from('conversations')
            .select('user_id')
            .in('workspace_id', wsIds)
            .gte('created_at', weekAgo.toISOString())
        : Promise.resolve({ data: [] as { user_id: string }[], error: null }),

      supabaseAdmin
        .from('artifacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', weekAgo.toISOString()),

      wsIds.length > 0
        ? supabaseAdmin
            .from('usage_logs')
            .select('cost_eur')
            .in('workspace_id', wsIds)
            .gte('created_at', monthStart.toISOString())
        : Promise.resolve({ data: [] as { cost_eur: number | null }[], error: null }),

      supabaseAdmin
        .from('organizations')
        .select('budget_limit')
        .eq('id', orgId)
        .maybeSingle(),

      wsIds.length > 0
        ? supabaseAdmin
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .in('workspace_id', wsIds)
        : Promise.resolve({ count: 0 as number | null, data: null, error: null }),

      supabaseAdmin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null),

      supabaseAdmin
        .from('feed_sources')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      supabaseAdmin
        .from('artifacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ])

    const chatsWeek = (chatsWeekRes.data ?? []) as { user_id: string }[]
    const activeUsers = new Set(chatsWeek.map(r => r.user_id)).size
    const chatCount = chatsWeek.length
    const artifactCount = artifactsWeekRes.count ?? 0

    const totalUsed = ((budgetMonthRes.data ?? []) as { cost_eur: number | null }[])
      .reduce((s, r) => s + (r.cost_eur ?? 0), 0)
    const budgetLimit = (orgRes.data as { budget_limit: number | null } | null)?.budget_limit
    const budgetUsedPercent = budgetLimit ? Math.round((totalUsed / Number(budgetLimit)) * 100) : null

    return {
      activeUsers,
      chatCount,
      artifactCount,
      budgetUsedPercent,
      budgetWarning: budgetUsedPercent !== null && budgetUsedPercent > 80,
      totalChats: totalChatsRes.count ?? 0,
      totalProjects: totalProjectsRes.count ?? 0,
      totalFeeds: totalFeedsRes.count ?? 0,
      totalArtifacts: totalArtifactsRes.count ?? 0,
      hasContext: !!(kiContext?.trim()),
    }
  } catch (err) {
    log.error('fetchOrgStats failed', { error: String(err) })
    return null
  }
}
