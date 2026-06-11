// POST /api/feeds/[id]/run — Manueller Feed-Run-Trigger
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { verifyFeedSourceAccess } from '@/lib/api/feeds'
import { runFeedSource } from '@/lib/feeds/feed-runner'

export const runtime = 'nodejs'

export const POST = withAuth<{ id: string }>(async (_request, { auth, params }) => {
  const { id } = params
  if (!(await verifyFeedSourceAccess(id, auth))) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const result = await runFeedSource(id, 'manual')

  return NextResponse.json(result)
})
