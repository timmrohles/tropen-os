// src/types/feeds.ts

export type FeedSourceType = 'rss' | 'email' | 'api' | 'url'
export type FeedItemStatus = 'unread' | 'read' | 'saved' | 'archived' | 'deleted' | 'not_relevant'
export type FeedSourceStatus = 'active' | 'paused' | 'error' | 'archived'
export type FeedRunStatus = 'running' | 'success' | 'partial' | 'error'

export interface FeedSource {
  id: string
  organizationId: string
  userId: string | null
  name: string
  type: FeedSourceType
  url: string | null
  config: Record<string, unknown>
  keywordsInclude: string[]
  keywordsExclude: string[]
  domainsAllow: string[]
  minScore: number
  schemaId: string | null
  isActive: boolean
  status: FeedSourceStatus
  pausedAt: string | null
  pausedBy: string | null
  pauseReason: string | null
  lastFetchedAt: string | null
  errorCount: number
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export interface FeedRun {
  id: string
  sourceId: string
  organizationId: string
  startedAt: string
  finishedAt: string | null
  status: FeedRunStatus
  itemsFound: number
  itemsScored: number
  itemsDistributed: number
  errors: FeedRunError[] | null
  durationMs: number | null
  triggeredBy: 'cron' | 'manual' | 'webhook'
  costEur: number | null
  createdAt: string
}

export interface FeedRunError {
  step: 'fetch' | 'score' | 'distribute'
  message: string
  itemId?: string
}

export interface FeedRunResult {
  runId: string
  status: FeedRunStatus
  itemsFound: number
  itemsScored: number
  itemsDistributed: number
  errors: FeedRunError[]
  durationMs: number
}

export interface FeedNotification {
  id: string
  organizationId: string
  userId: string | null
  sourceId: string | null
  itemId: string | null
  type: 'new_item' | 'run_error' | 'threshold_reached'
  title: string
  body: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface FeedSchema {
  id: string
  organizationId: string
  name: string
  sourceType: 'api' | 'url'
  mapping: Record<string, string>
  sampleResponse: Record<string, unknown> | null
  createdAt: string
}

export interface FeedItem {
  id: string
  sourceId: string
  organizationId: string
  title: string
  content: string | null
  summary: string | null
  keyFacts: string[] | null
  url: string | null
  author: string | null
  publishedAt: string | null
  fetchedAt: string
  stage: 1 | 2 | 3
  score: number | null
  scoreReason: string | null
  status: FeedItemStatus
  isSaved: boolean
  contentHash: string | null
  expiresAt: string | null
  archivedSummary: string | null
  dismissedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface FeedTopic {
  id: string
  userId: string
  organizationId: string
  name: string
  color: string | null
  displayOrder: number
  sourceIds: string[]
  createdAt: string
  updatedAt: string
}

export interface FeedDistribution {
  id: string
  sourceId: string
  targetType: 'project' | 'workspace' | 'notification'
  targetId: string
  autoInject: boolean
  minScore: number
  createdAt: string
}

// Used by the pipeline
export interface RawFeedItem {
  sourceId: string
  title: string
  content?: string
  url: string
  publishedAt?: Date
  author?: string
  metadata?: Record<string, unknown>
}

// API-Datenquellen
export interface FeedDataSource {
  id: string
  userId: string
  organizationId: string
  name: string
  description: string | null
  url: string
  method: 'GET' | 'POST'
  authType: 'none' | 'bearer' | 'api_key' | 'basic' | null
  authConfig: Record<string, string>
  requestHeaders: Record<string, string>
  requestBody: string | null
  fetchInterval: number
  schemaPath: string | null
  schemaPreview: Record<string, unknown> | null
  isActive: boolean
  lastFetchedAt: string | null
  lastError: string | null
  recordCount: number
  createdAt: string
  updatedAt: string
}

export interface FeedDataRecord {
  id: string
  sourceId: string
  userId: string
  organizationId: string
  fetchedAt: string
  data: unknown
  recordCount: number | null
  fetchDurationMs: number | null
  httpStatus: number | null
  error: string | null
  linkedProjectId: string | null
  linkedWorkspaceId: string | null
}

// Stage 2 result from Haiku
export interface Stage2Result {
  score: number    // 1-10
  reason: string
}
