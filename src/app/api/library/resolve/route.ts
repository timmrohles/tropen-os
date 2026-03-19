// POST /api/library/resolve
// Full library resolution: role + capability + outcome + skill → WorkflowPlan
// Replaces /api/capabilities/resolve when role or skill is involved
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { resolveWorkflowSchema } from '@/lib/validators/library'
import { resolveWorkflow } from '@/lib/library-resolver'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/resolve')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, resolveWorkflowSchema)
  if (validated.error) return validated.error

  try {
    const plan = await resolveWorkflow({
      ...validated.data,
      userId: me.id,
      orgId: me.organization_id,
    })
    return NextResponse.json(plan)
  } catch (err) {
    log.error('resolveWorkflow failed', { err })
    return NextResponse.json({ error: 'Failed to resolve workflow' }, { status: 500 })
  }
}
