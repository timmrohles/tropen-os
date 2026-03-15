'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { AppError } from '@/lib/errors'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addParticipantSchema,
  updateParticipantRoleSchema,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
} from '@/lib/validators/workspace'
import type { Workspace, WorkspaceParticipant } from '@/db/schema'
import type { WorkspaceWithDetails, WorkspaceMeta, ParticipantWithUser } from '@/types/workspace'

// ---------------------------------------------------------------------------
// Row mapper — Supabase snake_case → Drizzle camelCase
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWorkspace(row: any): Workspace {
  return {
    id: row.id,
    departmentId: row.department_id ?? null,
    title: row.title,
    description: row.description ?? null,
    domain: row.domain,
    goal: row.goal ?? null,
    templateId: row.template_id ?? null,
    meta: row.meta ?? {},
    createdBy: row.created_by ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParticipant(row: any): WorkspaceParticipant {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: new Date(row.joined_at),
  }
}

// ---------------------------------------------------------------------------
// Helper — check workspace exists and is not soft-deleted
// ---------------------------------------------------------------------------
async function requireWorkspace(id: string): Promise<Workspace> {
  const { data, error } = await supabaseAdmin
    .from('departments')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new AppError('DB_ERROR', error.message, 500)
  if (!data) throw new AppError('WORKSPACE_NOT_FOUND', `Workspace ${id} not found`, 404)

  return mapWorkspace(data)
}

// ---------------------------------------------------------------------------
// createWorkspace
// ---------------------------------------------------------------------------
export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const data = createWorkspaceSchema.parse(input)

  const { data: workspace, error } = await supabaseAdmin
    .from('departments')
    .insert({
      title: data.title,
      description: data.description ?? null,
      domain: data.domain,
      goal: data.goal ?? null,
      department_id: data.departmentId ?? null,
      template_id: data.templateId ?? null,
      meta: data.meta ?? {},
      created_by: data.createdBy,
    })
    .select()
    .single()

  if (error) throw new AppError('DB_ERROR', error.message, 500)

  // Insert creator as owner participant
  await supabaseAdmin.from('workspace_participants').insert({
    workspace_id: workspace.id,
    user_id: data.createdBy,
    role: 'owner',
  })

  // If a template is specified, create initial cards from its definition
  if (data.templateId) {
    const { data: template } = await supabaseAdmin
      .from('workspace_templates')
      .select('*')
      .eq('id', data.templateId)
      .maybeSingle()

    if (template?.definition) {
      const definition = template.definition as {
        cards?: Array<{
          type?: string
          title?: string
          description?: string
          status?: string
          model?: string
          position_x?: number
          position_y?: number
          fields?: unknown[]
          sort_order?: number
        }>
      }

      if (Array.isArray(definition.cards) && definition.cards.length > 0) {
        const cardRows = definition.cards.map((c, index) => ({
          workspace_id: workspace.id,
          type: c.type ?? 'input',
          title: c.title ?? `Card ${index + 1}`,
          description: c.description ?? null,
          status: c.status ?? 'waiting',
          model: c.model ?? 'claude',
          position_x: c.position_x ?? 0,
          position_y: c.position_y ?? index * 100,
          fields: c.fields ?? [],
          sort_order: c.sort_order ?? index,
          created_by: data.createdBy,
        }))

        await supabaseAdmin.from('cards').insert(cardRows)
      }
    }
  }

  return mapWorkspace(workspace)
}

// ---------------------------------------------------------------------------
// getWorkspace
// ---------------------------------------------------------------------------
export async function getWorkspace(id: string): Promise<WorkspaceWithDetails> {
  const workspace = await requireWorkspace(id)

  const { data: participantRows } = await supabaseAdmin
    .from('workspace_participants')
    .select('*')
    .eq('workspace_id', id)

  const participants: ParticipantWithUser[] = (participantRows ?? []).map((p) => ({
    ...mapParticipant(p),
    user: { id: p.user_id, name: null, email: '' },
  }))

  const { data: cardRows } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .order('sort_order')

  let department: { id: string; name: string } | null = null
  if (workspace.departmentId) {
    const { data: dept } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .eq('id', workspace.departmentId)
      .maybeSingle()
    department = dept ?? null
  }

  return {
    ...workspace,
    participants,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cards: (cardRows ?? []).map((c: any) => ({
      id: c.id,
      workspaceId: c.workspace_id,
      type: c.type,
      title: c.title,
      description: c.description ?? null,
      status: c.status,
      model: c.model ?? null,
      positionX: c.position_x,
      positionY: c.position_y,
      fields: c.fields ?? [],
      sortOrder: c.sort_order,
      createdBy: c.created_by ?? null,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
      deletedAt: c.deleted_at ? new Date(c.deleted_at) : null,
    })),
    department,
  }
}

