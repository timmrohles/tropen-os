import { z } from 'zod'

export const createPromptTemplateSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(255),
  content: z.string().min(1, 'Content erforderlich').max(10000),
  is_shared: z.boolean().default(false),
})

export const updatePromptTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().min(1).max(10000).optional(),
  is_shared: z.boolean().optional(),
})

export type CreatePromptTemplateInput = z.infer<typeof createPromptTemplateSchema>
export type UpdatePromptTemplateInput = z.infer<typeof updatePromptTemplateSchema>
