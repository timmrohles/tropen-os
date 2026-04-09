import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:cockpit:code-health')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const orgId = profile?.organization_id
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

    const scoreChange = prevRun != null
      ? Math.round((latestRun.percentage - prevRun.percentage) * 10) / 10
      : null

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
}
