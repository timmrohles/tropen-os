import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withOrgAdmin } from '@/lib/auth/route-guards'

const log = createLogger('api:cockpit:budget')

export const GET = withOrgAdmin(async (_req, { auth }) => {
  try {
    const orgId = auth.organization_id
    if (!orgId) return NextResponse.json({ usedPercent: 0, usedEur: 0, limitEur: null })

    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('budget_limit')
      .eq('id', orgId)
      .maybeSingle()

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data: usageLogs } = await supabaseAdmin
      .from('usage_logs')
      .select('cost_eur')
      .eq('organization_id', orgId)
      .gte('created_at', monthStart.toISOString())

    const usedEur = (usageLogs ?? []).reduce((sum, r) => sum + (Number(r.cost_eur) || 0), 0)
    const limitEur = org?.budget_limit ? Number(org.budget_limit) : null
    const usedPercent = limitEur ? Math.round((usedEur / limitEur) * 100) : 0

    return NextResponse.json({ usedPercent, usedEur, limitEur })
  } catch (err) {
    log.error('budget error', { error: String(err) })
    return NextResponse.json({ usedPercent: 0, usedEur: 0, limitEur: null })
  }
})
