// Central resolver for Chat + Workspace library system.
// Combines Role + Skill + Capability + Outcome into a WorkflowPlan.
// NOTE: does NOT replace capability-resolver.ts (keep that for backward compat)

import { supabaseAdmin } from '@/lib/supabase-admin'

export interface WorkflowPlan {
  model_id:           string     // api_model_id — what you pass to the model SDK
  provider:           'anthropic' | 'openai' | 'google' | 'mistral'
  system_prompt:      string
  tools:              string[]
  card_type:          string
  estimated_cost_eur: number
  budget_sufficient:  boolean
  role_id?:           string
  skill_id?:          string
  capability_id:      string
  outcome_id:         string
}

interface SkillContext {
  org_knowledge:    Record<string, string>
  project_memory:   string | null
  user_preferences: Record<string, string>
}

// DB row types (minimal — only what we need)
interface CapabilityRow {
  id: string
  capability_type: string
  system_prompt_injection: string | null
  tools: string[]
  default_model_id: string | null
}
interface ModelRow {
  id: string
  api_model_id: string
  provider: string
  cost_per_1k_output: number
  is_active: boolean
  is_eu_hosted: boolean
}
interface OutcomeRow {
  id: string
  output_type: string
  card_type: string
  system_prompt_injection: string | null
}
interface RoleRow {
  id: string
  system_prompt: string
  domain_keywords: string[]
}
interface SkillRow {
  id: string
  instructions: string
  trigger_keywords: string[]
  recommended_role_name: string | null
}

const OUTPUT_TO_CARD: Record<string, string> = {
  text: 'text', table: 'table', chart: 'chart', report: 'text',
  presentation: 'text', action_plan: 'kanban', email: 'text', code: 'code', score: 'text',
}

