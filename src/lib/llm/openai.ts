// src/lib/llm/openai.ts
// Einziger Ort wo der OpenAI Client instanziiert wird.
// Alle anderen Files importieren von hier.

import OpenAI from 'openai'

const heliconeApiKey = process.env.HELICONE_API_KEY

if (!heliconeApiKey && process.env.NODE_ENV === 'production') {
  console.error('[Helicone] HELICONE_API_KEY fehlt — LLM-Calls werden nicht getrackt')
} else if (!heliconeApiKey) {
  console.warn('[Helicone] HELICONE_API_KEY nicht gesetzt — Calls laufen direkt zu OpenAI')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Mit Helicone: Proxy-URL statt direkter OpenAI-Endpoint
  // Ohne HELICONE_API_KEY: direkt zu OpenAI (Fallback)
  baseURL: heliconeApiKey ? 'https://oai.helicone.ai/v1' : undefined,
  defaultHeaders: heliconeApiKey
    ? {
        'Helicone-Auth': `Bearer ${heliconeApiKey}`,
        // Custom Properties — erscheinen im Helicone Dashboard als Filter
        'Helicone-Property-App': 'tropen-ai',
        'Helicone-Property-Environment': process.env.NODE_ENV ?? 'development',
      }
    : undefined,
})

// Modell-Konstante — ein einziger Ort für Modell-Änderungen
export const DEFAULT_MODEL = 'gpt-4o-mini' as const
