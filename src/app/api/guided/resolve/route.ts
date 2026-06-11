import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { resolveOption } from '@/lib/guided-workflow-engine'
import { resolveInputSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'
import { apiValidationError } from '@/lib/api-error'

const log = createLogger('api/guided/resolve')

// POST /api/guided/resolve
// Resolves a workflow option selection:
// - next_workflow  → returns next workflow with its options
// - capability_plan → returns WorkflowPlan (model, prompt, tools, card_type)
// - custom_input   → caller shows free text input
// - save_artifact  → caller triggers knowledge-base save
export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json().catch(() => null)
  const parsed = resolveInputSchema.safeParse(body)
  if (!parsed.success) {
    return apiValidationError(parsed.error)
  }

  try {
    const result = await resolveOption(
      parsed.data.workflowId,
      parsed.data.optionId,
      auth.id,
      auth.organization_id,
    )

    // For capability_plan: expose the merged system_prompt at the top level for convenience
    if (result.type === 'capability_plan') {
      return NextResponse.json({
        type:          result.type,
        plan:          result.plan,
        system_prompt: result.plan.system_prompt,
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    log.error('resolve failed', { err })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
})
