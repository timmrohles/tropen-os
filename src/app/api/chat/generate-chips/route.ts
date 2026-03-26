import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { modelFor } from '@/lib/model-selector'
import { buildChipsPrompt, parseChipsResponse } from './chips-prompt'
import { createLogger } from '@/lib/logger'

const log = createLogger('generate-chips')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
}
