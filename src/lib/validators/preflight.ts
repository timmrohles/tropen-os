import { z } from 'zod'

export const pivotsSchema = z.object({
  buildTool: z.enum(['claude-code', 'cursor', 'lovable', 'bolt', 'other']),
  businessModel: z.enum(['b2c', 'b2b', 'internal']),
  audienceRegion: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  hosting: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  stack: z.string(),
})

export const preflightBody = z.object({
  input: z.string().min(1),
  pivots: pivotsSchema,
})
