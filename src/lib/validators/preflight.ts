import { z } from 'zod'

export const pivotsSchema = z.object({
  buildTool: z.enum(['claude-code', 'cursor', 'lovable', 'bolt', 'other', 'unsure']),
  businessModel: z.enum(['b2c', 'b2b', 'internal', 'unsure']),
  audienceRegion: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  hosting: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  stack: z.string(),
})

export const preflightBody = z.object({
  input: z.string().min(1),
  pivots: pivotsSchema,
  name: z.string().trim().max(120).optional(),
})

export const renameProjectBody = z.object({
  name: z.string().trim().min(1).max(120),
})
