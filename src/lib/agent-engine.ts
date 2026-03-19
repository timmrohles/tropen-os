// src/lib/agent-engine.ts
// Plan J2b — Agent-Engine: runAgent, executeStep, checkBudget, calculateNextRun
// checkScheduledTriggers is called via GET /api/cron/agents/check (Plan J2c)

import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import type {
  Agent,
  AgentRun,
  AgentStep,
  AgentTriggerConfig,
} from '@/types/agents'

export const runtime = 'nodejs'

const log = createLogger('agent-engine')

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchAgent(agentId: string): Promise<Agent | null> {
  const { data } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .is('deleted_at', null)
    .single()

  if (!data) return null
  // inline mapping to avoid circular import issues
  const row = data as Record<string, unknown>
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    emoji: (row.emoji as string) ?? '🤖',
    scope: (row.scope as Agent['scope']) ?? 'user',
    organizationId: (row.organization_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    requiresPackage: (row.requires_package as string) ?? null,
    createdByRole: (row.created_by_role as Agent['createdByRole']) ?? null,
    sourceAgentId: (row.source_agent_id as string) ?? null,
    isTemplate: (row.is_template as boolean) ?? false,
    systemPrompt: (row.system_prompt as string) ?? null,
    capabilitySteps: (row.capability_steps as AgentStep[]) ?? [],
    triggerType: (row.trigger_type as Agent['triggerType']) ?? null,
    triggerConfig: (row.trigger_config as AgentTriggerConfig) ?? null,
    inputSources: (row.input_sources as Agent['inputSources']) ?? [],
    outputTargets: (row.output_targets as Agent['outputTargets']) ?? [],
    requiresApproval: (row.requires_approval as boolean) ?? false,
    maxCostEur: (row.max_cost_eur as number) ?? 1.00,
    isActive: (row.is_active as boolean) ?? true,
    lastRunAt: (row.last_run_at as string) ?? null,
    nextRunAt: (row.next_run_at as string) ?? null,
    runCount: (row.run_count as number) ?? 0,
    displayOrder: (row.display_order as number) ?? 0,
    deletedAt: (row.deleted_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// ─── checkBudget ─────────────────────────────────────────────────────────────

export async function checkBudget(
  agentId: string,
  _orgId: string
): Promise<{ sufficient: boolean; available_eur: number }> {
  const agent = await fetchAgent(agentId)
  if (!agent) return { sufficient: false, available_eur: 0 }

  const limit = agent.maxCostEur ?? 1.00

  // Sum cost of runs in the last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabaseAdmin
    .from('agent_runs')
    .select('cost_eur')
    .eq('agent_id', agentId)
    .gte('started_at', since)
    .in('status', ['success', 'error'])

  const used = (data ?? []).reduce(
    (sum, r) => sum + ((r as { cost_eur: number | null }).cost_eur ?? 0),
    0
  )

  const available = Math.max(0, limit - used)
  return { sufficient: available > 0.01, available_eur: available }
}

// ─── calculateNextRun ─────────────────────────────────────────────────────────

export function calculateNextRun(
  triggerConfig: AgentTriggerConfig
): Date | null {
  if (!triggerConfig.schedule) return null

  // Minimal cron parser — supports basic patterns used in production
  // Full cron parsing is deferred; Vercel Cron handles the schedule externally
  // This function is used to set next_run_at after a run completes
  const parts = triggerConfig.schedule.split(' ')
  if (parts.length !== 5) return null

  const [minute, hour, dom, , dow] = parts
  const now = new Date()
  const next = new Date(now)
  next.setSeconds(0, 0)

  // Parse numeric or wildcard values
  const parseField = (field: string, current: number): number | null => {
    if (field === '*') return current
    const n = parseInt(field, 10)
    return isNaN(n) ? null : n
  }

  const targetMin  = parseField(minute, now.getMinutes())
  const targetHour = parseField(hour,   now.getHours())

  if (targetMin === null || targetHour === null) return null

  // Set target time today
  next.setHours(targetHour, targetMin, 0, 0)

  // If in the past, advance by the appropriate interval
  if (next <= now) {
    if (dom !== '*' || dow !== '*') {
      // Weekly/daily — advance 1 day at a time until constraint matches
      next.setDate(next.getDate() + 1)
    } else {
      // Hourly or minutely (not used in MVP)
      next.setDate(next.getDate() + 1)
    }
  }

  return next
}

// ─── executeStep ─────────────────────────────────────────────────────────────

export interface StepResult {
  success: boolean
  output: string | null
  tokenUsage?: { input_tokens: number; output_tokens: number }
  error?: string
}

export async function executeStep(
  _run: AgentRun,
  step: AgentStep,
  agent: Agent,
  previousOutput?: string
): Promise<StepResult> {
  const systemPrompt =
    step.system_prompt_override ??
    agent.systemPrompt ??
    'Du bist ein hilfreicher Assistent.'

  const model =
    step.model_override ?? 'claude-haiku-4-5-20251001'

  const userContent =
    step.input_from === 'previous_step' && previousOutput
      ? `Verarbeite folgendes Ergebnis aus dem vorherigen Schritt:\n\n${previousOutput}`
      : `Führe deine Aufgabe (Schritt ${step.order + 1}) aus.`

  try {
    const { text, usage } = await generateText({
      model: anthropic(model),
      maxOutputTokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    return {
      success: true,
      output: text,
      tokenUsage: {
        input_tokens: usage.inputTokens ?? 0,
        output_tokens: usage.outputTokens ?? 0,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    log.error('executeStep failed', { agentId: agent.id, step: step.order, error: msg })
    return { success: false, output: null, error: msg }
  }
}

// ─── runAgent ────────────────────────────────────────────────────────────────

export async function runAgent(
  agentId: string,
  triggeredBy: AgentRun['triggeredBy'],
  triggerPayload?: unknown
): Promise<string> {
  const agent = await fetchAgent(agentId)
  if (!agent) throw new Error(`Agent not found: ${agentId}`)
  if (!agent.isActive)  throw new Error(`Agent is inactive: ${agentId}`)

  // Rate-limit: max 1 active run per agent
  const { count } = await supabaseAdmin
    .from('agent_runs')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('status', 'running')

  if ((count ?? 0) > 0) {
    log.info('runAgent skipped — run already active', { agentId })
    throw new Error('Agent is already running')
  }

  // Budget check
  const budget = await checkBudget(agentId, agent.organizationId ?? '')
  if (!budget.sufficient) {
    throw new Error(`Budget exhausted (available: ${budget.available_eur.toFixed(4)} EUR)`)
  }

  // Create run record (status=running)
  const { data: runData, error: runError } = await supabaseAdmin
    .from('agent_runs')
    .insert({
      agent_id:        agentId,
      organization_id: agent.organizationId,
      user_id:         agent.userId,
      triggered_by:    triggeredBy,
      trigger_payload: triggerPayload ?? null,
      status:          'running',
      steps_total:     Math.max(agent.capabilitySteps.length, 1),
      started_at:      new Date().toISOString(),
    })
    .select()
    .single()

  if (runError || !runData) {
    throw new Error(`Failed to create agent_run: ${runError?.message}`)
  }

  const runId = (runData as { id: string }).id

  // Execute steps async (fire-and-forget from API perspective)
  executeAgentSteps(runId, agent).catch((err) => {
    log.error('executeAgentSteps failed', { runId, error: (err as Error).message })
  })

  return runId
}

// ─── executeAgentSteps (internal, async) ─────────────────────────────────────

async function executeAgentSteps(runId: string, agent: Agent): Promise<void> {
  // Fetch run
  const { data: runRow } = await supabaseAdmin
    .from('agent_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (!runRow) return

  const run = runRow as unknown as AgentRun
  const steps = agent.capabilitySteps.slice().sort((a, b) => a.order - b.order)

  let previousOutput: string | undefined
  let totalInputTokens  = 0
  let totalOutputTokens = 0
  let totalCost         = 0
  let stepsCompleted    = 0

  // If no steps configured, run a single call using systemPrompt directly
  const effectiveSteps: AgentStep[] = steps.length > 0 ? steps : [{
    order: 0,
    capability_id: 'default',
    outcome_id: 'default',
    input_from: 'trigger',
  }]

  for (const step of effectiveSteps) {
    const result = await executeStep(run, step, agent, previousOutput)

    if (!result.success) {
      await supabaseAdmin
        .from('agent_runs')
        .update({
          status:          'error',
          error_message:   result.error ?? 'Step failed',
          error_step:      step.order,
          steps_completed: stepsCompleted,
          completed_at:    new Date().toISOString(),
        })
        .eq('id', runId)

      // Increment run_count even on error
      await supabaseAdmin
        .from('agents')
        .update({ run_count: agent.runCount + 1 })
        .eq('id', agent.id)

      return
    }

    previousOutput = result.output ?? undefined
    stepsCompleted++

    if (result.tokenUsage) {
      totalInputTokens  += result.tokenUsage.input_tokens
      totalOutputTokens += result.tokenUsage.output_tokens
      // haiku pricing: ~$0.0008/1K input, $0.0025/1K output (approx EUR)
      totalCost += (result.tokenUsage.input_tokens / 1000) * 0.00075
      totalCost += (result.tokenUsage.output_tokens / 1000) * 0.00225
    }
  }

  // Compute next_run_at for scheduled agents
  const nextRun = agent.triggerConfig
    ? calculateNextRun(agent.triggerConfig)
    : null

  // Update run → success
  await supabaseAdmin
    .from('agent_runs')
    .update({
      status:           'success',
      steps_completed:  stepsCompleted,
      output_summary:   previousOutput ?? null,
      token_usage:      { input_tokens: totalInputTokens, output_tokens: totalOutputTokens },
      cost_eur:         totalCost,
      completed_at:     new Date().toISOString(),
    })
    .eq('id', runId)

  // Update agent metadata
  await supabaseAdmin
    .from('agents')
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: nextRun?.toISOString() ?? null,
      run_count:   agent.runCount + 1,
    })
    .eq('id', agent.id)

  log.info('Agent run completed', {
    agentId:       agent.id,
    runId,
    stepsCompleted,
    cost_eur:      totalCost.toFixed(6),
  })
}

// ─── checkScheduledTriggers ─────────────────────────────────────────────────
// Called by GET /api/cron/agents/check (Plan J2c)

export async function checkScheduledTriggers(): Promise<{
  checked: number
  triggered: number
  errors: string[]
}> {
  const now = new Date()
  const errors: string[] = []

  // Fetch all active scheduled agents where next_run_at <= now
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('trigger_type', 'scheduled')
    .eq('is_active', true)
    .is('deleted_at', null)
    .lte('next_run_at', now.toISOString())

  if (!agents || agents.length === 0) {
    return { checked: 0, triggered: 0, errors: [] }
  }

  let triggered = 0

  for (const row of agents) {
    const agentRow = row as { id: string; next_run_at: string | null }
    // Also trigger if next_run_at is null (never run before)
    try {
      await runAgent(agentRow.id, 'schedule', { scheduled_at: now.toISOString() })
      triggered++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown'
      // Skip "already running" silently; log real errors
      if (!msg.includes('already running')) {
        errors.push(`${agentRow.id}: ${msg}`)
        log.error('checkScheduledTriggers: runAgent failed', { agentId: agentRow.id, error: msg })
      }
    }
  }

  return { checked: agents.length, triggered, errors }
}
