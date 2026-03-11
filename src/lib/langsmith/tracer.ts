// src/lib/langsmith/tracer.ts
// Hilfsfunktionen für strukturiertes Tracing

import { Client } from 'langsmith'
import { traceable } from 'langsmith/traceable'

// LangSmith Client — singleton
let _client: Client | null = null

export function getLangSmithClient(): Client | null {
  if (!process.env.LANGSMITH_API_KEY) return null
  if (!_client) {
    _client = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      // DSGVO Art. 10: Prompts und Completions NICHT in LangSmith Cloud loggen.
      // Nur Metadaten (Latenz, Token-Count, Task-Type) werden übertragen.
      hideInputs: true,
      hideOutputs: true,
    })
  }
  return _client
}

// traceable-Wrapper für eigene Funktionen
// Macht Routing-Logik als eigener Span sichtbar in LangSmith
export { traceable }

// Metadaten die bei jedem Trace mitgeschickt werden
export function getTraceMetadata(taskType: string, routingReason: string) {
  return {
    project_name: process.env.LANGSMITH_PROJECT ?? 'tropen-ai',
    metadata: {
      app: 'tropen-ai',
      environment: process.env.NODE_ENV,
      task_type: taskType,
      routing_reason: routingReason,
    },
    tags: [taskType, routingReason, process.env.NODE_ENV ?? 'development'],
  }
}
