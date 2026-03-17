import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getValidOutcomes } from '@/lib/capability-resolver'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/[id]/outcomes')

// GET /api/capabilities/[id]/outcomes
// Returns all valid outcomes for a specific capability.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const outcomes = await getValidOutcomes(id)
    return NextResponse.json(outcomes)
  } catch (err) {
    log.error('getValidOutcomes failed', { capabilityId: id, err })
    return NextResponse.json({ error: 'Not found or internal error' }, { status: 404 })
  }
}
