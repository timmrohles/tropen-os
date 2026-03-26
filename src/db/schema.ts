/**
 * Tropen OS – Drizzle Schema
 * Neues Workspace-System (Prompt 01)
 *
 * HINWEIS: Die bestehende `workspaces` Tabelle (alte Chat-Bereiche) sollte
 * zu `departments` umbenannt werden bevor diese Migration läuft:
 *   ALTER TABLE workspaces RENAME TO departments;
 *
 * HINWEIS: Die bestehende `messages` Tabelle (conversation_id, ...) bleibt
 * unverändert. Workspace-Nachrichten landen in `workspace_messages`.
 */

import {
  pgTable, pgEnum, uuid, varchar, text, integer, boolean,
  timestamp, jsonb, index, uniqueIndex, customType,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Custom type: tsvector (für Volltextsuche)
// ---------------------------------------------------------------------------
const tsvector = customType<{ data: string }>({
  dataType() { return 'tsvector' },
})

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const workspaceDomainEnum = pgEnum('workspace_domain', [
  'marketing', 'research', 'learning', 'legal', 'product', 'custom',
])

export const cardTypeEnum = pgEnum('card_type', [
  'input', 'process', 'output',
])

export const cardStatusEnum = pgEnum('card_status', [
  'draft', 'ready', 'stale', 'processing', 'error',
])

export const connectionTypeEnum = pgEnum('connection_type', [
  'data', 'logic', 'temporal', 'thematic',
])

export const connectionStrengthEnum = pgEnum('connection_strength', [
  'required', 'optional',
])

export const messageRoleEnum = pgEnum('ws_message_role', [
  'user', 'assistant', 'system',
])

export const messageScopeEnum = pgEnum('ws_message_scope', [
  'workspace', 'card',
])

export const operatorTypeEnum = pgEnum('operator_type', [
  'coherence', 'plausibility', 'temporal', 'forecast', 'generate',
])

export const operatorStatusEnum = pgEnum('operator_status', [
  'queued', 'running', 'done', 'failed',
])

export const outcomeTypeEnum = pgEnum('outcome_type', [
  'scorm', 'pdf', 'dashboard', 'slide_deck', 'brief', 'api_feed', 'custom',
])

export const knowledgeEntryTypeEnum = pgEnum('knowledge_entry_type', [
  'document', 'url', 'note', 'generated', 'data',
])

export const participantRoleEnum = pgEnum('participant_role', [
  'owner', 'editor', 'reviewer', 'viewer',
])

// ---------------------------------------------------------------------------
// departments (referenziert — existiert bereits in der DB)
// ---------------------------------------------------------------------------
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ---------------------------------------------------------------------------
// workspace_templates (wird vor workspaces referenziert)
// ---------------------------------------------------------------------------
export const workspaceTemplates = pgTable('workspace_templates', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  domain: workspaceDomainEnum('domain').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  definition: jsonb('definition').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('workspace_templates_domain_idx').on(t.domain),
  index('workspace_templates_is_public_idx').on(t.isPublic),
])

// ---------------------------------------------------------------------------
// workspaces
// ---------------------------------------------------------------------------
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  domain: workspaceDomainEnum('domain').notNull().default('custom'),
  goal: text('goal'),
  templateId: uuid('template_id').references(() => workspaceTemplates.id, { onDelete: 'set null' }),
  meta: jsonb('meta').default({}).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('workspaces_department_id_idx').on(t.departmentId),
  index('workspaces_domain_idx').on(t.domain),
  index('workspaces_created_by_idx').on(t.createdBy),
  index('workspaces_created_at_idx').on(t.createdAt),
  index('workspaces_deleted_at_idx').on(t.deletedAt),
])

// ---------------------------------------------------------------------------
// workspace_participants
// ---------------------------------------------------------------------------
export const workspaceParticipants = pgTable('workspace_participants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  role: participantRoleEnum('role').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('workspace_participants_workspace_user_idx').on(t.workspaceId, t.userId),
  index('workspace_participants_workspace_id_idx').on(t.workspaceId),
  index('workspace_participants_user_id_idx').on(t.userId),
])

