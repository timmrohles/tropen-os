import { z } from 'zod'

// Enum values mirrored from schema — keep in sync with workspaceDomainEnum / participantRoleEnum
const workspaceDomainValues = [
  'marketing',
  'research',
  'learning',
  'legal',
  'product',
  'custom',
] as const

const participantRoleValues = [
  'owner',
  'editor',
  'reviewer',
  'viewer',
] as const

// ---------------------------------------------------------------------------
// createWorkspaceSchema
// ---------------------------------------------------------------------------
export const createWorkspaceSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  domain: z.enum(workspaceDomainValues),
  goal: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string().uuid(),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>

// ---------------------------------------------------------------------------
// updateWorkspaceSchema
// ---------------------------------------------------------------------------
export const updateWorkspaceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  goal: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>

// ---------------------------------------------------------------------------
// addParticipantSchema
// ---------------------------------------------------------------------------
export const addParticipantSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(participantRoleValues),
})

export type AddParticipantInput = z.infer<typeof addParticipantSchema>

// ---------------------------------------------------------------------------
// updateParticipantRoleSchema
// ---------------------------------------------------------------------------
export const updateParticipantRoleSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(participantRoleValues),
})

export type UpdateParticipantRoleInput = z.infer<typeof updateParticipantRoleSchema>
