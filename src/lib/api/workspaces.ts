// src/lib/api/workspaces.ts
// Auth + access helpers for workspace API routes.
// Uses supabaseAdmin for server-side checks.

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { OrgRole } from '@/lib/types'
import { WorkspacePlanC } from '@/types/workspace-plan-c.types'

export type AuthUser = { id: string; organization_id: string; role: OrgRole | 'superadmin' }

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role }
}

// Returns true if user is a participant in the workspace (any role).
// Superadmins bypass all workspace checks.
export async function canReadWorkspace(
  workspaceId: string,
  me: AuthUser
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data } = await supabaseAdmin
    .from('workspace_participants')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', me.id)
    .maybeSingle()
  return !!data
}

// Returns true if user is admin or member (can write).
export async function canWriteWorkspace(
  workspaceId: string,
  me: AuthUser
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data } = await supabaseAdmin
    .from('workspace_participants')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', me.id)
    .maybeSingle()
  return !!data && ['admin', 'member'].includes(data.role)
}

// Returns the workspace row if it exists, is not deleted, and user can access it.
// Returns null if not found or no access.
export async function requireWorkspaceAccess(
  workspaceId: string,
  me: AuthUser
): Promise<WorkspacePlanC | null> {
  if (me.role !== 'superadmin') {
    const allowed = await canReadWorkspace(workspaceId, me)
    if (!allowed) return null
  }
  const { data } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()
  return data as unknown as WorkspacePlanC
}
