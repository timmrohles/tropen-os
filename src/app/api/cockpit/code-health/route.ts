import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:cockpit:code-health')

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const orgId = auth.organization_id
    if (!orgId) return NextResponse.json({ hasAuditData: false })

    // Latest run
    const { data: latestRun } = await supabaseAdmin
      .from('audit_runs')
      .select('id, percentage, status, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latestRun) return NextResponse.json({ hasAuditData: false })

    // Previous run for score delta
    const { data: prevRun } = await supabaseAdmin
      .from('audit_runs')
      .select('percentage')
      .eq('organization_id', orgId)
      .neq('id', latestRun.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const scoreChange = prevRun == null
      ? null
      : Math.round((latestRun.percentage - prevRun.percentage) * 10) / 10

    // Open findings grouped by severity
    const { data: openFindings } = await supabaseAdmin
      .from('audit_findings')
      .select('severity')
      .eq('run_id', latestRun.id)
      .eq('status', 'open')

    const findings = openFindings ?? []
    const count = (sev: string) => findings.filter(f => f.severity === sev).length

    return NextResponse.json({
      hasAuditData: true,
      score: latestRun.percentage,
      status: latestRun.status,
      lastAuditAt: latestRun.created_at,
      openFindings: findings.length,
      criticalCount: count('critical'),
      highCount: count('high'),
      mediumCount: count('medium'),
      lowCount: count('low'),
      scoreChange,
      previousScore: prevRun?.percentage ?? null,
    })
  } catch (err) {
    log.error('code-health widget error', { error: String(err) })
    return NextResponse.json({ hasAuditData: false })
  }
})
