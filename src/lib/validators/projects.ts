import { z } from 'zod'

export const createProjectSchema = z.object({
  department_id: z.string().uuid('department_id muss eine UUID sein'),
  title: z.string().min(1, 'Titel erforderlich').max(255),
  goal: z.string().max(2000).optional(),
  instructions: z.string().max(5000).optional(),
})

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  goal: z.string().max(2000).optional(),
  instructions: z.string().max(5000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
