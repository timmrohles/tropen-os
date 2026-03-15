-- ---------------------------------------------------------------------------
-- Migration 0002_feeds.sql
-- Feed System: enums, tables, indexes
-- Run in Supabase SQL Editor
-- ---------------------------------------------------------------------------

-- Enums
DO $$ BEGIN
  CREATE TYPE feed_source_type AS ENUM ('rss', 'newsletter', 'api', 'webhook', 'url');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feed_importance AS ENUM ('high', 'medium', 'low', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feed_distribution_type AS ENUM ('workspace', 'email', 'newscenter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feed_digest_mode AS ENUM ('scheduled', 'threshold', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE feed_digest_format AS ENUM ('links_only', 'with_summary', 'full_digest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- feed_sources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID,
  user_id         UUID NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            feed_source_type NOT NULL,
  url             TEXT,
  config          JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  last_error_at   TIMESTAMPTZ,
  last_error      TEXT,
  items_total     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_sources_user_id_idx  ON feed_sources (user_id);
CREATE INDEX IF NOT EXISTS feed_sources_type_idx     ON feed_sources (type);
CREATE INDEX IF NOT EXISTS feed_sources_is_active_idx ON feed_sources (is_active);

-- ---------------------------------------------------------------------------
-- feed_schemas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_schemas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id        UUID,
  user_id              UUID NOT NULL,
  name                 VARCHAR(255) NOT NULL,
  description          TEXT,
  include_keywords     JSONB NOT NULL DEFAULT '[]',
  exclude_keywords     JSONB NOT NULL DEFAULT '[]',
  languages            JSONB NOT NULL DEFAULT '[]',
  max_age_days         INTEGER NOT NULL DEFAULT 30,
  scoring_prompt       TEXT NOT NULL,
  min_score            INTEGER NOT NULL DEFAULT 6,
  extraction_prompt    TEXT NOT NULL,
  output_structure     JSONB NOT NULL,
  monthly_token_budget INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_schemas_user_id_idx ON feed_schemas (user_id);

-- ---------------------------------------------------------------------------
-- feed_source_schemas (many-to-many join)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_source_schemas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id UUID NOT NULL,
  feed_schema_id UUID NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feed_source_schemas_source_schema_unique UNIQUE (feed_source_id, feed_schema_id)
);

CREATE INDEX IF NOT EXISTS feed_source_schemas_feed_source_id_idx ON feed_source_schemas (feed_source_id);
CREATE INDEX IF NOT EXISTS feed_source_schemas_feed_schema_id_idx ON feed_source_schemas (feed_schema_id);

-- ---------------------------------------------------------------------------
-- feed_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id      UUID NOT NULL,
  feed_schema_id      UUID,
  raw_title           TEXT NOT NULL,
  raw_content         TEXT,
  raw_url             TEXT NOT NULL,
  raw_published_at    TIMESTAMPTZ,
  content_hash        VARCHAR(64) NOT NULL,
  stage1_passed       BOOLEAN NOT NULL DEFAULT FALSE,
  stage1_reason       TEXT,
  stage2_score        INTEGER,
  stage2_reason       TEXT,
  stage2_processed_at TIMESTAMPTZ,
  stage3_output       JSONB,
  stage3_processed_at TIMESTAMPTZ,
  importance          feed_importance NOT NULL DEFAULT 'none',
  is_bookmarked       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_to_workspaces  JSONB NOT NULL DEFAULT '[]',
  sent_to_email       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_to_email_at    TIMESTAMPTZ,
  ttl_days            INTEGER NOT NULL DEFAULT 30,
  expires_at          TIMESTAMPTZ NOT NULL,
  archived_summary    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT feed_items_source_hash_unique UNIQUE (feed_source_id, content_hash)
);

CREATE INDEX IF NOT EXISTS feed_items_feed_source_id_idx ON feed_items (feed_source_id);
CREATE INDEX IF NOT EXISTS feed_items_feed_schema_id_idx ON feed_items (feed_schema_id);
CREATE INDEX IF NOT EXISTS feed_items_importance_idx     ON feed_items (importance);
CREATE INDEX IF NOT EXISTS feed_items_expires_at_idx     ON feed_items (expires_at);
CREATE INDEX IF NOT EXISTS feed_items_created_at_idx     ON feed_items (created_at);
CREATE INDEX IF NOT EXISTS feed_items_deleted_at_idx     ON feed_items (deleted_at);

-- ---------------------------------------------------------------------------
-- feed_processing_log (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_processing_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id  UUID NOT NULL,
  stage         INTEGER NOT NULL,
  model         VARCHAR(64),
  tokens_input  INTEGER,
  tokens_output INTEGER,
  duration_ms   INTEGER,
  success       BOOLEAN NOT NULL,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_processing_log_feed_item_id_idx ON feed_processing_log (feed_item_id);
CREATE INDEX IF NOT EXISTS feed_processing_log_stage_idx        ON feed_processing_log (stage);
CREATE INDEX IF NOT EXISTS feed_processing_log_created_at_idx   ON feed_processing_log (created_at);

-- ---------------------------------------------------------------------------
-- feed_distributions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_distributions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_schema_id   UUID NOT NULL,
  type             feed_distribution_type NOT NULL,
  workspace_id     UUID,
  min_score        INTEGER,
  email_address    TEXT,
  digest_mode      feed_digest_mode,
  digest_schedule  VARCHAR(64),
  digest_threshold INTEGER,
  digest_format    feed_digest_format,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_distributions_feed_schema_id_idx ON feed_distributions (feed_schema_id);
CREATE INDEX IF NOT EXISTS feed_distributions_type_idx           ON feed_distributions (type);
CREATE INDEX IF NOT EXISTS feed_distributions_is_active_idx      ON feed_distributions (is_active);
