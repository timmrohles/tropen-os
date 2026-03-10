import { NextRequest } from 'next/server'
import OpenAI from 'openai'

// ─── Rate Limiting (in-memory, per IP) ────────────────────────────────────────
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 60 * 1000

const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Zu viele Anfragen. Bitte später nochmal versuchen.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

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

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
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
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream-Fehler' })}\n\n`)
        )
      } finally {
        controller.close()
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