// ---------------------------------------------------------------------------
// cards
// ---------------------------------------------------------------------------
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  type: cardTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: cardStatusEnum('status').notNull().default('draft'),
  model: varchar('model', { length: 64 }).default('claude'),
  positionX: integer('position_x').default(0).notNull(),
  positionY: integer('position_y').default(0).notNull(),
  fields: jsonb('fields').default([]).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('cards_workspace_id_idx').on(t.workspaceId),
  index('cards_type_idx').on(t.type),
  index('cards_status_idx').on(t.status),
  index('cards_sort_order_idx').on(t.sortOrder),
  index('cards_created_at_idx').on(t.createdAt),
  index('cards_deleted_at_idx').on(t.deletedAt),
])

// ---------------------------------------------------------------------------
// card_history (APPEND ONLY — niemals UPDATE, niemals DELETE)
// ---------------------------------------------------------------------------
export const cardHistory = pgTable('card_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  cardId: uuid('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  snapshot: jsonb('snapshot').notNull(),
  changeReason: text('change_reason'),
  triggeredBy: uuid('triggered_by'),
  triggeredByOperator: uuid('triggered_by_operator'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('card_history_card_id_idx').on(t.cardId),
  index('card_history_workspace_id_idx').on(t.workspaceId),
  index('card_history_created_at_idx').on(t.createdAt),
])

// ---------------------------------------------------------------------------
// connections
// ---------------------------------------------------------------------------
export const connections = pgTable('connections', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  fromCardId: uuid('from_card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  toCardId: uuid('to_card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  type: connectionTypeEnum('type').notNull(),
  strength: connectionStrengthEnum('strength').notNull().default('required'),
  label: varchar('label', { length: 255 }),
  meta: jsonb('meta').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('connections_from_to_type_idx').on(t.fromCardId, t.toCardId, t.type),
  index('connections_workspace_id_idx').on(t.workspaceId),
  index('connections_from_card_id_idx').on(t.fromCardId),
  index('connections_to_card_id_idx').on(t.toCardId),
  index('connections_type_idx').on(t.type),
])

// ---------------------------------------------------------------------------
// knowledge_entries
// ---------------------------------------------------------------------------
export const knowledgeEntries = pgTable('knowledge_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'set null' }),
  type: knowledgeEntryTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  sourceUrl: text('source_url'),
  filePath: text('file_path'),
  structuredData: jsonb('structured_data'),
  searchVector: tsvector('search_vector'),
  addedBy: uuid('added_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('knowledge_entries_workspace_id_idx').on(t.workspaceId),
  index('knowledge_entries_card_id_idx').on(t.cardId),
  index('knowledge_entries_type_idx').on(t.type),
  index('knowledge_entries_created_at_idx').on(t.createdAt),
  index('knowledge_entries_deleted_at_idx').on(t.deletedAt),
  // GIN index wird in separater Migration angelegt (Drizzle unterstützt customType-GIN nicht)
])

// ---------------------------------------------------------------------------
// workspace_messages (nicht `messages` — bestehende Tabelle in Supabase)
// ---------------------------------------------------------------------------
export const workspaceMessages = pgTable('workspace_messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'set null' }),
  scope: messageScopeEnum('scope').notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  contextSnapshot: jsonb('context_snapshot').default({}).notNull(),
  model: varchar('model', { length: 64 }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('workspace_messages_workspace_id_idx').on(t.workspaceId),
  index('workspace_messages_card_id_idx').on(t.cardId),
  index('workspace_messages_scope_idx').on(t.scope),
  index('workspace_messages_created_at_idx').on(t.createdAt),
])

