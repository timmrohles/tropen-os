// POST /api/feeds/[id]/pause
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { pauseFeed } from '@/lib/feeds/feed-pause'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const reason = typeof body.reason === 'string' ? body.reason : undefined

  const result = await pauseFeed(id, user.id, reason)
  if (result.error) return apiError(result.error)

  return NextResponse.json({ ok: true })
}
