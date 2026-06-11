import { NextResponse } from 'next/server'
import { validateBody } from '@/lib/validators'
import { getOpenAI } from '@/lib/llm/openai'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

const schema = z.object({
  prompt: z.string().min(1).max(1000),
})

export const POST = withAuth(async (req, { auth }) => {
  try {
    const { data: body, error: valErr } = await validateBody(req, schema)
    if (valErr) return valErr

    const budget = await checkBudget(auth.organization_id, 'dall-e-3')
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
    return apiError(err)
  }
})
