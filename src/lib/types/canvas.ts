export type CanvasCard = {
  id: string
  title: string
  description: string | null
  role: string | null
  type: string | null
  status: string
  stale_reason: string | null
  sources: unknown[] | null
  sort_order: number
  content: unknown | null
  capability_id: string | null
  outcome_id: string | null
  source: 'manual' | 'chat_artifact' | null
  source_conversation_id: string | null
  created_at: string
  updated_at: string
}
