// src/lib/memory/memory-extractor.ts
// Extracts structured memory entries from a conversation using claude-haiku.
// Called by POST /api/conversations/[id]/extract-memory (fire-and-forget).

import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'

const HAIKU_MODEL = 'claude-haiku-4.5'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ExtractedMemory {
  type: 'insight' | 'decision' | 'open_question' | 'summary' | 'fact'
  content: string
  importance: 'high' | 'medium' | 'low'
  tags: string[]
}

export interface ExtractionResult {
  memories: ExtractedMemory[]
  tokensInput: number
  tokensOutput: number
  skipped: boolean
}

// ─── Prompt ────────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `Du bist ein präziser Assistent der wichtige Erkenntnisse aus Gesprächen extrahiert.

Analysiere die folgende Konversation und extrahiere bis zu 5 der wichtigsten Punkte.

Kategorien:
- insight: Neue Erkenntnis oder Zusammenhang
- decision: Getroffene Entscheidung oder Festlegung
- open_question: Offene Frage oder ungeklärtes Thema
- summary: Kernzusammenfassung eines komplexen Themas
- fact: Konkretes Datum, Zahl oder überprüfbare Information

Regeln:
- Extrahiere nur inhaltlich bedeutsame Punkte (kein Small-Talk, keine Begrüßungen)
- Maximal 5 Einträge — lieber weniger aber präzise
- Jeder Eintrag: 1–2 prägnante Sätze
- Wenn nichts Bedeutsames vorhanden: leeres Array zurückgeben

Antworte NUR mit validem JSON (kein Markdown, kein Kommentar):
{
  "memories": [
    {
      "type": "insight|decision|open_question|summary|fact",
      "content": "Prägnante Beschreibung",
      "importance": "high|medium|low",
      "tags": ["schlagwort1", "schlagwort2"]
    }
  ]
}`

// ─── Hash ──────────────────────────────────────────────────────────────────

/**
 * Deterministic hash of conversation content for deduplication.
 * Uses Web Crypto API (available in Node.js 18+).
 */
export async function hashContent(messages: ConversationMessage[]): Promise<string> {
  const text = messages.map((m) => `${m.role}:${m.content}`).join('\n')
  const encoded = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Extractor ─────────────────────────────────────────────────────────────

/**
 * Extracts structured memory entries from a list of conversation messages.
 * Returns skipped=true if the conversation has no meaningful content.
 */
export async function extractMemoryFromConversation(
  messages: ConversationMessage[]
): Promise<ExtractionResult> {
  // Skip trivial conversations (< 2 turns or very short content)
  const totalChars = messages.reduce((s, m) => s + m.content.length, 0)
  if (messages.length < 2 || totalChars < 200) {
    return { memories: [], tokensInput: 0, tokensOutput: 0, skipped: true }
  }

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Toro'}: ${m.content}`)
    .join('\n\n')

  const { text, usage } = await generateText({
    model: anthropic(HAIKU_MODEL),
    system: EXTRACTION_PROMPT,
    messages: [{ role: 'user', content: conversationText }],
    maxOutputTokens: 1024,
    temperature: 0.1,
  })

  const tokensInput = usage?.inputTokens ?? 0
  const tokensOutput = usage?.outputTokens ?? 0

  let parsed: { memories: ExtractedMemory[] }
  try {
    parsed = JSON.parse(text.trim()) as { memories: ExtractedMemory[] }
  } catch {
    return { memories: [], tokensInput, tokensOutput, skipped: false }
  }

  const validTypes = ['insight', 'decision', 'open_question', 'summary', 'fact'] as const
  const validImportance = ['high', 'medium', 'low'] as const

  const memories = (parsed.memories ?? [])
    .filter(
      (m) =>
        validTypes.includes(m.type as typeof validTypes[number]) &&
        typeof m.content === 'string' &&
        m.content.trim().length > 10
    )
    .map((m) => ({
      type: m.type as ExtractedMemory['type'],
      content: m.content.trim().slice(0, 500),
      importance: validImportance.includes(m.importance as typeof validImportance[number])
        ? (m.importance as ExtractedMemory['importance'])
        : 'medium',
      tags: Array.isArray(m.tags)
        ? m.tags.filter((t) => typeof t === 'string').slice(0, 5)
        : [],
    }))
    .slice(0, 5)

  return { memories, tokensInput, tokensOutput, skipped: false }
}
