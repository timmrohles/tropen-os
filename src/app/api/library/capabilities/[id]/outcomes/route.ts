// GET /api/library/capabilities/[id]/outcomes
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { getValidOutcomes } from '@/lib/library-resolver'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/capabilities/outcomes')

export const GET = withAuth<{ id: string }>(async (_req, { params }) => {
  const { id } = params
  try {
    const outcomes = await getValidOutcomes(id)
    return NextResponse.json({ outcomes })
  } catch (err) {
    log.error('GET capabilities/[id]/outcomes', { id, err })
    return NextResponse.json({ error: 'Failed to load outcomes' }, { status: 500 })
  }
})
