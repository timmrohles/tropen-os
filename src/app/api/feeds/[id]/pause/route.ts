// POST /api/feeds/[id]/pause
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { verifyFeedSourceAccess } from '@/lib/api/feeds'
import { pauseFeed } from '@/lib/feeds/feed-pause'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export const POST = withAuth<{ id: string }>(async (request, { auth, params }) => {
  const { id } = params
  if (!(await verifyFeedSourceAccess(id, auth))) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const reason = typeof body.reason === 'string' ? body.reason : undefined

  const result = await pauseFeed(id, auth.id, reason)
  if (result.error) return apiError(result.error)

  return NextResponse.json({ ok: true })
})
