import { type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/api/workspaces'
import { validateBody } from '@/lib/validators'
import { z } from 'zod'
import { getOpenAI } from '@/lib/llm/openai'
import { createLogger } from '@/lib/logger'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'

const logger = createLogger('tts')

const schema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).default('nova'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: body, error: valErr } = await validateBody(req, schema)
    if (valErr) return valErr

    const budget = await checkBudget(user.organization_id, 'tts')
    if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

    // Markdown bereinigen vor TTS
    const cleanText = body.text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/^\s*\d+\.\s/gm, '')
      .trim()

    if (!cleanText) {
      return new Response('Kein sprechbarer Text', { status: 422 })
    }

    logger.info('TTS request', { textLength: cleanText.length, voice: body.voice, userId: user.id })

    const openai = getOpenAI()
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: body.voice,
      input: cleanText,
      response_format: 'mp3',
      speed: 1.0,
    })

    const audioBuffer = await response.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error('TTS failed', { error })
    return new Response('TTS fehlgeschlagen', { status: 500 })
  }
}
