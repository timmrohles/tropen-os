import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth/guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const logger = createLogger('superadmin-prompts-patch')

const ALLOWED_TABLES: Record<string, string> = {
  capabilities: 'system_prompt_injection',
  outcomes: 'system_prompt_injection',
  agents: 'system_prompt',
  guided_workflow_options: 'system_prompt',
}

/**
 * PATCH /api/superadmin/prompts/[table]/[id]
 * Updates a single prompt in the specified table
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { table, id } = await params

  const column = ALLOWED_TABLES[table]
  if (!column) {
    return NextResponse.json(
      { error: `Table "${table}" is not editable` },
      { status: 400 }
    )
  }

  let body: { prompt: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.prompt !== 'string') {
    return NextResponse.json({ error: 'prompt must be a string' }, { status: 400 })
  }

  try {
    const { error } = await supabaseAdmin
      .from(table)
      .update({ [column]: body.prompt })
      .eq('id', id)

    if (error) {
      logger.error('DB update failed', { table, id, error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info('Prompt updated', { table, id })
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Prompt update error', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
