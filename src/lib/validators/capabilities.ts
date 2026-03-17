import { z } from 'zod'

const uuidSchema = z.string().uuid()

export const resolveWorkflowInputSchema = z.object({
  capability_id:   uuidSchema,
  outcome_id:      uuidSchema,
  conversation_id: uuidSchema.optional(),
})
export type ResolveWorkflowInput = z.infer<typeof resolveWorkflowInputSchema>

export const patchSettingsInputSchema = z.object({
  capability_id:        uuidSchema,
  selected_model_id:    uuidSchema.optional().nullable(),
  preferred_outcome_id: uuidSchema.optional().nullable(),
  is_pinned:            z.boolean().optional(),
  sort_order:           z.number().int().min(0).optional(),
})
export type PatchSettingsInput = z.infer<typeof patchSettingsInputSchema>

export const patchOrgSettingsInputSchema = z.object({
  capability_id:     uuidSchema,
  is_enabled:        z.boolean().optional(),
  allowed_model_ids: z.array(uuidSchema).optional(),
  default_model_id:  uuidSchema.optional().nullable(),
  user_can_override: z.boolean().optional(),
})
export type PatchOrgSettingsInput = z.infer<typeof patchOrgSettingsInputSchema>
