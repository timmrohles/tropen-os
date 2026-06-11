import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withOrgAdmin } from '@/lib/auth/route-guards'
const log = createLogger('admin/logs')

// GET /api/admin/logs?limit=50&offset=0&org_id=...
export const GET = withOrgAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0)
  const orgId = searchParams.get('org_id')

  let query = supabaseAdmin
    .from('usage_logs')
    .select(
      `
      id, created_at, tokens_input, tokens_output, cost_eur,
      organizations(name),
      users(full_name, email),
      workspaces(name),
      model_catalog(name, provider)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (orgId) query = query.eq('organization_id', orgId)

  const { data, error, count } = await query

  if (error) {
    log.error('DB Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }

  return NextResponse.json({ data, count, limit, offset })
})
