import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { getValidOutcomes } from '@/lib/capability-resolver'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/[id]/outcomes')

// GET /api/capabilities/[id]/outcomes
// Returns all valid outcomes for a specific capability.
export const GET = withAuth<{ id: string }>(async (_req, { params }) => {
  const { id } = params

  try {
    const outcomes = await getValidOutcomes(id)
    return NextResponse.json(outcomes)
  } catch (err) {
    log.error('getValidOutcomes failed', { capabilityId: id, err })
    return NextResponse.json({ error: 'Not found or internal error' }, { status: 404 })
  }
})
