import { type NextRequest } from 'next/server'
import { transform } from 'sucrase'

export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code: string }
  if (!code || typeof code !== 'string') {
    return Response.json({ error: 'code required' }, { status: 400 })
  }
  try {
    const result = transform(code, {
      transforms: ['jsx', 'typescript'],
      jsxRuntime: 'classic',
      production: true,
    })
    return Response.json({ code: result.code })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 422 })
  }
}
