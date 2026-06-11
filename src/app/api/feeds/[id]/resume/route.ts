// POST /api/feeds/[id]/resume
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { verifyFeedSourceAccess } from '@/lib/api/feeds'
import { resumeFeed } from '@/lib/feeds/feed-pause'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export const POST = withAuth<{ id: string }>(async (_request, { auth, params }) => {
  const { id } = params
  if (!(await verifyFeedSourceAccess(id, auth))) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const result = await resumeFeed(id)
  if (result.error) return apiError(result.error)

  return NextResponse.json({ ok: true })
})
