import { z } from 'zod'

const uuid = z.string().uuid()

export const WorkflowContext = z.enum([
  'new_chat',
  'new_project',
  'after_search',
  'explicit',
])
export type WorkflowContextType = z.infer<typeof WorkflowContext>

export const detectInputSchema = z.object({
  message:        z.string().min(10),
  context:        WorkflowContext,
  userId:         uuid,
  projectId:      uuid.optional(),
  conversationId: uuid.optional(),
})
export type DetectInput = z.infer<typeof detectInputSchema>

export const resolveInputSchema = z.object({
  workflowId:         uuid,
  optionId:           uuid,
  previousSelections: z.array(uuid).optional().default([]),
  conversationId:     uuid.optional(),
})
export type ResolveInput = z.infer<typeof resolveInputSchema>

export const patchGuidedSettingsSchema = z.object({
  guided_enabled:      z.boolean().optional(),
  auto_trigger:        z.boolean().optional(),
  new_project_trigger: z.boolean().optional(),
})
export type PatchGuidedSettings = z.infer<typeof patchGuidedSettingsSchema>

export const createWorkflowSchema = z.object({
  title:            z.string().min(1).max(200),
  subtitle:         z.string().max(200).optional(),
  trigger_keywords: z.array(z.string()).optional(),
  trigger_contexts: z.array(WorkflowContext).optional(),
  is_active:        z.boolean().optional().default(true),
  sort_order:       z.number().int().min(0).optional().default(0),
})
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>

export const patchWorkflowSchema = createWorkflowSchema.partial()
export type PatchWorkflowInput = z.infer<typeof patchWorkflowSchema>
