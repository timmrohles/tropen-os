// src/lib/llm/openai.ts
// Einziger Ort wo der OpenAI Client instanziiert wird.
// LangSmith-Tracing ist transparent eingebaut — kein Umbau der Call-Sites nötig.

import OpenAI from 'openai'
import { wrapOpenAI } from 'langsmith/wrappers'

const isTracingEnabled =
  process.env.LANGSMITH_TRACING === 'true' && !!process.env.LANGSMITH_API_KEY

if (!process.env.LANGSMITH_API_KEY && process.env.NODE_ENV === 'production') {
  console.error('[LangSmith] LANGSMITH_API_KEY fehlt — LLM-Calls werden nicht getrackt')
} else if (!process.env.LANGSMITH_API_KEY) {
  console.warn('[LangSmith] API Key nicht gesetzt — Tracing deaktiviert')
}

const baseClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// wrapOpenAI ist ein No-Op wenn LANGSMITH_TRACING nicht aktiv
export const openai = isTracingEnabled ? wrapOpenAI(baseClient) : baseClient

// Modell-Konstante — ein einziger Ort für Modell-Änderungen
export const DEFAULT_MODEL = 'gpt-4o-mini' as const
