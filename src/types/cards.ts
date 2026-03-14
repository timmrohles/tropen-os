import type { Card } from '@/db/schema'
import type { CardHistoryEntry } from '@/types/workspace-plan-c.types'

export interface CardField {
  key: string
  label: string
  value: string
  updatedAt: string // ISO timestamp
}

export interface CardWithHistory extends Card {
  recentHistory: CardHistoryEntry[]
}
