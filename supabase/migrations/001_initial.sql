-- Tropen OS v2 – Initial Schema
-- Änderungen gegenüber v1:
--   • workspaces.allowed_model_classes statt allowed_models
--   • model_catalog.model_class (fast | deep | safe)
--   • messages: task_type, agent, model_class
--   • usage_logs: task_type, agent, model_class
--   • conversations.dify_conversation_id

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  budget_limit  NUMERIC(10,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email           TEXT NOT NULL,
  full_name       TEXT,
  role            TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspaces (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID REFERENCES organizations(id),
  name                  TEXT NOT NULL,
  description           TEXT,
  allowed_model_classes TEXT[] DEFAULT '{fast}' CHECK (
    allowed_model_classes <@ ARRAY['fast','deep','safe']::TEXT[]
  ),
  budget_limit          NUMERIC(10,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id      UUID REFERENCES users(id),
  role         TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE conversations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID REFERENCES workspaces(id),
  user_id              UUID REFERENCES users(id),
  title                TEXT,
  dify_conversation_id TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE model_catalog (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT UNIQUE NOT NULL,
  provider            TEXT CHECK (provider IN ('openai', 'anthropic', 'mistral', 'google')),
  model_class         TEXT NOT NULL CHECK (model_class IN ('fast', 'deep', 'safe')),
  cost_per_1k_input   NUMERIC(10,6) NOT NULL,
  cost_per_1k_output  NUMERIC(10,6) NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  description         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role            TEXT CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  model_used      TEXT,
  task_type       TEXT CHECK (task_type IN ('chat', 'summarize', 'extract', 'research', 'create')),
  agent           TEXT CHECK (agent IN ('general', 'knowledge', 'content', 'business')),
  model_class     TEXT CHECK (model_class IN ('fast', 'deep', 'safe')),
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  cost_eur        NUMERIC(10,4),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  workspace_id    UUID REFERENCES workspaces(id),
  user_id         UUID REFERENCES users(id),
  model_id        UUID REFERENCES model_catalog(id),
  task_type       TEXT CHECK (task_type IN ('chat', 'summarize', 'extract', 'research', 'create')),
  agent           TEXT CHECK (agent IN ('general', 'knowledge', 'content', 'business')),
  model_class     TEXT CHECK (model_class IN ('fast', 'deep', 'safe')),
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  cost_eur        NUMERIC(10,4),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