// ---------------------------------------------------------------------------
// listWorkspaces
// ---------------------------------------------------------------------------
export async function listWorkspaces(
  userId: string,
  options?: {
    departmentId?: string
    domain?: 'marketing' | 'research' | 'learning' | 'legal' | 'product' | 'custom'
    limit?: number
    offset?: number
  }
): Promise<Workspace[]> {
  const { data: participations } = await supabaseAdmin
    .from('workspace_participants')
    .select('workspace_id')
    .eq('user_id', userId)

  if (!participations || participations.length === 0) return []

  const workspaceIds = participations.map((p) => p.workspace_id)

  let query = supabaseAdmin
    .from('departments')
    .select('*')
    .in('id', workspaceIds)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (options?.departmentId) {
    query = query.eq('department_id', options.departmentId)
  }
  if (options?.domain) {
    query = query.eq('domain', options.domain)
  }
  if (options?.limit !== undefined) {
    query = query.limit(options.limit)
  }
  if (options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1)
  }

  const { data, error } = await query
  if (error) throw new AppError('DB_ERROR', error.message, 500)

  return (data ?? []).map(mapWorkspace)
}

// ---------------------------------------------------------------------------
// updateWorkspace
// ---------------------------------------------------------------------------
export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput
): Promise<Workspace> {
  const data = updateWorkspaceSchema.parse(input)
  const existing = await requireWorkspace(id)

  const mergedMeta =
    data.meta === undefined
      ? (existing.meta as Record<string, unknown>)
      : { ...(existing.meta as Record<string, unknown>), ...data.meta }

  const updateValues: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    meta: mergedMeta,
  }
  if (data.title !== undefined) updateValues.title = data.title
  if (data.description !== undefined) updateValues.description = data.description
  if (data.goal !== undefined) updateValues.goal = data.goal

  const { data: updated, error } = await supabaseAdmin
    .from('departments')
    .update(updateValues)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new AppError('DB_ERROR', error.message, 500)
  return mapWorkspace(updated)
}

// ---------------------------------------------------------------------------
// deleteWorkspace (soft delete)
// ---------------------------------------------------------------------------
export async function deleteWorkspace(id: string): Promise<void> {
  await requireWorkspace(id)

  const { error } = await supabaseAdmin
    .from('departments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new AppError('DB_ERROR', error.message, 500)
}

// ---------------------------------------------------------------------------
// addParticipant
// ---------------------------------------------------------------------------
export async function addParticipant(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'editor' | 'reviewer' | 'viewer'
): Promise<WorkspaceParticipant> {
  addParticipantSchema.parse({ workspaceId, userId, role })

  const { data, error } = await supabaseAdmin
    .from('workspace_participants')
    .insert({ workspace_id: workspaceId, user_id: userId, role })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError(
        'PARTICIPANT_ALREADY_EXISTS',
        `User ${userId} is already a participant of workspace ${workspaceId}`,
        409
      )
    }
    throw new AppError('DB_ERROR', error.message, 500)
  }

  return mapParticipant(data)
}

// ---------------------------------------------------------------------------
// removeParticipant
// ---------------------------------------------------------------------------
export async function removeParticipant(workspaceId: string, userId: string): Promise<void> {
  const { count: ownerCount } = await supabaseAdmin
    .from('workspace_participants')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('role', 'owner')

  if ((ownerCount ?? 0) <= 1) {
    const { data: target } = await supabaseAdmin
      .from('workspace_participants')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle()

    if (target?.role === 'owner') {
      throw new AppError('LAST_OWNER_CANNOT_BE_REMOVED', 'Cannot remove the last owner', 400)
    }
  }

  const { error } = await supabaseAdmin
    .from('workspace_participants')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) throw new AppError('DB_ERROR', error.message, 500)
}

// ---------------------------------------------------------------------------
// updateParticipantRole
// ---------------------------------------------------------------------------
export async function updateParticipantRole(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'editor' | 'reviewer' | 'viewer'
): Promise<WorkspaceParticipant> {
  updateParticipantRoleSchema.parse({ workspaceId, userId, role })

  if (role !== 'owner') {
    const { data: target } = await supabaseAdmin
      .from('workspace_participants')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle()

    if (target?.role === 'owner') {
      const { count: ownerCount } = await supabaseAdmin
        .from('workspace_participants')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('role', 'owner')

      if ((ownerCount ?? 0) <= 1) {
        throw new AppError('LAST_OWNER_CANNOT_BE_REMOVED', 'Cannot demote the last owner', 400)
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_participants')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new AppError('DB_ERROR', error.message, 500)
  return mapParticipant(data)
}

// ---------------------------------------------------------------------------
// getWorkspaceMeta / updateWorkspaceMeta
// ---------------------------------------------------------------------------
export async function getWorkspaceMeta(id: string): Promise<WorkspaceMeta> {
  const workspace = await requireWorkspace(id)
  return (workspace.meta ?? {}) as WorkspaceMeta
}

export async function updateWorkspaceMeta(
  id: string,
  meta: Partial<WorkspaceMeta>
): Promise<WorkspaceMeta> {
  const workspace = await requireWorkspace(id)
  const mergedMeta: WorkspaceMeta = { ...(workspace.meta as WorkspaceMeta), ...meta }

  const { error } = await supabaseAdmin
    .from('departments')
    .update({ meta: mergedMeta, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new AppError('DB_ERROR', error.message, 500)
  return mergedMeta
}
