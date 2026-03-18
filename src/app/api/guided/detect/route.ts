import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { detectWorkflow } from '@/lib/guided-workflow-engine'
import { detectInputSchema } from '@/lib/validators/guided'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/guided/detect')

// POST /api/guided/detect
// Detects which guided workflow (if any) should be shown for this message + context.
// Returns { workflow } — null if no workflow triggered (normal, caller shows empty chat).
export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = detectInputSchema.safeParse({ ...body, userId: me.id })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const workflow = await detectWorkflow(parsed.data)
    return NextResponse.json({ workflow })
  } catch (err) {
    log.error('detect failed', { err })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
