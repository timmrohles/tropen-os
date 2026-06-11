// GET /api/library/outcomes — all system outcomes
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/outcomes')

export const GET = withAuth(async () => {
  try {
    const { data, error } = await supabaseAdmin.from('outcomes')
      .select('id, name, label, icon, description, output_type, card_type, sort_order')
      .eq('is_active', true).order('sort_order')
      .limit(200)

    if (error) { log.error('fetch outcomes', { error }); throw error }
    return NextResponse.json({ outcomes: data ?? [] })
  } catch (err) {
    log.error('GET /api/library/outcomes', { err })
    return NextResponse.json({ error: 'Failed to load outcomes' }, { status: 500 })
  }
})
