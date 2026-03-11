// src/lib/qa/routing-logger.ts
// Fire-and-forget Logger für qa_routing_log
// Wirft NIEMALS einen Fehler der den User-Request blockieren könnte

import { createServiceClient } from '@/lib/supabase/server'
import { createHash } from 'node:crypto'

export interface RoutingLogEntry {
  taskType: string           // z.B. 'chat', 'code', 'translation'
  modelSelected: string      // z.B. 'gpt-4o', 'claude-sonnet-4'
  routingReason: string      // z.B. 'direct', 'complexity:high', 'lang:de'
  latencyMs: number | null
  status: 'success' | 'timeout' | 'error'
  errorMessage?: string
  userId?: string            // Wird gehasht — nie Klartext
}

export function logRoutingDecision(entry: RoutingLogEntry): void {
  // Fire-and-forget: kein await, kein throw
  _writeToDb(entry).catch((err) => {
    // Nur warnen, nie den Request blockieren
    console.warn('[RoutingLogger] DB-Write fehlgeschlagen:', err?.message ?? err)
  })
}

async function _writeToDb(entry: RoutingLogEntry): Promise<void> {
  const supabase = createServiceClient()

  // User-ID hashen (DSGVO — nie Klartext speichern)
  const hashedUserId = entry.userId
    ? createHash('sha256').update(entry.userId).digest('hex').slice(0, 16)
    : null

  await supabase.from('qa_routing_log').insert({
    task_type:      entry.taskType,
    model_selected: entry.modelSelected,
    routing_reason: entry.routingReason,
    latency_ms:     entry.latencyMs,
    status:         entry.status,
    error_message:  entry.errorMessage ?? null,
    user_id:        hashedUserId,
  })
}
