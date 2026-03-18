// POST /api/agents/webhook/[agent_id] — eingehender Webhook triggert Agent
// Validiert webhook_secret via HMAC-SHA256
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runAgent } from '@/lib/agent-engine'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('api/agents/webhook/[agent_id]')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent_id: string }> }
) {
  const { agent_id } = await params

  // Fetch agent (no auth — webhook is public endpoint)
  const { data: agentData } = await supabaseAdmin
    .from('agents')
    .select('id, is_active, deleted_at, trigger_type, trigger_config')
    .eq('id', agent_id)
    .single()

  if (!agentData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const row = agentData as {
    id: string
    is_active: boolean
    deleted_at: string | null
    trigger_type: string | null
    trigger_config: { webhook_secret?: string } | null
  }

  if (row.deleted_at || !row.is_active) {
    return NextResponse.json({ error: 'Agent inactive' }, { status: 422 })
  }

  if (row.trigger_type !== 'reactive') {
    return NextResponse.json({ error: 'Agent is not a reactive trigger type' }, { status: 422 })
  }

  // Validate webhook_secret if configured
  const secret = row.trigger_config?.webhook_secret
  if (secret) {
    const signature = request.headers.get('x-webhook-signature') ?? ''
    const body = await request.text()

    const expected = createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    let valid = false
    try {
      valid = timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex')
      )
    } catch {
      valid = false
    }

    if (!valid) {
      log.error('Webhook signature invalid', { agent_id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body that was already read as text
    let payload: unknown
    try {
      payload = JSON.parse(body)
    } catch {
      payload = { raw: body }
    }

    try {
      const runId = await runAgent(agent_id, 'webhook', payload)
      return NextResponse.json({ run_id: runId })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown'
      log.error('Webhook runAgent failed', { agent_id, error: msg })
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // No secret configured — reject (webhook_secret is mandatory)
  return NextResponse.json({ error: 'Unauthorized: webhook_secret not configured' }, { status: 401 })
}
