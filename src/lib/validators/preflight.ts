import { z } from 'zod'

export const preflightBody = z.object({
  input: z.string().min(1),
})
