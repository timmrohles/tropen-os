// src/lib/llm/router.ts
// Routing-Logik als traceable Funktion — erscheint als Span in LangSmith

import { traceable } from '@/lib/langsmith/tracer'
import { classifyTask, getRoutingReason } from '@/lib/qa/task-classifier'

export interface RoutingResult {
  model: string
  taskType: string
  routingReason: string
}

// traceable macht diese Funktion zu einem LangSmith-Span
export const routeRequest = traceable(
  async function routeRequest(prompt: string): Promise<RoutingResult> {
    const taskType = classifyTask(prompt)
    const routingReason = getRoutingReason(taskType, prompt.length)

    // Aktuell: immer gpt-4o-mini
    // Phase 2 des Routers: Modell-Auswahl basierend auf taskType + Qualitäts-Metriken
    const model = selectModel(taskType)

    return { model, taskType, routingReason }
  },
  {
    name: 'route_request',
    run_type: 'chain',
    tags: ['routing'],
  }
)

function selectModel(_taskType: string): string {
  // Später: Routing-Logik basierend auf Qualitäts-Metriken aus qa_metrics
  return 'gpt-4o-mini'
}
