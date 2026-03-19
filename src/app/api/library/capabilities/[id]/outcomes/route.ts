// GET /api/library/capabilities/[id]/outcomes
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getValidOutcomes } from '@/lib/library-resolver'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/capabilities/outcomes')

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const outcomes = await getValidOutcomes(id)
    return NextResponse.json({ outcomes })
  } catch (err) {
    log.error('GET capabilities/[id]/outcomes', { id, err })
    return NextResponse.json({ error: 'Failed to load outcomes' }, { status: 500 })
  }
}
