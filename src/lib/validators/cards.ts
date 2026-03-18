import { z } from 'zod'

export const cardFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  updatedAt: z.string(), // ISO timestamp
})

export const createCardSchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(['input', 'process', 'output']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['draft', 'ready', 'stale', 'processing', 'error']).optional().default('draft'),
  model: z.string().optional().default('claude'),
  positionX: z.number().optional().default(0),
  positionY: z.number().optional().default(0),
  fields: z.array(cardFieldSchema).optional().default([]),
  sortOrder: z.number().optional(),
  createdBy: z.string().uuid().optional(),
})

export const updateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'ready', 'stale', 'processing', 'error']).optional(),
  model: z.string().optional(),
  fields: z.array(cardFieldSchema).optional(),
  sortOrder: z.number().optional(),
})

export type CardFieldInput = z.infer<typeof cardFieldSchema>
export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
