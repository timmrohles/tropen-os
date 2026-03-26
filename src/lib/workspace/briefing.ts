import Anthropic from '@anthropic-ai/sdk'
import { createLogger } from '@/lib/logger'

const log = createLogger('lib/workspace/briefing')
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface BriefingInput {
  goal: string
  baseline: string
  complexity: string
  collaboration: string
}

export interface CardSuggestion {
  title: string
  card_type: 'input' | 'process' | 'output'
  description: string
}

export async function generateCardSuggestions(
  input: BriefingInput,
): Promise<CardSuggestion[]> {
  const userPrompt = `Ziel: ${input.goal}
Ausgangslage: ${input.baseline}
Komplexität: ${input.complexity}
Zusammenarbeit: ${input.collaboration}`

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `Du bist Toro, der KI-Assistent von Tropen OS.
Basierend auf den Angaben des Users schlägst du 3–5 Workspace-Karten vor.
Antworte AUSSCHLIESSLICH als reines JSON-Array. Kein Text davor oder danach. Keine Backticks. Kein Markdown.
Beispiel:
[{"title":"Briefing","card_type":"input","description":"Ausgangsinformationen sammeln"},{"title":"Analyse","card_type":"process","description":"Daten auswerten"}]`,
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (apiErr) {
    log.error('[briefing] Anthropic API error:', apiErr)
    throw apiErr
  }

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  const validate = (arr: unknown[]): CardSuggestion[] =>
    arr.filter(
      (c): c is CardSuggestion =>
        typeof (c as CardSuggestion).title === 'string' &&
        ['input', 'process', 'output'].includes((c as CardSuggestion).card_type) &&
        typeof (c as CardSuggestion).description === 'string',
    )

  // Direct parse
  try {
    const parsed = JSON.parse(text) as unknown[]
    return validate(parsed)
  } catch { /* fall through */ }

  // Fallback: extract JSON array from within text (handles backtick-wrapped responses)
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    try {
      return validate(JSON.parse(match[0]) as unknown[])
    } catch { /* fall through */ }
  }

  log.error('[briefing] Could not parse JSON from response. Raw text:', text)
  return []
}
