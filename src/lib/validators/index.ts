import { z, ZodSchema } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Returns { data } on success, { error: NextResponse } on failure.
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
    return {
      data: null,
      error: NextResponse.json({ error: 'Validierungsfehler', details: messages }, { status: 400 }),
    }
  }

  return { data: result.data, error: null }
}
