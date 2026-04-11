// GET /api/feeds/[id]/runs — Run-History für eine Feed-Quelle
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
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
}
