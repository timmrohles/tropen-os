export const ASSIGNABLE_ROLES = ['owner', 'admin', 'member', 'viewer'] as const
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export const ALL_ROLES = ['superadmin', 'owner', 'admin', 'member', 'viewer'] as const
export type Role = (typeof ALL_ROLES)[number]

export function isAssignableRole(role: unknown): role is AssignableRole {
  return typeof role === 'string' && (ASSIGNABLE_ROLES as readonly string[]).includes(role)
}
