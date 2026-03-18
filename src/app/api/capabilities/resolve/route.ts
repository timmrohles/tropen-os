import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { resolveWorkflow } from '@/lib/capability-resolver'
import { validateBody } from '@/lib/validators'
import { resolveWorkflowInputSchema } from '@/lib/validators/capabilities'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities/resolve')

// POST /api/capabilities/resolve
// Resolves a WorkflowPlan for a given capability + outcome combination.
// Returns model_id, system_prompt, tools, card_type, estimated cost.
export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, resolveWorkflowInputSchema)
  if (validated.error) return validated.error

  try {
    const plan = await resolveWorkflow(
      validated.data.capability_id,
      validated.data.outcome_id,
      me.id,
      me.organization_id,
    )

    // Graceful unavailable (e.g. Confidential without active EU model)
    if (!plan.available) {
      return NextResponse.json(
        { error: 'capability_unavailable', reason: plan.unavailable_reason },
        { status: 422 }
      )
    }

    return NextResponse.json(plan)
  } catch (err) {
    log.error('resolveWorkflow failed', { err })
    return NextResponse.json({ error: 'Failed to resolve workflow' }, { status: 500 })
  }
}
