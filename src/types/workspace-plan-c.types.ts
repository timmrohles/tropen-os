// src/types/workspace-plan-c.types.ts
// Plan C — Workspace + Card Engine TypeScript interfaces
// All DB rows are mapped to camelCase here.

export type WorkspaceStatus = 'draft' | 'active' | 'exported' | 'locked'
export type ContentType =
  | 'text' | 'table' | 'chart' | 'list' | 'code'
  | 'map' | 'mindmap' | 'kanban' | 'timeline' | 'image' | 'embed'
export type CardRole = 'input' | 'process' | 'output'
export type CardStatus = 'draft' | 'ready' | 'stale' | 'processing' | 'error'
export type ExportFormat = 'chat' | 'word' | 'pdf' | 'markdown' | 'presentation'
export type ExportStatus = 'pending' | 'processing' | 'ready' | 'error'
export type AssetType = 'image' | 'chart' | 'link' | 'upload' | 'video'

export interface WorkspacePlanC {
  id: string
  organizationId: string | null
  departmentId: string | null
  createdBy: string | null
  title: string
  goal: string | null
  domain: string | null
  meta: Record<string, unknown>
  status: WorkspaceStatus
  briefingChatId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CardPlanC {
  id: string
  workspaceId: string
  title: string
  description: string | null
  contentType: ContentType
  role: CardRole
  content: Record<string, unknown> | null
  chartConfig: Record<string, unknown> | null
  status: CardStatus
  staleSince: string | null
  staleReason: string | null
  sortOrder: number
  meta: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CardHistoryEntry {
  id: string
  cardId: string
  workspaceId: string | null
  snapshot: Record<string, unknown>
  changedBy: string | null
  changeReason: string | null
  createdAt: string
}

export interface ConnectionPlanC {
  id: string
  workspaceId: string
  sourceCardId: string
  targetCardId: string
  label: string | null
  createdAt: string
}

export interface WorkspaceAsset {
  id: string
  workspaceId: string
  cardId: string | null
  type: AssetType
  name: string
  url: string
  size: number | null
  meta: Record<string, unknown>
  createdAt: string
}

export interface WorkspaceExport {
  id: string
  workspaceId: string
  format: ExportFormat
  status: ExportStatus
  fileUrl: string | null
  isStale: boolean
  createdAt: string
}

export interface WorkspaceMessage {
  id: string
  workspaceId: string
  cardId: string | null
  role: 'user' | 'assistant'
  content: string
  contextSnapshot: Record<string, unknown> | null
  tokenUsage: Record<string, unknown> | null
  createdAt: string
}

// Briefing card proposal — returned by Toro before user confirms
export interface BriefingCardProposal {
  title: string
  role: CardRole
  contentType: ContentType
  description: string
}

export interface BriefingProposal {
  goal: string
  cards: BriefingCardProposal[]
}
