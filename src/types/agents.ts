// src/types/agents.ts
// Plan J2a — Skills System Types

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