// ---------------------------------------------------------------------------
// operators
// ---------------------------------------------------------------------------
export const operators = pgTable('operators', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  type: operatorTypeEnum('type').notNull(),
  status: operatorStatusEnum('status').notNull().default('queued'),
  scope: jsonb('scope').default([]).notNull(),
  params: jsonb('params').default({}).notNull(),
  triggeredBy: uuid('triggered_by'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('operators_workspace_id_idx').on(t.workspaceId),
  index('operators_type_idx').on(t.type),
  index('operators_status_idx').on(t.status),
  index('operators_created_at_idx').on(t.createdAt),
])

// ---------------------------------------------------------------------------
// operator_results
// ---------------------------------------------------------------------------
export const operatorResults = pgTable('operator_results', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  operatorId: uuid('operator_id').notNull().references(() => operators.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  result: jsonb('result').notNull(),
  summary: text('summary'),
  severity: varchar('severity', { length: 32 }).default('info').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('operator_results_operator_id_idx').on(t.operatorId),
  index('operator_results_workspace_id_idx').on(t.workspaceId),
])

// ---------------------------------------------------------------------------
// workspace_outcomes (workspace-scoped — umbenannt von "outcomes" in Migration 039)
// ---------------------------------------------------------------------------
export const workspaceOutcomes = pgTable('workspace_outcomes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  type: outcomeTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  sourceCardIds: jsonb('source_card_ids').default([]).notNull(),
  filePath: text('file_path'),
  externalUrl: text('external_url'),
  payload: jsonb('payload'),
  version: integer('version').default(1).notNull(),
  autoRegenerate: boolean('auto_regenerate').default(false).notNull(),
  sourceSnapshot: jsonb('source_snapshot').default({}).notNull(),
  generatedBy: uuid('generated_by'),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('workspace_outcomes_workspace_id_idx').on(t.workspaceId),
  index('workspace_outcomes_type_idx').on(t.type),
  index('workspace_outcomes_deleted_at_idx').on(t.deletedAt),
])

// ---------------------------------------------------------------------------
// outcomes (system-level — Output-Typen: Text, Tabelle, Report, ...)
// Hinweis: workspace-scoped Outcomes → workspaceOutcomes (oben)
// ---------------------------------------------------------------------------
export const outcomes = pgTable('outcomes', {
  id:                    uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  label:                 varchar('label', { length: 100 }).notNull(),
  icon:                  varchar('icon', { length: 10 }).notNull(),
  description:           text('description'),
  outputType:            varchar('output_type', { length: 50 }).notNull().unique(),
  cardType:              varchar('card_type', { length: 50 }).notNull(),
  systemPromptInjection: text('system_prompt_injection'),
  isActive:              boolean('is_active').notNull().default(true),
  sortOrder:             integer('sort_order').notNull().default(0),
})

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  department: one(departments, { fields: [workspaces.departmentId], references: [departments.id] }),
  template: one(workspaceTemplates, { fields: [workspaces.templateId], references: [workspaceTemplates.id] }),
  participants: many(workspaceParticipants),
  cards: many(cards),
  connections: many(connections),
  knowledgeEntries: many(knowledgeEntries),
  messages: many(workspaceMessages),
  operators: many(operators),
  workspaceOutcomes: many(workspaceOutcomes),
}))

export const workspaceParticipantsRelations = relations(workspaceParticipants, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceParticipants.workspaceId], references: [workspaces.id] }),
}))

export const cardsRelations = relations(cards, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [cards.workspaceId], references: [workspaces.id] }),
  history: many(cardHistory),
  outgoingConnections: many(connections, { relationName: 'fromCard' }),
  incomingConnections: many(connections, { relationName: 'toCard' }),
  knowledgeEntries: many(knowledgeEntries),
  messages: many(workspaceMessages),
}))

export const cardHistoryRelations = relations(cardHistory, ({ one }) => ({
  card: one(cards, { fields: [cardHistory.cardId], references: [cards.id] }),
  workspace: one(workspaces, { fields: [cardHistory.workspaceId], references: [workspaces.id] }),
}))

