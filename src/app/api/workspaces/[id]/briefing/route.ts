import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { startBriefingSchema } from '@/lib/validators/workspace-plan-c'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:briefing')
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: BRIEFING_SYSTEM,
      messages: [
        ...body.history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: body.message },
      ],
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    const tokenUsage = { input: response.usage.input_tokens, output: response.usage.output_tokens }

    // Detect JSON card proposal
    let proposal = null
    try {
      const trimmed = content.trim()
      if (trimmed.startsWith('{') && trimmed.includes('"cards"')) {
        proposal = JSON.parse(trimmed)
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
