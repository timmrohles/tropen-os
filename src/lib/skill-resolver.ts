// src/lib/skill-resolver.ts
// Plan J2a — Skill visibility + access logic
// Option C: Skills sind eigenständig (keine Verbindung zu Capabilities)

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { type Skill, type AgentSkill, mapSkill, mapAgentSkill } from '@/types/agents'

const logger = createLogger('skill-resolver')

// ─── Visibility Helpers ───────────────────────────────────────────────────────

/**
 * Returns all skills visible to a given user.
 *
 * Visibility:
 * - scope='system' → always visible
 * - scope='package' → visible if org has the package active (checked via org_packages or
 *   approximated: always returned, API consumers filter by requiresPackage)
 * - scope='org' → visible if organization_id matches user's org
 * - scope='user' → visible only to the owner (user_id matches)
 */
export async function getSkillsForUser(
  userId: string,
  orgId: string | null
): Promise<Skill[]> {
  // Build the visibility filter as a Supabase OR query
  const scopeFilters: string[] = ['scope.eq.system', 'scope.eq.package']

  if (orgId) {
    scopeFilters.push(`and(scope.eq.org,organization_id.eq.${orgId})`)
  }

  scopeFilters.push(`and(scope.eq.user,user_id.eq.${userId})`)

  const { data, error } = await supabaseAdmin
    .from('skills')
    .select('*')
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(scopeFilters.join(','))
    .order('scope', { ascending: true })
    .order('title', { ascending: true })

  if (error) {
    logger.error('getSkillsForUser failed', { userId, orgId, error: error.message })
    return []
  }

  return (data ?? []).map((row) => mapSkill(row as Record<string, unknown>))
}

/**
 * Returns all skills attached to a given agent (via agent_skills), sorted by priority desc.
 */
export async function getSkillsForAgent(agentId: string): Promise<AgentSkill[]> {
  const { data, error } = await supabaseAdmin
    .from('agent_skills')
    .select('*, skills(*)')
    .eq('agent_id', agentId)
    .order('priority', { ascending: false })

  if (error) {
    logger.error('getSkillsForAgent failed', { agentId, error: error.message })
    return []
  }

  return (data ?? []).map((row) => mapAgentSkill(row as Record<string, unknown>))
}

/**
 * Resolves a single skill by ID, checking that the requesting user can access it.
 * Returns null if not found or not visible to user.
 */
export async function resolveSkill(
  skillId: string,
  userId: string,
  orgId: string | null
): Promise<Skill | null> {
  const { data, error } = await supabaseAdmin
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  const skill = mapSkill(data as Record<string, unknown>)

  // Check visibility
  if (!canAccessSkill(skill, userId, orgId)) return null

  return skill
}

/**
 * Checks if a skill is visible to a user without fetching from DB.
 * Used after fetching to validate ownership/visibility.
 */
export function canAccessSkill(
  skill: Skill,
  userId: string,
  orgId: string | null
): boolean {
  switch (skill.scope) {
    case 'system':
      return true
    case 'package':
      return true // API consumers are responsible for package filtering
    case 'org':
      return !!orgId && skill.organizationId === orgId
    case 'user':
      return skill.userId === userId
    default:
      return false
  }
}

/**
 * Checks if a user can modify (update/delete) a skill.
 * Only owners of a skill can modify it (or superadmins — checked in API layer).
 */
export function canModifySkill(
  skill: Skill,
  userId: string,
  orgId: string | null,
  userRole: string
): boolean {
  if (userRole === 'superadmin') return true

  switch (skill.scope) {
    case 'user':
      return skill.userId === userId
    case 'org':
      return !!orgId && skill.organizationId === orgId
        && ['owner', 'admin'].includes(userRole)
    case 'system':
    case 'package':
      return false // superadmin only
    default:
      return false
  }
}

/**
 * Returns system skills (scope='system') — used for agent default skills
 * and Toro suggestions.
 */
export async function getSystemSkills(): Promise<Skill[]> {
  const { data, error } = await supabaseAdmin
    .from('skills')
    .select('*')
    .eq('scope', 'system')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('title', { ascending: true })

  if (error) {
    logger.error('getSystemSkills failed', { error: error.message })
    return []
  }

  return (data ?? []).map((row) => mapSkill(row as Record<string, unknown>))
}
