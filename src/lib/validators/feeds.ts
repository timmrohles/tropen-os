// src/lib/validators/feeds.ts
import { z } from 'zod'

export const createFeedSourceSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['rss', 'email', 'api', 'url']),
  url: z.string().url().optional(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  keywordsInclude: z.array(z.string()).optional().default([]),
  keywordsExclude: z.array(z.string()).optional().default([]),
  domainsAllow: z.array(z.string()).optional().default([]),
  minScore: z.number().int().min(1).max(10).optional().default(6),
  schemaId: z.string().uuid().optional(),
})
export type CreateFeedSourceInput = z.infer<typeof createFeedSourceSchema>

export const updateFeedSourceSchema = createFeedSourceSchema.partial().extend({
  isActive: z.boolean().optional(),
})
export type UpdateFeedSourceInput = z.infer<typeof updateFeedSourceSchema>

export const createFeedSchemaSchema = z.object({
  name: z.string().min(1).max(255),
  sourceType: z.enum(['api', 'url']),
  mapping: z.record(z.string(), z.string()),
  sampleResponse: z.record(z.string(), z.unknown()).optional(),
})
export type CreateFeedSchemaInput = z.infer<typeof createFeedSchemaSchema>

export const updateItemStatusSchema = z.object({
  status: z.enum(['unread', 'read', 'saved', 'archived', 'deleted', 'not_relevant']),
})

export const injectItemSchema = z.object({
  targetType: z.enum(['project', 'workspace']),
  targetId: z.string().uuid(),
})

export const createDistributionSchema = z.object({
  sourceId: z.string().uuid(),
  targetType: z.enum(['project', 'workspace']),
  targetId: z.string().uuid(),
  autoInject: z.boolean().optional().default(true),
  minScore: z.number().int().min(1).max(10).optional().default(7),
})
export type CreateDistributionInput = z.infer<typeof createDistributionSchema>

// API-Datenquellen
export const createDataSourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  url: z.string().url(),
  method: z.enum(['GET', 'POST']).optional().default('GET'),
  auth_type: z.enum(['none', 'bearer', 'api_key', 'basic']).optional(),
  auth_config: z.record(z.string(), z.string()).optional().default({}),
  request_headers: z.record(z.string(), z.string()).optional().default({}),
  request_body: z.string().optional(),
  fetch_interval: z
    .number()
    .int()
    .refine((v) => v === 0 || v >= 300, { message: 'Mindestens 300 Sekunden (5 Minuten) oder 0 (manuell)' })
    .refine((v) => v <= 86400, { message: 'Maximal 86400 Sekunden (1 Tag)' })
    .optional()
    .default(3600),
  schema_path: z.string().optional(),
})
export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>

export const updateDataSourceSchema = createDataSourceSchema.partial().extend({
  is_active: z.boolean().optional(),
})
export type UpdateDataSourceInput = z.infer<typeof updateDataSourceSchema>

// Email inbound webhook from Resend
export const emailInboundSchema = z.object({
  to: z.array(z.object({ email: z.string() })),
  from: z.object({ email: z.string(), name: z.string().optional() }),
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
})
export type EmailInboundPayload = z.infer<typeof emailInboundSchema>