export const connectionsRelations = relations(connections, ({ one }) => ({
  workspace: one(workspaces, { fields: [connections.workspaceId], references: [workspaces.id] }),
  fromCard: one(cards, {
    fields: [connections.fromCardId],
    references: [cards.id],
    relationName: 'fromCard',
  }),
  toCard: one(cards, {
    fields: [connections.toCardId],
    references: [cards.id],
    relationName: 'toCard',
  }),
}))

export const knowledgeEntriesRelations = relations(knowledgeEntries, ({ one }) => ({
  workspace: one(workspaces, { fields: [knowledgeEntries.workspaceId], references: [workspaces.id] }),
  card: one(cards, { fields: [knowledgeEntries.cardId], references: [cards.id] }),
}))

export const workspaceMessagesRelations = relations(workspaceMessages, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMessages.workspaceId], references: [workspaces.id] }),
  card: one(cards, { fields: [workspaceMessages.cardId], references: [cards.id] }),
}))

export const operatorsRelations = relations(operators, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [operators.workspaceId], references: [workspaces.id] }),
  results: many(operatorResults),
}))

export const operatorResultsRelations = relations(operatorResults, ({ one }) => ({
  operator: one(operators, { fields: [operatorResults.operatorId], references: [operators.id] }),
  workspace: one(workspaces, { fields: [operatorResults.workspaceId], references: [workspaces.id] }),
}))

export const workspaceOutcomesRelations = relations(workspaceOutcomes, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceOutcomes.workspaceId], references: [workspaces.id] }),
}))

export const workspaceTemplatesRelations = relations(workspaceTemplates, ({ many }) => ({
  workspaces: many(workspaces),
}))

// ---------------------------------------------------------------------------
// Exportierte Typen
// ---------------------------------------------------------------------------
export type Department = typeof departments.$inferSelect
export type DepartmentInsert = typeof departments.$inferInsert

export type WorkspaceTemplate = typeof workspaceTemplates.$inferSelect
export type WorkspaceTemplateInsert = typeof workspaceTemplates.$inferInsert

export type Workspace = typeof workspaces.$inferSelect
export type WorkspaceInsert = typeof workspaces.$inferInsert

export type WorkspaceParticipant = typeof workspaceParticipants.$inferSelect
export type WorkspaceParticipantInsert = typeof workspaceParticipants.$inferInsert

export type Card = typeof cards.$inferSelect
export type CardInsert = typeof cards.$inferInsert

export type CardHistory = typeof cardHistory.$inferSelect
export type CardHistoryInsert = typeof cardHistory.$inferInsert

export type Connection = typeof connections.$inferSelect
export type ConnectionInsert = typeof connections.$inferInsert

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect
export type KnowledgeEntryInsert = typeof knowledgeEntries.$inferInsert

export type WorkspaceMessage = typeof workspaceMessages.$inferSelect
export type WorkspaceMessageInsert = typeof workspaceMessages.$inferInsert

export type Operator = typeof operators.$inferSelect
export type OperatorInsert = typeof operators.$inferInsert

export type OperatorResult = typeof operatorResults.$inferSelect
export type OperatorResultInsert = typeof operatorResults.$inferInsert

export type WorkspaceOutcome = typeof workspaceOutcomes.$inferSelect
export type WorkspaceOutcomeInsert = typeof workspaceOutcomes.$inferInsert

export type SystemOutcome = typeof outcomes.$inferSelect
export type SystemOutcomeInsert = typeof outcomes.$inferInsert