// Main resolution function — call before every LLM call when using library entities
export async function resolveWorkflow(input: {
  roleId?:      string
  capabilityId: string
  outcomeId:    string
  skillId?:     string
  userId:       string
  orgId:        string
  projectId?:   string
}): Promise<WorkflowPlan> {
  // Load all entities in parallel
  const [capResult, outcomeResult, roleResult, skillResult] = await Promise.all([
    supabaseAdmin.from('capabilities')
      .select('id, capability_type, system_prompt_injection, tools, default_model_id')
      .eq('id', input.capabilityId).single(),
    supabaseAdmin.from('outcomes')
      .select('id, output_type, card_type, system_prompt_injection')
      .eq('id', input.outcomeId).single(),
    input.roleId
      ? supabaseAdmin.from('roles')
          .select('id, system_prompt, domain_keywords')
          .eq('id', input.roleId).is('deleted_at', null).single()
      : Promise.resolve({ data: null, error: null }),
    input.skillId
      ? supabaseAdmin.from('skills')
          .select('id, instructions, trigger_keywords, recommended_role_name')
          .eq('id', input.skillId).is('deleted_at', null).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (capResult.error || !capResult.data) throw new Error(`Capability not found: ${input.capabilityId}`)
  if (outcomeResult.error || !outcomeResult.data) throw new Error(`Outcome not found: ${input.outcomeId}`)

  const cap     = capResult.data    as CapabilityRow
  const outcome = outcomeResult.data as OutcomeRow
  const role    = roleResult.data    as RoleRow | null
  const skill   = skillResult.data   as SkillRow | null

  // Resolve model: capability default → haiku fallback
  const modelId = cap.default_model_id
  let model: ModelRow | null = null
  if (modelId) {
    const { data } = await supabaseAdmin.from('model_catalog')
      .select('id, api_model_id, provider, cost_per_1k_output, is_active, is_eu_hosted')
      .eq('id', modelId).single()
    model = data as ModelRow | null
  }
  if (!model) {
    const { data } = await supabaseAdmin.from('model_catalog')
      .select('id, api_model_id, provider, cost_per_1k_output, is_active, is_eu_hosted')
      .eq('api_model_id', 'claude-haiku-4-5-20251001').single()
    model = data as ModelRow | null
  }
  if (!model) throw new Error('No model available')

  const systemPrompt = buildSystemPrompt(
    { role, skill, cap, outcome },
    { org_knowledge: {}, project_memory: null, user_preferences: {} },
  )

  return {
    model_id:           model.api_model_id,
    provider:           model.provider as WorkflowPlan['provider'],
    system_prompt:      systemPrompt,
    tools:              (cap.tools ?? []) as string[],
    card_type:          outcome.card_type ?? OUTPUT_TO_CARD[outcome.output_type] ?? 'text',
    estimated_cost_eur: model.cost_per_1k_output,
    budget_sufficient:  true,  // budget check delegated to AI-chat edge function
    role_id:            role?.id,
    skill_id:           skill?.id,
    capability_id:      cap.id,
    outcome_id:         outcome.id,
  }
}

// Role detection — keyword matching, NO LLM call
export async function detectRole(
  message: string,
  _orgId: string,
  _userId: string,
): Promise<RoleRow | null> {
  const { data: roles } = await supabaseAdmin.from('roles')
    .select('id, system_prompt, domain_keywords')
    .is('deleted_at', null)
    .eq('is_active', true)
    .in('scope', ['system','package','org','user'])
    .limit(50)

  if (!roles?.length) return null
  const lower = message.toLowerCase()

  let bestRole: RoleRow | null = null
  let bestScore = 0

  for (const role of roles as RoleRow[]) {
    const score = role.domain_keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    if (score > bestScore) { bestScore = score; bestRole = role }
  }
  return bestScore > 0 ? bestRole : null
}

// Skill detection — keyword matching, NO LLM call
export async function detectSkill(
  message: string,
  role: RoleRow | null,
): Promise<SkillRow | null> {
  const { data: skills } = await supabaseAdmin.from('skills')
    .select('id, instructions, trigger_keywords, recommended_role_name')
    .is('deleted_at', null)
    .eq('is_active', true)
    .limit(50)

  if (!skills?.length) return null
  const lower = message.toLowerCase()

  let bestSkill: SkillRow | null = null
  let bestScore = 0

  for (const skill of skills as SkillRow[]) {
    let score = skill.trigger_keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    // Boost if skill matches role recommendation
    if (role && skill.recommended_role_name === role.id) score += 1
    if (score > bestScore) { bestScore = score; bestSkill = skill }
  }
  return bestScore > 0 ? bestSkill : null
}

// Build the final system prompt from all four parts
export function buildSystemPrompt(
  entities: { role: RoleRow | null; skill: SkillRow | null; cap: CapabilityRow; outcome: OutcomeRow },
  context: SkillContext,
): string {
  const parts: string[] = []

  // 1. Role system prompt
  if (entities.role?.system_prompt) {
    parts.push(entities.role.system_prompt)
    parts.push('---')
  }

  // 2. Skill instructions + context
  if (entities.skill?.instructions) {
    parts.push(entities.skill.instructions)
    if (context.project_memory) {
      parts.push(`\nProjekt-Kontext:\n${context.project_memory}`)
    }
    if (Object.keys(context.org_knowledge).length > 0) {
      const orgKnowledge = Object.entries(context.org_knowledge)
        .map(([k, v]) => `${k}: ${v}`).join('\n')
      parts.push(`\nOrg-Wissen:\n${orgKnowledge}`)
    }
    parts.push('---')
  }

  // 3. Capability injection
  if (entities.cap.system_prompt_injection) {
    parts.push(entities.cap.system_prompt_injection)
  }

  // 4. Outcome injection
  if (entities.outcome.system_prompt_injection) {
    parts.push(entities.outcome.system_prompt_injection)
  }

  return parts.join('\n').trim()
}

// Utility: valid outcomes for a capability
export async function getValidOutcomes(capabilityId: string) {
  const { data } = await supabaseAdmin.from('capability_outcomes')
    .select('outcome_id, is_default, sort_order, outcomes(id, label, icon, output_type)')
    .eq('capability_id', capabilityId)
    .order('sort_order')
  return data ?? []
}

// Utility: card type for outcome
export async function resolveCardType(outcomeId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('outcomes')
    .select('card_type, output_type').eq('id', outcomeId).single()
  if (!data) return 'text'
  return data.card_type ?? OUTPUT_TO_CARD[(data as OutcomeRow).output_type] ?? 'text'
}
