// src/types/agents.ts
// Plan J2a — Skills System Types
// Plan J2b — Agent + AgentRun Types

export type SkillScope = 'system' | 'package' | 'org' | 'user'
export type SkillOutput = 'text' | 'json' | 'artifact' | 'notification'
export type SkillCreatedByRole = 'superadmin' | 'org_admin' | 'member' | 'toro'

export interface Skill {
  id: string
  name: string           // machine-name: 'deep_analysis'
  title: string          // UI-Label: 'Tiefenanalyse'
  description: string | null
  scope: SkillScope
  organizationId: string | null
  userId: string | null
  requiresPackage: string | null
  instructions: string
  contextRequirements: string | null
  governanceRules: string | null
  qualityCriteria: string | null
  inputSchema: Record<string, unknown>
  outputType: SkillOutput
  triggerKeywords: string[]
  isActive: boolean
  isTemplate: boolean
  version: number
  createdByRole: SkillCreatedByRole
  sourceSkillId: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentSkill {
  agentId: string
  skillId: string
  priority: number
  skill?: Skill           // populated when joining
}

// ─── Agent Types ──────────────────────────────────────────────────────────────

export type AgentScope = 'system' | 'package' | 'org' | 'user'
export type AgentTriggerType = 'scheduled' | 'reactive' | 'contextual'
export type AgentCreatedByRole = 'superadmin' | 'org_admin' | 'member' | 'toro'
export type AgentRunStatus = 'running' | 'success' | 'error' | 'skipped' | 'cancelled'
export type AgentRunTriggeredBy = 'schedule' | 'event' | 'manual' | 'webhook' | 'n8n'

export interface AgentStep {
  order: number
  capability_id: string
  outcome_id: string
  input_from: 'trigger' | 'previous_step' | 'source'
  system_prompt_override?: string
  model_override?: string
}

export interface AgentTriggerConfig {
  schedule?: string
  event_type?: 'feed_item' | 'webhook' | 'chat_end' | 'project_memory_threshold' | 'n8n'
  event_filter?: Record<string, unknown>
  webhook_secret?: string
  context_threshold?: number
}

export interface AgentInput {
  type: 'feed' | 'knowledge' | 'webhook' | 'n8n' | 'manual'
  source_id?: string
  filter?: Record<string, unknown>
}

export interface AgentOutput {
  type: 'artifact' | 'knowledge' | 'notification' | 'webhook' | 'n8n'
  target_id?: string
  webhook_url?: string
  notification_user_ids?: string[]
}

export interface Agent {
  id: string
  name: string
  description: string | null
  emoji: string
  scope: AgentScope
  organizationId: string | null
  userId: string | null
  requiresPackage: string | null
  createdByRole: AgentCreatedByRole | null
  sourceAgentId: string | null
  isTemplate: boolean
  systemPrompt: string | null
  capabilitySteps: AgentStep[]
  triggerType: AgentTriggerType | null
  triggerConfig: AgentTriggerConfig | null
  inputSources: AgentInput[]
  outputTargets: AgentOutput[]
  requiresApproval: boolean
  maxCostEur: number
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  runCount: number
  displayOrder: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentRun {
  id: string
  agentId: string
  organizationId: string | null
  userId: string | null
  triggeredBy: AgentRunTriggeredBy
  triggerPayload: Record<string, unknown> | null
  status: AgentRunStatus
  stepsCompleted: number
  stepsTotal: number
  inputSummary: Record<string, unknown> | null
  outputArtifactId: string | null
  outputSummary: string | null
  tokenUsage: Record<string, unknown> | null
  costEur: number | null
  errorMessage: string | null
  errorStep: number | null
  startedAt: string
  completedAt: string | null
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSkill(row: Record<string, any>): Skill {
  return {
    id: row.id as string,
    name: row.name as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    scope: (row.scope as SkillScope) ?? 'user',
    organizationId: (row.organization_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    requiresPackage: (row.requires_package as string) ?? null,
    instructions: row.instructions as string,
    contextRequirements: (row.context_requirements as string) ?? null,
    governanceRules: (row.governance_rules as string) ?? null,
    qualityCriteria: (row.quality_criteria as string) ?? null,
    inputSchema: (row.input_schema as Record<string, unknown>) ?? {},
    outputType: (row.output_type as SkillOutput) ?? 'text',
    triggerKeywords: (row.trigger_keywords as string[]) ?? [],
    isActive: (row.is_active as boolean) ?? true,
    isTemplate: (row.is_template as boolean) ?? false,
    version: (row.version as number) ?? 1,
    createdByRole: (row.created_by_role as SkillCreatedByRole) ?? 'member',
    sourceSkillId: (row.source_skill_id as string) ?? null,
    deletedAt: (row.deleted_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAgentSkill(row: Record<string, any>): AgentSkill {
  return {
    agentId: row.agent_id as string,
    skillId: row.skill_id as string,
    priority: (row.priority as number) ?? 0,
    skill: row.skills ? mapSkill(row.skills as Record<string, unknown>) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAgent(row: Record<string, any>): Agent {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    emoji: (row.emoji as string) ?? '🤖',
    scope: (row.scope as AgentScope) ?? 'user',
    organizationId: (row.organization_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    requiresPackage: (row.requires_package as string) ?? null,
    createdByRole: (row.created_by_role as AgentCreatedByRole) ?? null,
    sourceAgentId: (row.source_agent_id as string) ?? null,
    isTemplate: (row.is_template as boolean) ?? false,
    systemPrompt: (row.system_prompt as string) ?? null,
    capabilitySteps: (row.capability_steps as AgentStep[]) ?? [],
    triggerType: (row.trigger_type as AgentTriggerType) ?? null,
    triggerConfig: (row.trigger_config as AgentTriggerConfig) ?? null,
    inputSources: (row.input_sources as AgentInput[]) ?? [],
    outputTargets: (row.output_targets as AgentOutput[]) ?? [],
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAgentRun(row: Record<string, any>): AgentRun {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    organizationId: (row.organization_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    triggeredBy: row.triggered_by as AgentRunTriggeredBy,
    triggerPayload: (row.trigger_payload as Record<string, unknown>) ?? null,
    status: row.status as AgentRunStatus,
    stepsCompleted: (row.steps_completed as number) ?? 0,
    stepsTotal: (row.steps_total as number) ?? 0,
    inputSummary: (row.input_summary as Record<string, unknown>) ?? null,
    outputArtifactId: (row.output_artifact_id as string) ?? null,
    outputSummary: (row.output_summary as string) ?? null,
    tokenUsage: (row.token_usage as Record<string, unknown>) ?? null,
    costEur: (row.cost_eur as number) ?? null,
    errorMessage: (row.error_message as string) ?? null,
    errorStep: (row.error_step as number) ?? null,
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string) ?? null,
  }
}
