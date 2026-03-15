import type { WorkspaceMessage } from '@/db/schema'
import type { CardField } from '@/types/cards'

export interface SendMessageInput {
  workspaceId: string
  cardId?: string
  content: string
  userId: string
}

export interface WorkspaceContextSnapshot {
  timestamp: string
  workspace: { id: string; title: string; domain: string }
  cards: Array<{ id: string; title: string; status: string; fields: CardField[] }>
}

export interface CardContextSnapshot extends WorkspaceContextSnapshot {
  card: { id: string; title: string; status: string; fields: CardField[] }
  dependencies: Array<{ id: string; title: string; fields: CardField[] }>
}

export interface MessageWithContext extends WorkspaceMessage {
  contextSnapshot: WorkspaceContextSnapshot | CardContextSnapshot
}
