// GET /api/feeds/[id]/runs — Run-History für eine Feed-Quelle
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'
import { verifyFeedSourceAccess } from '@/lib/api/feeds'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export const GET = withAuth<{ id: string }>(async (request, { auth, params }) => {
  const { id } = params
  if (!(await verifyFeedSourceAccess(id, auth))) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100)

  const { data, error } = await supabaseAdmin
    .from('feed_runs')
    .select('*')
    .eq('source_id', id)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) return apiError(error)

  return NextResponse.json({ runs: data ?? [] })
})
