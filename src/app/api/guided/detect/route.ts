import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { detectWorkflow } from '@/lib/guided-workflow-engine'
import { detectInputSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'
import { apiValidationError } from '@/lib/api-error'

const log = createLogger('api/guided/detect')

// POST /api/guided/detect
// Detects which guided workflow (if any) should be shown for this message + context.
// Returns { workflow } — null if no workflow triggered (normal, caller shows empty chat).
export const POST = withAuth(async (req, { auth }) => {
  const body = await req.json().catch(() => null)
  const parsed = detectInputSchema.safeParse({ ...body, userId: auth.id })
  if (!parsed.success) {
    return apiValidationError(parsed.error)
  }

  try {
    const workflow = await detectWorkflow(parsed.data)
    return NextResponse.json({ workflow })
  } catch (err) {
    log.error('detect failed', { err })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
})
