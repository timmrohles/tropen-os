import { z } from 'zod'

export const createArtifactSchema = z.object({
  conversationId: z.string().uuid('conversationId muss eine UUID sein'),
  organizationId: z.string().uuid('organizationId muss eine UUID sein'),
  name: z.string().min(1, 'Name erforderlich').max(255),
  type: z.enum(['code', 'table', 'document', 'list', 'react', 'data', 'image', 'other']),
  language: z.string().max(50).optional(),
  content: z.string().min(1, 'Content erforderlich').max(500000),
  messageId: z.string().uuid().optional(),
})

export type CreateArtifactInput = z.infer<typeof createArtifactSchema>