// Enum-Typen
export type WorkspaceDomain = typeof workspaceDomainEnum.enumValues[number]
export type CardType = typeof cardTypeEnum.enumValues[number]
export type CardStatus = typeof cardStatusEnum.enumValues[number]
export type ConnectionType = typeof connectionTypeEnum.enumValues[number]
export type ConnectionStrength = typeof connectionStrengthEnum.enumValues[number]
export type MessageRole = typeof messageRoleEnum.enumValues[number]
export type MessageScope = typeof messageScopeEnum.enumValues[number]
export type OperatorType = typeof operatorTypeEnum.enumValues[number]
export type OperatorStatus = typeof operatorStatusEnum.enumValues[number]
export type OutcomeType = typeof outcomeTypeEnum.enumValues[number]
export type KnowledgeEntryType = typeof knowledgeEntryTypeEnum.enumValues[number]
export type ParticipantRole = typeof participantRoleEnum.enumValues[number]

// ---------------------------------------------------------------------------
// Feed – Enums
// ---------------------------------------------------------------------------
export const feedSourceTypeEnum = pgEnum('feed_source_type', ['rss', 'newsletter', 'api', 'webhook', 'url'])
export const feedImportanceEnum = pgEnum('feed_importance', ['high', 'medium', 'low', 'none'])
export const feedDistributionTypeEnum = pgEnum('feed_distribution_type', ['workspace', 'email', 'newscenter'])
export const feedDigestModeEnum = pgEnum('feed_digest_mode', ['scheduled', 'threshold', 'manual'])
export const feedDigestFormatEnum = pgEnum('feed_digest_format', ['links_only', 'with_summary', 'full_digest'])

// ---------------------------------------------------------------------------
// feed_sources
// ---------------------------------------------------------------------------
export const feedSources = pgTable('feed_sources', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  departmentId: uuid('department_id'),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: feedSourceTypeEnum('type').notNull(),
  url: text('url'),
  config: jsonb('config').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
  lastError: text('last_error'),
  itemsTotal: integer('items_total').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('feed_sources_user_id_idx').on(t.userId),
  index('feed_sources_type_idx').on(t.type),
  index('feed_sources_is_active_idx').on(t.isActive),
])

// ---------------------------------------------------------------------------
// feed_schemas
// ---------------------------------------------------------------------------
export const feedSchemas = pgTable('feed_schemas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  departmentId: uuid('department_id'),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  includeKeywords: jsonb('include_keywords').default([]).notNull(),
  excludeKeywords: jsonb('exclude_keywords').default([]).notNull(),
  languages: jsonb('languages').default([]).notNull(),
  maxAgeDays: integer('max_age_days').default(30).notNull(),
  scoringPrompt: text('scoring_prompt').notNull(),
  minScore: integer('min_score').default(6).notNull(),
  extractionPrompt: text('extraction_prompt').notNull(),
  outputStructure: jsonb('output_structure').notNull(),
  monthlyTokenBudget: integer('monthly_token_budget'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('feed_schemas_user_id_idx').on(t.userId),
])

// ---------------------------------------------------------------------------
// feed_source_schemas (many-to-many)
// ---------------------------------------------------------------------------
export const feedSourceSchemas = pgTable('feed_source_schemas', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  feedSourceId: uuid('feed_source_id').notNull(),
  feedSchemaId: uuid('feed_schema_id').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('feed_source_schemas_source_schema_idx').on(t.feedSourceId, t.feedSchemaId),
  index('feed_source_schemas_feed_source_id_idx').on(t.feedSourceId),
  index('feed_source_schemas_feed_schema_id_idx').on(t.feedSchemaId),
])

