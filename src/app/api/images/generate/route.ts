import { type NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/workspaces'
import { validateBody } from '@/lib/validators'
import { getOpenAI } from '@/lib/llm/openai'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { z } from 'zod'

const schema = z.object({
  prompt: z.string().min(1).max(1000),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { data: body, error: valErr } = await validateBody(req, schema)
    if (valErr) return valErr

    const budget = await checkBudget(user.organization_id, 'dall-e-3')
    if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

    const openai = getOpenAI()
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: body.prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    const imageUrl = response.data?.[0]?.url
    const revisedPrompt = response.data?.[0]?.revised_prompt ?? body.prompt

    if (!imageUrl) return NextResponse.json({ error: 'Keine Bild-URL erhalten' }, { status: 500 })

    return NextResponse.json({ imageUrl, revisedPrompt })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
