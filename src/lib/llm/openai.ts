// src/lib/llm/openai.ts
// Einziger Ort wo der OpenAI Client instanziiert wird.
// LangSmith-Tracing ist transparent eingebaut — kein Umbau der Call-Sites nötig.

import OpenAI from 'openai'
import { createLogger } from '@/lib/logger'

const log = createLogger('llm/openai')

if (!process.env.LANGSMITH_API_KEY && process.env.NODE_ENV === 'production') {
  log.error('[LangSmith] LANGSMITH_API_KEY fehlt — LLM-Calls werden nicht getrackt')
} else if (!process.env.LANGSMITH_API_KEY) {
  log.warn('[LangSmith] API Key nicht gesetzt — Tracing deaktiviert')
}

// Lazy-init: avoid module-level throw at build time when OPENAI_API_KEY is absent.
// LLM-Calls erscheinen trotzdem in LangSmith als Kind-Span von routeRequest (traceable).
let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

/** @deprecated Use getOpenAI() for lazy initialization */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return getOpenAI()[prop as keyof OpenAI]
  },
})

// Modell-Konstante — ein einziger Ort für Modell-Änderungen
export const DEFAULT_MODEL = 'gpt-4o-mini' as const
