import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic as anthropicProvider } from '@/lib/llm/anthropic'
import { z } from 'zod'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { startBriefingSchema } from '@/lib/validators/workspace-plan-c'
import { createLogger } from '@/lib/logger'

const briefingProposalSchema = z.object({
  goal: z.string(),
  cards: z.array(z.object({
    title: z.string(),
    role: z.enum(['input', 'process', 'output']),
    content_type: z.string().optional(),
    description: z.string().optional(),
  })),
})

const log = createLogger('api:workspaces:briefing')
type Params = { params: Promise<{ id: string }> }

const BRIEFING_SYSTEM = `Du bist Toro, ein KI-Assistent von Tropen OS. Der User möchte einen neuen Workspace für eine komplexe Aufgabe anlegen.

Stelle maximal 4 kurze, gezielte Fragen um das Ziel, den Kontext, die Zielgruppe und das gewünschte Ergebnis zu verstehen.

Wenn du genug weißt, schlage eine Karten-Struktur vor im folgenden JSON-Format:
{
  "goal": "...",
  "cards": [
    { "title": "...", "role": "input|process|output", "content_type": "text|table|chart|list|code|map|mindmap|kanban|timeline|image|embed", "description": "..." }
  ]
}

Gib NUR das JSON aus wenn du bereit bist Karten vorzuschlagen — kein Text davor oder danach.
Antworte immer auf Deutsch.`

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, startBriefingSchema)
  if (valErr) return valErr

  try {
    const { text: content, usage } = await generateText({
      model: anthropicProvider('claude-sonnet-4-6'),
      maxOutputTokens: 1024,
      system: BRIEFING_SYSTEM,
      messages: [
        ...body.history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: body.message },
      ],
    })

    const tokenUsage = { input: usage.inputTokens, output: usage.outputTokens }

    // Detect JSON card proposal — validate shape before trusting the content
    let proposal = null
    try {
      const trimmed = content.trim()
      if (trimmed.startsWith('{') && trimmed.includes('"cards"')) {
        const parsed = JSON.parse(trimmed)
        const result = briefingProposalSchema.safeParse(parsed)
        if (result.success) proposal = result.data
      }
    } catch {
      // Not JSON — it's a follow-up question, that's fine
    }

    return NextResponse.json({ content, proposal, token_usage: tokenUsage })
  } catch (err) {
    log.error('[briefing] Anthropic call failed', { error: String(err) })
    return NextResponse.json({ error: 'Briefing-Anfrage fehlgeschlagen' }, { status: 500 })
  }
}
