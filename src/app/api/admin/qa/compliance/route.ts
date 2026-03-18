export const dynamic = 'force-dynamic'

import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { ComplianceResponse } from '@/types/qa'
const log = createLogger('admin/qa/compliance')

export const revalidate = 60

async function isSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'superadmin'
}

export async function GET() {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Keine Berechtigung', code: 'UNAUTHORIZED' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('qa_compliance_checks')
      .select('id, article, label, status, notes, last_checked_at, open_action, deadline')
      .order('article')

    if (error) throw error

    const items = data ?? []
    const pass = items.filter(i => i.status === 'pass').length
    const warn = items.filter(i => i.status === 'warn').length
    const fail = items.filter(i => i.status === 'fail').length

    const openActions = items
      .filter(i => i.open_action)
      .map(i => ({
        article: i.article,
        action: i.open_action as string,
        deadline: i.deadline ?? '',
      }))

    const response: ComplianceResponse = {
      summary: { pass, warn, fail, total: items.length },
      items: items.map(i => ({
        id: i.id,
        article: i.article,
        label: i.label,
        status: i.status as 'pass' | 'warn' | 'fail',
        notes: i.notes ?? null,
        lastCheckedAt: i.last_checked_at,
      })),
      openActions,
    }

    return NextResponse.json(response)
  } catch (err) {
    log.error('[qa/compliance]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_COMPLIANCE_ERROR' },
      { status: 500 }
    )
  }
}
