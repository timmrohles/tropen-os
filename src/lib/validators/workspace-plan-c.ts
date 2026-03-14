// src/lib/validators/workspace-plan-c.ts
import { z } from 'zod'

export const createWorkspacePlanCSchema = z.object({
  title: z.string().min(1).max(255),
  goal: z.string().optional(),
  domain: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type CreateWorkspacePlanCInput = z.infer<typeof createWorkspacePlanCSchema>

export const updateWorkspacePlanCSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  goal: z.string().optional(),
  domain: z.string().optional(),
  status: z.enum(['draft','active','exported','locked']).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type UpdateWorkspacePlanCInput = z.infer<typeof updateWorkspacePlanCSchema>

export const createCardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  contentType: z.enum(['text','table','chart','list','code','map','mindmap','kanban','timeline','image','embed']).default('text'),
  role: z.enum(['input','process','output']),
  content: z.record(z.string(), z.unknown()).optional(),
  chartConfig: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type CreateCardInput = z.infer<typeof createCardSchema>

export const updateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  contentType: z.enum(['text','table','chart','list','code','map','mindmap','kanban','timeline','image','embed']).optional(),
  role: z.enum(['input','process','output']).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  chartConfig: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft','ready','stale','processing','error']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  changeReason: z.string().optional(),
})
export type UpdateCardInput = z.infer<typeof updateCardSchema>

export const createConnectionSchema = z.object({
  sourceCardId: z.string().uuid(),
  targetCardId: z.string().uuid(),
  label: z.string().optional(),
})
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>

export const createAssetSchema = z.object({
  type: z.enum(['image','chart','link','upload','video']),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  cardId: z.string().uuid().optional(),
  size: z.number().int().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type CreateAssetInput = z.infer<typeof createAssetSchema>

export const sendChatMessageSchema = z.object({
  content: z.string().min(1),
  cardId: z.string().uuid().optional(),
})
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>

export const startBriefingSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user','assistant']),
    content: z.string(),
  })).optional().default([]),
})
export type StartBriefingInput = z.infer<typeof startBriefingSchema>

export const exportWorkspaceSchema = z.object({
  format: z.enum(['chat','word','pdf','markdown','presentation']),
})
export type ExportWorkspaceInput = z.infer<typeof exportWorkspaceSchema>
