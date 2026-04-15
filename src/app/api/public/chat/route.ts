export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/llm/openai'
import { routeRequest } from '@/lib/llm/router'
import { logRoutingDecision } from '@/lib/qa/routing-logger'

// ─── Prompt Injection Detection ───────────────────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore (all |previous |above )?(instructions|rules|prompts)/i,
  /system\s*prompt/i,
  /jailbreak/i,
  /\bDAN\b/,
  /act as (an? )?(unrestricted|uncensored|evil|different|new)/i,
  /forget (all |your |previous )?instructions/i,
  /you are now [^T]/i,
  /pretend (you are|to be)/i,
  /developer\s*mode/i,
]

function detectInjection(message: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(message))
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Du bist Toro 🦜, der KI-Papagei von Tropen OS. Du befindest dich auf der öffentlichen Startseite von Tropen OS und hilfst Besuchern, das Produkt kennenzulernen.

Tropen OS ist ein Responsible AI Workspace für den Mittelstand: transparente KI-Nutzung mit vollständiger Kostenkontrolle, Team-Workspaces mit Rollen und Einladungen, AI Act-konform (EU), Budgets setzen und Modelle freigeben. Der KI-Papagei Toro wählt automatisch das richtige Modell für jede Aufgabe.

Regeln:
- Antworte auf Deutsch (außer der User schreibt Englisch, dann auf Englisch)
- Sei freundlich, direkt und prägnant — maximal 4-5 Sätze, außer bei komplexen Fragen
- Du hast KEINEN Zugriff auf interne Nutzerdaten, Accounts oder Unternehmens-Informationen
- Du kannst keine Dateien verarbeiten oder zwischen Sessions dich erinnern
- Wenn du etwas nicht weißt, sag es ehrlich
- Du bist ein Vorschau-Toro — der echte Toro im Workspace kann viel mehr`

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let message: string
  let history: { role: 'user' | 'assistant'; content: string }[]
  try {
    const body = await req.json()
    message = String(body.message ?? '').trim()
    history = Array.isArray(body.history) ? body.history : []
  } catch {
    return new Response(
      JSON.stringify({ error: 'Ungültiger Request.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!message || message.length > 2000) {
    return new Response(
      JSON.stringify({ error: 'Nachricht fehlt oder zu lang.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (detectInjection(message)) {
    return new Response(
      JSON.stringify({ error: 'Diese Eingabe kann ich nicht verarbeiten.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const safeHistory = history.slice(-10)
    .filter((m) => !detectInjection(String(m.content)))
    .map((m): { role: 'user' | 'assistant'; content: string } => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 1000),
    }))

  const { taskType, routingReason } = await routeRequest(message)
  const callStart = Date.now()

  const stream = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    stream: true,
    max_tokens: 600,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory,
      { role: 'user', content: message },
    ],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''
          if (delta) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
            )
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
        logRoutingDecision({
          taskType,
          modelSelected: DEFAULT_MODEL,
          routingReason,
          latencyMs: Date.now() - callStart,
          status: 'success',
        })
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream-Fehler' })}\n\n`)
        )
        controller.close()
        logRoutingDecision({
          taskType,
          modelSelected: DEFAULT_MODEL,
          routingReason,
          latencyMs: Date.now() - callStart,
          status: 'error',
          errorMessage: 'Stream error',
        })
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
