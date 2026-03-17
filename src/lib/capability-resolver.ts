import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('capability-resolver')

// card_type is statically derivable from output_type — no DB query needed
const OUTPUT_TO_CARD: Record<string, string> = {
  text:         'text',
  table:        'table',
  chart:        'chart',
  report:       'text',
  presentation: 'text',
  action_plan:  'kanban',
  email:        'text',
  code:         'code',
  score:        'text',
}

export function resolveCardType(outputType: string): string {
  return OUTPUT_TO_CARD[outputType] ?? 'text'
}

export interface WorkflowPlan {
  available: boolean
  /** Reason if available = false. 'no_eu_model' = Confidential capability, no active EU model yet */
  unavailable_reason?: 'no_eu_model' | 'no_model_configured'
  /** The api_model_id string — what you pass to Anthropic/OpenAI SDK */
  model_id: string
  provider: string
  system_prompt: string
  tools: string[]
  card_type: string
  /** Estimated cost per 1k output tokens in EUR */
  estimated_cost_per_1k: number
  budget_ok: boolean
  /** Internal UUIDs for logging */
  capability_id: string
  outcome_id: string
  resolved_model_uuid: string
}

export async function resolveWorkflow(
  capabilityId: string,
  outcomeId: string,
  userId: string,
  orgId: string,
): Promise<WorkflowPlan> {
  // 1. Load capability
  const { data: cap, error: capErr } = await supabaseAdmin
    .from('capabilities')
    .select('id, capability_type, label, system_prompt_injection, tools, default_model_id')
    .eq('id', capabilityId)
    .single()

  if (capErr || !cap) {
    log.error('capability not found', { capabilityId, capErr })
    throw new Error(`Capability not found: ${capabilityId}`)
  }

  // 2. Load outcome
  const { data: out, error: outErr } = await supabaseAdmin
    .from('outcomes')
    .select('id, output_type, card_type, system_prompt_injection')
    .eq('id', outcomeId)
    .single()

  if (outErr || !out) {
    log.error('outcome not found', { outcomeId, outErr })
    throw new Error(`Outcome not found: ${outcomeId}`)
  }

  // 3. Determine model: user pref > org override > capability default
  let resolvedModelUuid: string | null = (cap.default_model_id as string) ?? null

  // 3a. Org settings
  const { data: orgSettings } = await supabaseAdmin
    .from('capability_org_settings')
    .select('default_model_id, allowed_model_ids, user_can_override, is_enabled')
    .eq('organization_id', orgId)
    .eq('capability_id', capabilityId)
    .single()

  if (orgSettings?.default_model_id) {
    resolvedModelUuid = orgSettings.default_model_id as string
  }

  // 3b. User settings (only if org allows override)
  const userCanOverride = (orgSettings as { user_can_override?: boolean } | null)?.user_can_override ?? true
  if (userCanOverride) {
    const { data: userSettings } = await supabaseAdmin
      .from('user_capability_settings')
      .select('selected_model_id')
      .eq('user_id', userId)
      .eq('capability_id', capabilityId)
      .single()

    if (userSettings?.selected_model_id) {
      const allowed: string[] = (orgSettings as { allowed_model_ids?: string[] } | null)?.allowed_model_ids ?? []
      if (allowed.length === 0 || allowed.includes(userSettings.selected_model_id as string)) {
        resolvedModelUuid = userSettings.selected_model_id as string
      }
    }
  }

  // 4. Load model details — graceful fallback for capabilities without active model
  // (e.g. Confidential: default_model_id = NULL until EU models are activated)
  if (!resolvedModelUuid) {
    log.warn('no model resolved — capability unavailable', { capabilityId })
    return {
      available:             false,
      unavailable_reason:    'no_eu_model' as const,
      model_id:              '',
      provider:              '',
      system_prompt:         '',
      tools:                 [],
      card_type:             resolveCardType((out as { output_type: string }).output_type),
      estimated_cost_per_1k: 0,
      budget_ok:             false,
      capability_id:         capabilityId,
      outcome_id:            outcomeId,
      resolved_model_uuid:   '',
    }
  }

  const { data: model, error: modelErr } = await supabaseAdmin
    .from('model_catalog')
    .select('id, name, api_model_id, provider, cost_per_1k_input, cost_per_1k_output, context_window')
    .eq('id', resolvedModelUuid)
    .single()

  if (modelErr || !model) {
    log.error('model not found', { resolvedModelUuid, modelErr })
    throw new Error(`Model not found: ${resolvedModelUuid}`)
  }

  // 5. Build combined system prompt
  const parts = [
    (cap as { system_prompt_injection?: string | null }).system_prompt_injection,
    (out as { system_prompt_injection?: string | null }).system_prompt_injection,
  ].filter(Boolean)
  const systemPrompt = parts.join('\n\n')

  // 6. Tools (from capability)
  const rawTools = (cap as { tools?: unknown }).tools
  const tools: string[] = Array.isArray(rawTools) ? rawTools as string[] : []

  // 7. Cost estimate (output costs dominate)
  const estimatedCostPer1k = (model as { cost_per_1k_output?: number }).cost_per_1k_output ?? 0

  return {
    available:             true,
    model_id:              (model as { api_model_id?: string; name: string }).api_model_id ?? (model as { name: string }).name,
    provider:              (model as { provider: string }).provider,
    system_prompt:         systemPrompt,
    tools,
    card_type:             resolveCardType((out as { output_type: string }).output_type),
    estimated_cost_per_1k: estimatedCostPer1k,
    budget_ok:             true, // TODO(timm): wire into budget_limit check from org settings
    capability_id:         capabilityId,
    outcome_id:            outcomeId,
    resolved_model_uuid:   resolvedModelUuid,
  }
}

export async function getValidOutcomes(capabilityId: string) {
  const { data, error } = await supabaseAdmin
    .from('capability_outcomes')
    .select('outcome_id, is_default, sort_order, outcomes(id, label, icon, output_type, card_type)')
    .eq('capability_id', capabilityId)
    .order('sort_order')

  if (error) {
    log.error('getValidOutcomes failed', { capabilityId, error })
    throw new Error('Failed to load valid outcomes')
  }
  return data ?? []
}

export async function getDefaultOutcome(capabilityId: string) {
  const { data, error } = await supabaseAdmin
    .from('capability_outcomes')
    .select('outcome_id, outcomes(id, label, icon, output_type, card_type)')
    .eq('capability_id', capabilityId)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    log.error('getDefaultOutcome failed', { capabilityId, error })
    return null
  }
  return data
}
