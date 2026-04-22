// Explicit field lists for Supabase queries — prevents over-fetching and
// ensures new DB columns don't silently appear in API responses.

export const CARD_FIELDS =
  'id, workspace_id, organization_id, type, title, description, content_type, role, content, meta, chart_config, status, sort_order, stale_since, stale_reason, domain, source, source_conversation_id, capability_id, outcome_id, role_id, skill_id, sources, last_run_at, next_run_at, created_at, updated_at, deleted_at' as const

export const BOOKMARK_FIELDS =
  'id, message_id, conversation_id, user_id, content_preview, full_content, created_at' as const

export const WORKSPACE_ASSET_FIELDS =
  'id, workspace_id, card_id, type, name, url, size, meta, created_at' as const
