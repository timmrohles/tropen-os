// src/lib/fix-engine/schemas.ts
// Zod schemas for validating LLM output in the fix engine.
// All LLM responses must pass through these before reaching business logic.
import { z } from 'zod'

export const DiffHunkSchema = z.object({
  oldStart: z.number().int().nonnegative(),
  oldCount: z.number().int().nonnegative(),
  newStart: z.number().int().nonnegative(),
  newCount: z.number().int().nonnegative(),
  lines: z.array(z.string()),
})

export const FileDiffSchema = z.object({
  filePath: z.string().min(1),
  hunks: z.array(DiffHunkSchema),
})

export const FixLlmResponseSchema = z.object({
  explanation: z.string().min(1),
  confidence: z.enum(['high', 'medium', 'low']),
  diffs: z.array(FileDiffSchema),
})

export const JudgeResponseSchema = z.object({
  winnerProviderId: z.string().min(1),
  judgeExplanation: z.string().min(1),
  consensusLevel: z.enum(['unanimous', 'majority', 'split', 'single']),
})
