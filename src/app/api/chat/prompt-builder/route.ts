import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { modelFor } from '@/lib/model-selector'
import { buildBuilderStep } from './builder-prompt'
import { createLogger } from '@/lib/logger'

const log = createLogger('prompt-builder')

interface BuilderMessage { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let originalPrompt: string
  let history: BuilderMessage[]
  try {
    const body = await req.json() as { originalPrompt: string; history: BuilderMessage[] }
    originalPrompt = body.originalPrompt
    history = body.history ?? []
    if (!originalPrompt?.trim()) throw new Error('missing originalPrompt')
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const prompt = buildBuilderStep({ originalPrompt, history })

  try {
    const { text } = await generateText({
      model: anthropic(modelFor('prompt_builder')),
      prompt,
      maxOutputTokens: 512,
    })

    // Check if this is a final prompt response
    try {
      const parsed = JSON.parse(text) as { type?: string; prompt?: string }
      if (parsed.type === 'final' && parsed.prompt) {
        return NextResponse.json({ type: 'final', refinedPrompt: parsed.prompt })
      }
    } catch {
      // Not JSON — it's a clarifying question
    }

    return NextResponse.json({ type: 'question', message: text })
  } catch (err) {
    log.error('prompt-builder step failed', { error: String(err) })
    return NextResponse.json({ error: 'Step failed' }, { status: 500 })
  }
}
