// POST /api/library/resolve
// Full library resolution: role + capability + outcome + skill → WorkflowPlan
// Replaces /api/capabilities/resolve when role or skill is involved
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { validateBody } from '@/lib/validators'
import { resolveWorkflowSchema } from '@/lib/validators/library'
import { resolveWorkflow } from '@/lib/library-resolver'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/resolve')

export const POST = withAuth(async (req, { auth: me }) => {
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
})
