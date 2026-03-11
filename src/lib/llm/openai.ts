// src/lib/llm/openai.ts
// Einziger Ort wo der OpenAI Client instanziiert wird.
// LangSmith-Tracing ist transparent eingebaut — kein Umbau der Call-Sites nötig.

import OpenAI from 'openai'

if (!process.env.LANGSMITH_API_KEY && process.env.NODE_ENV === 'production') {
  console.error('[LangSmith] LANGSMITH_API_KEY fehlt — LLM-Calls werden nicht getrackt')
} else if (!process.env.LANGSMITH_API_KEY) {
  console.warn('[LangSmith] API Key nicht gesetzt — Tracing deaktiviert')
}

// Direkte OpenAI-Instanz — kein wrapOpenAI, da es bei Streaming-Responses
// den ersten Call bricht (LangSmith-Tracer nicht rechtzeitig initialisiert).
// LLM-Calls erscheinen trotzdem in LangSmith als Kind-Span von routeRequest (traceable).
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Modell-Konstante — ein einziger Ort für Modell-Änderungen
export const DEFAULT_MODEL = 'gpt-4o-mini' as const
