export const maxDuration = 60
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { withAuth } from '@/lib/auth/route-guards'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { modelFor } from '@/lib/model-selector'
import { buildChipsPrompt, parseChipsResponse } from './chips-prompt'
import { createLogger } from '@/lib/logger'

const log = createLogger('generate-chips')

export const POST = withAuth(async (req, { auth }) => {
  const budget = await checkBudget(auth.organization_id, 'claude-haiku')
  if (!budget.allowed) return budgetExhaustedResponse()

  let lastMessage: string
  try {
    const body = await req.json() as { lastMessage: string }
    lastMessage = body.lastMessage
    if (!lastMessage?.trim()) throw new Error('missing lastMessage')
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const { text } = await generateText({
      model: anthropic(modelFor('chips')),
      prompt: buildChipsPrompt(lastMessage),
      maxOutputTokens: 256,
    })
    const chips = parseChipsResponse(text)
    return NextResponse.json({ chips })
  } catch (err) {
    log.error('chips generation failed', { error: String(err) })
    return NextResponse.json({ chips: [] }) // graceful degradation
  }
})
