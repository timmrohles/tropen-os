// GET /api/library/capabilities
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/capabilities')

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin.from('capabilities')
      .select('id, name, label, icon, description, capability_type, scope, package_slug, sort_order, is_active, is_eu_only, system_prompt_injection')
      .is('deleted_at', null)
      .eq('is_active', true)
      .in('scope', ['system', 'package'])
      .order('sort_order')

    if (error) { log.error('fetch capabilities', { error }); throw error }
    return NextResponse.json({ capabilities: data ?? [] })
  } catch (err) {
    log.error('GET /api/library/capabilities', { err })
    return NextResponse.json({ error: 'Failed to load capabilities' }, { status: 500 })
  }
}
