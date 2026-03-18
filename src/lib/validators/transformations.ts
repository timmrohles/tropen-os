import { z } from 'zod'

export const analyzeSchema = z.object({
  source_type: z.enum(['project', 'workspace']),
  source_id:   z.string().uuid(),
})

export const createTransformationSchema = z.object({
  source_type:    z.enum(['project', 'workspace']),
  source_id:      z.string().uuid(),
  target_type:    z.enum(['workspace', 'feed']),
  suggested_meta: z.record(z.string(), z.unknown()).optional(),
})

export const executeTransformationSchema = z.object({
  action: z.literal('execute'),
})

export type AnalyzeInput             = z.infer<typeof analyzeSchema>
export type CreateTransformationInput = z.infer<typeof createTransformationSchema>
