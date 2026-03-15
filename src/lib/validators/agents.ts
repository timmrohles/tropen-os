import { z } from 'zod'

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(100),
  description: z.string().max(500).optional(),
  system_prompt: z.string().max(10000).optional(),
  visibility: z.enum(['private', 'org']).default('private'),
})

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  system_prompt: z.string().max(10000).optional(),
  visibility: z.enum(['private', 'org']).optional(),
  display_order: z.number().int().optional(),
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>