// ---------------------------------------------------------------------------
// feed_items
// ---------------------------------------------------------------------------
export const feedItems = pgTable('feed_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  feedSourceId: uuid('feed_source_id').notNull(),
  feedSchemaId: uuid('feed_schema_id'),
  rawTitle: text('raw_title').notNull(),
  rawContent: text('raw_content'),
  rawUrl: text('raw_url').notNull(),
  rawPublishedAt: timestamp('raw_published_at', { withTimezone: true }),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  stage1Passed: boolean('stage1_passed').default(false).notNull(),
  stage1Reason: text('stage1_reason'),
  stage2Score: integer('stage2_score'),
  stage2Reason: text('stage2_reason'),
  stage2ProcessedAt: timestamp('stage2_processed_at', { withTimezone: true }),
  stage3Output: jsonb('stage3_output'),
  stage3ProcessedAt: timestamp('stage3_processed_at', { withTimezone: true }),
  importance: feedImportanceEnum('importance').default('none').notNull(),
  isBookmarked: boolean('is_bookmarked').default(false).notNull(),
  sentToWorkspaces: jsonb('sent_to_workspaces').default([]).notNull(),
  sentToEmail: boolean('sent_to_email').default(false).notNull(),
  sentToEmailAt: timestamp('sent_to_email_at', { withTimezone: true }),
  ttlDays: integer('ttl_days').default(30).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  archivedSummary: text('archived_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('feed_items_source_hash_idx').on(t.feedSourceId, t.contentHash),
  index('feed_items_feed_source_id_idx').on(t.feedSourceId),
  index('feed_items_feed_schema_id_idx').on(t.feedSchemaId),
  index('feed_items_importance_idx').on(t.importance),
  index('feed_items_expires_at_idx').on(t.expiresAt),
  index('feed_items_created_at_idx').on(t.createdAt),
  index('feed_items_deleted_at_idx').on(t.deletedAt),
])

// ---------------------------------------------------------------------------
// feed_processing_log (append-only)
// ---------------------------------------------------------------------------
export const feedProcessingLogs = pgTable('feed_processing_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  feedItemId: uuid('feed_item_id').notNull(),
  stage: integer('stage').notNull(),
  model: varchar('model', { length: 64 }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  durationMs: integer('duration_ms'),
  success: boolean('success').notNull(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('feed_processing_log_feed_item_id_idx').on(t.feedItemId),
  index('feed_processing_log_stage_idx').on(t.stage),
  index('feed_processing_log_created_at_idx').on(t.createdAt),
])

// ---------------------------------------------------------------------------
// feed_distributions
// ---------------------------------------------------------------------------
export const feedDistributions = pgTable('feed_distributions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  feedSchemaId: uuid('feed_schema_id').notNull(),
  type: feedDistributionTypeEnum('type').notNull(),
  workspaceId: uuid('workspace_id'),
  minScore: integer('min_score'),
  emailAddress: text('email_address'),
  digestMode: feedDigestModeEnum('digest_mode'),
  digestSchedule: varchar('digest_schedule', { length: 64 }),
  digestThreshold: integer('digest_threshold'),
  digestFormat: feedDigestFormatEnum('digest_format'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('feed_distributions_feed_schema_id_idx').on(t.feedSchemaId),
  index('feed_distributions_type_idx').on(t.type),
  index('feed_distributions_is_active_idx').on(t.isActive),
])

// ---------------------------------------------------------------------------
// Feed – Exportierte Typen
// ---------------------------------------------------------------------------
export type FeedSource = typeof feedSources.$inferSelect
export type FeedSourceInsert = typeof feedSources.$inferInsert
export type FeedSchema = typeof feedSchemas.$inferSelect
export type FeedSchemaInsert = typeof feedSchemas.$inferInsert
export type FeedSourceSchema = typeof feedSourceSchemas.$inferSelect
export type FeedItem = typeof feedItems.$inferSelect
export type FeedItemInsert = typeof feedItems.$inferInsert
export type FeedProcessingLog = typeof feedProcessingLogs.$inferSelect
export type FeedDistribution = typeof feedDistributions.$inferSelect
export type FeedDistributionInsert = typeof feedDistributions.$inferInsert

export type FeedSourceType = typeof feedSourceTypeEnum.enumValues[number]
export type FeedImportance = typeof feedImportanceEnum.enumValues[number]
export type FeedDistributionType = typeof feedDistributionTypeEnum.enumValues[number]
export type FeedDigestMode = typeof feedDigestModeEnum.enumValues[number]
export type FeedDigestFormat = typeof feedDigestFormatEnum.enumValues[number]
