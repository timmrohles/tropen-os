# Library-Fundament — Capabilities, Outcomes, Roles, Skills + Governance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Library System that defines who Toro is (Roles), what he can do (Capabilities), how he does it (Skills), and what comes out (Outcomes) — the foundation for all Chat, Workspace, Agent, and Feed workflows.

**Architecture:** Four entity types with scope hierarchy (system → package → org → user → public). A central `library-resolver.ts` builds the final system prompt by combining Role + Skill + Capability + Outcome. Chat Input switches from `package_agents` to `roles` as the "Agent" picker (now called "Rolle").

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase (supabaseAdmin for all queries), Zod validation, Phosphor Icons

---

## Codebase State (MUST READ before coding)

### Tables that already exist — do NOT recreate
| Table | Status | Notes |
|-------|--------|-------|
| `capabilities` | EXISTS (migration 039) | 9 system capabilities seeded. Missing columns: see Task 1 |
| `outcomes` | EXISTS (migration 039) | 9 system outcomes seeded. Missing `name` column |
| `capability_outcomes` | EXISTS (migration 039) | Fully seeded ✅ |
| `model_catalog` | EXISTS (migrations 038/039) | UUID PK (NOT TEXT), has `api_model_id TEXT` field, seeded ✅ |
| `skills` | EXISTS (migration 047) | Built for agents, needs extension. 6 skills already seeded |
| `guided_workflows` | EXISTS (migration 039) | No changes needed in this plan |
| `cards` | EXISTS (migrations 031+040) | Has capability_id, outcome_id; needs role_id, skill_id |
| `package_agents` | EXISTS (migration 026) | 5 Marketing agents → migrate to roles |

### Tables that do NOT exist — must create
- `roles`
- `library_versions` (APPEND ONLY)
- `org_library_settings`
- `user_library_settings`

### Key existing files
- `src/lib/capability-resolver.ts` — existing resolver, **do not modify**
- `src/lib/skill-resolver.ts` — skills for agents, **do not modify**
- `src/app/api/capabilities/resolve/route.ts` — existing resolve endpoint, **do not modify**
- `src/components/workspace/ChatInput.tsx` — **modify** for "Rolle" picker
- `src/lib/workspace-chat.ts` — **modify** to pass roleId instead of agentId
- `src/hooks/useWorkspaceState.ts` — **modify** to rename activeAgentId → activeRoleId

### Next migration number
Last migration: `20260319000051_announcements.sql`
Next: `20260319000052`, then `20260319000053`, `20260319000054`, `20260319000055`

### Existing DB patterns (copy these)
- All server queries use `supabaseAdmin` from `@/lib/supabase-admin`
- Auth check via `getAuthUser()` from `@/lib/api/projects` — returns `{ id, organization_id, role }` directly
- Validation via `validateBody(req, schema)` + `z` from `zod`
- `export const runtime = 'nodejs'` on all API routes
- No console.log — use `createLogger('scope')` from `@/lib/logger`
- No hex colors in TSX/TS — CSS vars only
- File > 500 lines = CI error

### package_agents table shape (026)
```sql
id, package_id, name (TEXT with emoji prefix), description, system_prompt, quick_chips JSONB, display_order
```
5 entries with package slug = 'marketing':
- "🎯 Campaign Planner" → role name: 'campaign_planner'
- "✍️ Brand Voice Writer" → role name: 'brand_voice_writer'
- "📱 Social Adapter" → role name: 'social_adapter'
- "📧 Newsletter Spezialist" → role name: 'newsletter_specialist'
- "✏️ Copy Texter" → role name: 'copy_texter'

---

## File Structure

```
supabase/migrations/
  20260319000052_library_extend_existing.sql  — ALTER capabilities/outcomes/skills
  20260319000053_library_new_tables.sql        — CREATE roles/library_versions/org+user settings
  20260319000054_library_cards.sql             — ALTER cards (role_id, skill_id)
  20260319000055_library_seed.sql              — Seed roles (7), migrate package_agents

src/lib/
  library-resolver.ts                          — Core: resolveWorkflow, detectRole, detectSkill, buildSystemPrompt

src/lib/validators/
  library.ts                                   — Zod schemas for all /api/library routes

src/app/api/library/
  capabilities/route.ts                        — GET capabilities
  capabilities/[id]/outcomes/route.ts          — GET valid outcomes for capability
  outcomes/route.ts                            — GET outcomes
  roles/route.ts                               — GET list + POST create
  roles/[id]/route.ts                          — GET single + PATCH + DELETE
  roles/[id]/adopt/route.ts                    — POST adopt (copy as org/user base)
  roles/[id]/publish/route.ts                  — POST → scope='public', is_public=true
  roles/[id]/unpublish/route.ts                — POST → is_public=false
  roles/[id]/import/route.ts                   — POST → copy for user (scope='user')
  skills/route.ts                              — GET list + POST create
  skills/[id]/route.ts                         — GET single + PATCH + DELETE
  skills/[id]/adopt/route.ts                   — POST adopt
  skills/[id]/publish/route.ts                 — POST publish
  skills/[id]/unpublish/route.ts               — POST unpublish
  skills/[id]/import/route.ts                  — POST import
  resolve/route.ts                             — POST → WorkflowPlan (full: role+cap+skill+outcome)
  org-settings/route.ts                        — GET + PATCH org library settings
  user-settings/route.ts                       — GET + PATCH user library settings
  versions/[entity_type]/[entity_id]/route.ts  — GET version history (superadmin)

src/components/workspace/
  ChatInput.tsx                                — MODIFY: "Rolle" picker from /api/library/roles

src/lib/
  workspace-chat.ts                            — MODIFY: activeRoleId replaces activeAgentId

src/hooks/
  useWorkspaceState.ts                         — MODIFY: rename activeAgentId → activeRoleId
```

---

## Task 1: Migration — Extend Existing Tables

**Files:**
- Create: `supabase/migrations/20260319000052_library_extend_existing.sql`

This migration extends the three existing tables that need new columns. ALL DDL must be idempotent (IF NOT EXISTS / DO $$ guards).

- [ ] **Step 1: Create the migration file**

```sql
-- 20260319000052_library_extend_existing.sql
-- Library System: Extend existing tables for roles/skills integration
-- Idempotent: ADD COLUMN IF NOT EXISTS guards throughout

BEGIN;

-- ============================================================
-- 1. capabilities — add missing columns for library system
-- ============================================================
-- Add machine-readable name (unique, slugified label)
ALTER TABLE public.capabilities
  ADD COLUMN IF NOT EXISTS name                TEXT,
  ADD COLUMN IF NOT EXISTS package_slug        TEXT,     -- slug like 'marketing' (keeps existing UUID FK intact)
  ADD COLUMN IF NOT EXISTS source_id           UUID REFERENCES public.capabilities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version             INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by_role     TEXT CHECK (created_by_role IN ('superadmin','org_admin','member')),
  ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_eu_only          BOOLEAN NOT NULL DEFAULT FALSE;

-- Extend scope to include 'package' and 'public'
-- Drop and recreate the scope check constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'capabilities'
      AND tc.constraint_type = 'CHECK'
      AND tc.constraint_name LIKE '%scope%'
  ) THEN
    ALTER TABLE public.capabilities DROP CONSTRAINT IF EXISTS capabilities_scope_check;
  END IF;
END;
$$;

ALTER TABLE public.capabilities
  ADD CONSTRAINT capabilities_scope_check
  CHECK (scope IN ('system','package','org','user','public'));

-- Backfill name from label (slugified) for existing rows
UPDATE public.capabilities
SET
  name = lower(regexp_replace(label, '[^a-zA-Z0-9]+', '_', 'g')),
  created_by_role = 'superadmin'
WHERE name IS NULL;

-- Add UNIQUE on name where deleted_at IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_capabilities_name_active
  ON public.capabilities(name) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. outcomes — add name column (output_type already serves as machine name)
-- ============================================================
ALTER TABLE public.outcomes
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Backfill name from output_type (they're the same concept)
UPDATE public.outcomes SET name = output_type WHERE name IS NULL;

-- ============================================================
-- 3. skills — add missing columns for library system
-- ============================================================
-- Current skills scope: system/package/org/user — add 'public'
DO $$
BEGIN
  ALTER TABLE public.skills DROP CONSTRAINT IF EXISTS skills_scope_check;
EXCEPTION WHEN undefined_object THEN NULL;
END;
$$;

ALTER TABLE public.skills
  ADD CONSTRAINT skills_scope_check
  CHECK (scope IN ('system','package','org','user','public'));

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS icon                       TEXT,
  ADD COLUMN IF NOT EXISTS source_id                  UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public                  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order                 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommended_role_name      TEXT,
  ADD COLUMN IF NOT EXISTS recommended_capability_type TEXT;

-- Add constraint: public skills must have is_public = true
ALTER TABLE public.skills
  DROP CONSTRAINT IF EXISTS skill_public_sync;
ALTER TABLE public.skills
  ADD CONSTRAINT skill_public_sync CHECK (scope != 'public' OR is_public = TRUE);

-- Add index for public skills
CREATE INDEX IF NOT EXISTS idx_skills_public ON public.skills(is_public)
  WHERE is_public = TRUE AND is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_skills_keywords_gin ON public.skills USING gin(trigger_keywords)
  WHERE deleted_at IS NULL;

COMMIT;
```

- [ ] **Step 2: Apply migration**
```bash
cd "C:/Users/timmr/tropenOS" && supabase db push
```
Expected: no errors. If "constraint already exists" errors occur, adjust the DO $$ guards.

- [ ] **Step 3: Verify columns exist**
```bash
supabase db query "SELECT column_name FROM information_schema.columns WHERE table_name = 'capabilities' AND column_name IN ('name','package_slug','source_id','version','deleted_at') ORDER BY column_name;"
supabase db query "SELECT column_name FROM information_schema.columns WHERE table_name = 'outcomes' AND column_name = 'name';"
supabase db query "SELECT column_name FROM information_schema.columns WHERE table_name = 'skills' AND column_name IN ('icon','source_id','is_public','sort_order','recommended_role_name') ORDER BY column_name;"
```

- [ ] **Step 4: Commit**
```bash
git add supabase/migrations/20260319000052_library_extend_existing.sql
git commit -m "feat(db): extend capabilities/outcomes/skills for library system"
```

---

## Task 2: Migration — New Tables (roles, library_versions, settings)

**Files:**
- Create: `supabase/migrations/20260319000053_library_new_tables.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 20260319000053_library_new_tables.sql
-- Library System: New tables — roles, library_versions, org/user library settings
-- Idempotent: CREATE TABLE IF NOT EXISTS throughout

BEGIN;

-- ============================================================
-- 1. roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       TEXT        NOT NULL,
  label                      TEXT        NOT NULL,
  icon                       TEXT,
  description                TEXT,
  scope                      TEXT        NOT NULL
                               CHECK (scope IN ('system','package','org','user','public')),
  organization_id            UUID        REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id                    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  requires_package           TEXT,        -- package slug, e.g. 'marketing'
  source_id                  UUID        REFERENCES public.roles(id) ON DELETE SET NULL,

  -- Core content
  system_prompt              TEXT        NOT NULL,
  domain_keywords            TEXT[]      NOT NULL DEFAULT '{}',
  vocabulary                 TEXT[]      NOT NULL DEFAULT '{}',

  -- Soft recommendations (no FK — just strings for matching)
  preferred_capability_types TEXT[]      NOT NULL DEFAULT '{}',
  preferred_skill_names      TEXT[]      NOT NULL DEFAULT '{}',
  preferred_outcome_types    TEXT[]      NOT NULL DEFAULT '{}',
  recommended_model_class    TEXT        NOT NULL DEFAULT 'deep',

  -- Governance
  is_active                  BOOLEAN     NOT NULL DEFAULT TRUE,
  is_default                 BOOLEAN     NOT NULL DEFAULT FALSE,
  is_public                  BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order                 INTEGER     NOT NULL DEFAULT 0,
  version                    INTEGER     NOT NULL DEFAULT 1,
  created_by_role            TEXT        CHECK (created_by_role IN ('superadmin','org_admin','member')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                 TIMESTAMPTZ,

  CONSTRAINT role_scope_org   CHECK (scope != 'org'    OR organization_id IS NOT NULL),
  CONSTRAINT role_scope_user  CHECK (scope != 'user'   OR user_id IS NOT NULL),
  CONSTRAINT role_public_sync CHECK (scope != 'public' OR is_public = TRUE)
);

CREATE INDEX IF NOT EXISTS idx_roles_scope ON public.roles(scope, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_org ON public.roles(organization_id)
  WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_public ON public.roles(is_public)
  WHERE is_public = TRUE AND is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_keywords ON public.roles USING gin(domain_keywords)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select" ON public.roles;
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      scope IN ('system','public')
      OR scope = 'package'  -- API layer checks requires_package
      OR (scope = 'org' AND organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      ))
      OR (scope = 'user' AND user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "roles_insert" ON public.roles;
CREATE POLICY "roles_insert" ON public.roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope IN ('org','public') AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner','admin')
        AND (organization_id = roles.organization_id OR scope = 'public')
    ))
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "roles_update" ON public.roles;
CREATE POLICY "roles_update" ON public.roles
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (scope = 'user' AND user_id = auth.uid())
      OR (scope = 'org' AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('owner','admin')
          AND organization_id = roles.organization_id
      ))
      OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

DROP POLICY IF EXISTS "roles_delete" ON public.roles;
CREATE POLICY "roles_delete" ON public.roles
  FOR DELETE TO authenticated
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope = 'org' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner','admin')
        AND organization_id = roles.organization_id
    ))
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ============================================================
-- 2. library_versions — APPEND ONLY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.library_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT        NOT NULL CHECK (entity_type IN ('capability','outcome','role','skill')),
  entity_id       UUID        NOT NULL,
  organization_id UUID,
  changed_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  change_type     TEXT        NOT NULL CHECK (change_type IN
                                ('create','update','deactivate','reactivate','publish','unpublish')),
  snapshot        JSONB       NOT NULL,
  change_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- APPEND ONLY — never UPDATE or DELETE
);

CREATE INDEX IF NOT EXISTS idx_lib_versions_entity  ON public.library_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lib_versions_created ON public.library_versions(created_at DESC);

ALTER TABLE public.library_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "library_versions_select" ON public.library_versions;
CREATE POLICY "library_versions_select" ON public.library_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "library_versions_insert" ON public.library_versions;
CREATE POLICY "library_versions_insert" ON public.library_versions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);  -- API layer enforces; service role bypasses

-- ============================================================
-- 3. org_library_settings — unified (replaces capability_org_settings for library)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_library_settings (
  organization_id      UUID    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type          TEXT    NOT NULL CHECK (entity_type IN ('capability','role','skill')),
  entity_id            UUID    NOT NULL,
  is_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured          BOOLEAN NOT NULL DEFAULT FALSE,
  custom_label         TEXT,
  sort_order_override  INTEGER,
  updated_by           UUID    REFERENCES public.users(id),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_org_lib_settings_org ON public.org_library_settings(organization_id);

ALTER TABLE public.org_library_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_lib_settings_select" ON public.org_library_settings;
CREATE POLICY "org_lib_settings_select" ON public.org_library_settings
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "org_lib_settings_write" ON public.org_library_settings;
CREATE POLICY "org_lib_settings_write" ON public.org_library_settings
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() AND role IN ('owner','admin')
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() AND role IN ('owner','admin')
  ));

-- ============================================================
-- 4. user_library_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_library_settings (
  user_id       UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type   TEXT    NOT NULL,
  entity_id     UUID    NOT NULL,
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  last_used_at  TIMESTAMPTZ,
  use_count     INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lib_settings_user ON public.user_library_settings(user_id);

ALTER TABLE public.user_library_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_lib_settings_own" ON public.user_library_settings;
CREATE POLICY "user_lib_settings_own" ON public.user_library_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
```

- [ ] **Step 2: Apply migration**
```bash
cd "C:/Users/timmr/tropenOS" && supabase db push
```

- [ ] **Step 3: Verify tables exist**
```bash
supabase db query "SELECT table_name FROM information_schema.tables WHERE table_name IN ('roles','library_versions','org_library_settings','user_library_settings') ORDER BY table_name;"
```
Expected: 4 rows.

- [ ] **Step 4: Commit**
```bash
git add supabase/migrations/20260319000053_library_new_tables.sql
git commit -m "feat(db): create roles, library_versions, org/user library settings tables"
```

---

## Task 3: Migration — Extend Cards Table

**Files:**
- Create: `supabase/migrations/20260319000054_library_cards.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 20260319000054_library_cards.sql
-- Add role_id and skill_id to workspace cards

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS role_id  UUID REFERENCES public.roles(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cards_role_id  ON public.cards(role_id)  WHERE role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_skill_id ON public.cards(skill_id) WHERE skill_id IS NOT NULL;
```

- [ ] **Step 2: Apply migration**
```bash
cd "C:/Users/timmr/tropenOS" && supabase db push
```

- [ ] **Step 3: Verify**
```bash
supabase db query "SELECT column_name FROM information_schema.columns WHERE table_name = 'cards' AND column_name IN ('role_id','skill_id') ORDER BY column_name;"
```
Expected: 2 rows.

- [ ] **Step 4: Commit**
```bash
git add supabase/migrations/20260319000054_library_cards.sql
git commit -m "feat(db): add role_id and skill_id to workspace cards"
```

---

## Task 4: Migration — Seed Roles + Migrate package_agents

**Files:**
- Create: `supabase/migrations/20260319000055_library_seed.sql`

This seeds:
1. 5 system roles (generalist, strategist, analyst, communicator, project_manager)
2. 2 package roles for marketing (marketing_expert, content_strategist)
3. Migrates existing package_agents (5) → roles (as package scope = 'marketing')
4. Updates existing skills seeds with new columns (icon, recommended_role_name, etc.)

- [ ] **Step 1: Create migration file**

```sql
-- 20260319000055_library_seed.sql
-- Seed library system: system roles (5), package roles (7 total from package_agents migration),
-- update existing skills with new columns

BEGIN;

-- ============================================================
-- 1. System Roles (5)
-- ============================================================
INSERT INTO public.roles
  (name, label, icon, description, scope,
   system_prompt, domain_keywords, vocabulary,
   preferred_capability_types, preferred_skill_names, preferred_outcome_types,
   recommended_model_class, is_active, is_default, sort_order, created_by_role)
VALUES
  ('generalist', 'Generalist', '🦜',
   'Standard-Toro — allgemein und vielseitig',
   'system',
   'Du bist Toro, ein hilfreicher KI-Assistent von Tropen OS. Du unterstützt Teams bei ihrer täglichen Wissensarbeit. Antworte präzise, freundlich und auf Deutsch.',
   '{}', '{}',
   ARRAY['chat','search','writing'], '{}', ARRAY['text','email'],
   'fast', TRUE, TRUE, 1, 'superadmin'),

  ('strategist', 'Stratege', '🏛️',
   'Unternehmensstrategie, Geschäftsmodelle, OKRs',
   'system',
   'Du bist ein erfahrener Unternehmensberater mit Fokus auf Strategie und Geschäftsmodelle. Du denkst in Systemen, Märkten und langen Zeiträumen. Du nutzt Frameworks wie Porter, SWOT, OKR und BCG-Matrix wenn sie nützlich sind — aber erklärst sie nie um ihrer selbst willen. Du stellst immer die Frage: Was ist das eigentliche Ziel? Antworte präzise, strukturiert und auf Deutsch.',
   ARRAY['strategie','geschäftsmodell','okr','markt','wettbewerb','positionierung'],
   ARRAY['SWOT','OKR','KPI','Marktanteil','Positionierung','Value Proposition'],
   ARRAY['reasoning','search'], ARRAY['strategic-analysis'], ARRAY['report','action_plan'],
   'deep', TRUE, FALSE, 2, 'superadmin'),

  ('analyst', 'Analyst', '📊',
   'Daten, Zahlen, Marktforschung, KPIs',
   'system',
   'Du bist ein datengetriebener Analyst. Du denkst in Zahlen, Trends und Kausalitäten. Du hinterfragst Annahmen, forderst Belege und quantifizierst wo möglich. Antworte mit konkreten Zahlen und Quellen wo verfügbar. Auf Deutsch.',
   ARRAY['daten','analyse','statistik','zahlen','kpi','metriken','trends'],
   ARRAY['Signifikanz','Korrelation','CAGR','Konfidenzintervall'],
   ARRAY['data','search','reasoning'], ARRAY['data-analysis'], ARRAY['table','chart','report'],
   'deep', TRUE, FALSE, 3, 'superadmin'),

  ('communicator', 'Kommunikator', '✍️',
   'Texte, Präsentationen, interne Kommunikation',
   'system',
   'Du bist ein erfahrener Kommunikationsexperte. Du schreibst klar, präzise und zielgruppengerecht. Du passt Ton und Stil an den Kontext an — von formell bis informell. Du fragst nach Zielgruppe und gewünschtem Ton bevor du schreibst. Auf Deutsch.',
   ARRAY['text','schreiben','kommunikation','email','präsentation','brief'],
   ARRAY['Tonalität','Zielgruppe','Call-to-Action','Headline'],
   ARRAY['writing','document'], ARRAY['email-writing','report-writing'], ARRAY['text','email','presentation'],
   'deep', TRUE, FALSE, 4, 'superadmin'),

  ('project_manager', 'Projektmanager', '📋',
   'Planung, Meilensteine, Ressourcen, Risiken',
   'system',
   'Du bist ein strukturierter Projektmanager. Du denkst in Arbeitspaketen, Abhängigkeiten und Risiken. Du erstellst klare Aktionspläne mit Verantwortlichen und Terminen. Du fragst immer nach Scope, Ressourcen und Deadline bevor du planst. Auf Deutsch.',
   ARRAY['projekt','planung','meilenstein','ressourcen','risiko','timeline'],
   ARRAY['Meilenstein','Deliverable','Stakeholder','RACI','Critical Path','Sprint'],
   ARRAY['reasoning','writing'], ARRAY['project-planning'], ARRAY['action_plan','table'],
   'fast', TRUE, FALSE, 5, 'superadmin')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. Package Roles — Marketing (migrate from package_agents)
-- ============================================================
-- Insert as roles with scope='package', requires_package='marketing'
-- Source: package_agents (migration 026)
-- We map by name pattern — idempotent via DO NOTHING

INSERT INTO public.roles
  (name, label, icon, description, scope, requires_package,
   system_prompt, domain_keywords, vocabulary,
   preferred_capability_types, preferred_skill_names, preferred_outcome_types,
   recommended_model_class, is_active, sort_order, created_by_role)
SELECT
  -- Derive machine name from package_agent name: strip emoji, lowercase, replace spaces
  lower(regexp_replace(
    trim(regexp_replace(pa.name, '^[^\w\s]+\s*', '', 'g')),
    '\s+', '_', 'g'
  )) AS name,
  pa.name                AS label,
  split_part(pa.name, ' ', 1) AS icon,  -- first emoji
  pa.description,
  'package'              AS scope,
  p.slug                 AS requires_package,
  pa.system_prompt,
  '{}'::TEXT[]           AS domain_keywords,
  '{}'::TEXT[]           AS vocabulary,
  ARRAY['writing','search'] AS preferred_capability_types,
  '{}'::TEXT[]           AS preferred_skill_names,
  ARRAY['text','report'] AS preferred_outcome_types,
  'deep'                 AS recommended_model_class,
  TRUE                   AS is_active,
  pa.display_order       AS sort_order,
  'superadmin'           AS created_by_role
FROM public.package_agents pa
JOIN public.packages p ON p.id = pa.package_id
WHERE p.slug = 'marketing'
  AND NOT EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.requires_package = p.slug
      AND r.scope = 'package'
      AND r.label = pa.name
  );

-- ============================================================
-- 3. Update existing system skills with new columns
-- ============================================================
UPDATE public.skills SET
  icon = '🔍', sort_order = 1, recommended_role_name = 'analyst',
  recommended_capability_type = 'search'
WHERE name = 'competitor_analysis' OR (name = 'deep_analysis' AND scope = 'system');

UPDATE public.skills SET
  icon = '📝', sort_order = 2, recommended_role_name = 'communicator',
  recommended_capability_type = 'writing'
WHERE name = 'summarize' AND scope = 'system';

UPDATE public.skills SET
  icon = '📊', sort_order = 3, recommended_role_name = 'analyst',
  recommended_capability_type = 'search'
WHERE name = 'market_watch' AND scope = 'system';

UPDATE public.skills SET
  icon = '🧩', sort_order = 4, recommended_role_name = 'analyst',
  recommended_capability_type = 'document'
WHERE name = 'knowledge_extract' AND scope = 'system';

UPDATE public.skills SET
  icon = '📄', sort_order = 5, recommended_role_name = 'communicator',
  recommended_capability_type = 'writing'
WHERE name = 'report_write' AND scope = 'system';

UPDATE public.skills SET
  icon = '📱', sort_order = 1, recommended_role_name = 'marketing_expert',
  recommended_capability_type = 'writing'
WHERE name = 'social_media_adapt';

-- ============================================================
-- 4. Seed new system skills (3 from spec not yet in DB)
-- ============================================================
INSERT INTO public.skills
  (name, title, icon, description, scope,
   instructions, quality_criteria, output_type,
   trigger_keywords, recommended_role_name, recommended_capability_type,
   is_active, sort_order, created_by_role)
VALUES
  ('competitor_analysis', 'Wettbewerbsanalyse', '🔍',
   'Strukturierte Analyse von Wettbewerbern und Marktpositionierung',
   'system',
   'Schritt 1: Identifiziere die 3-5 relevantesten Wettbewerber basierend auf dem Kontext.' || chr(10) ||
   'Schritt 2: Analysiere für jeden Wettbewerber: Positionierung, Stärken, Schwächen, Preismodell.' || chr(10) ||
   'Schritt 3: Identifiziere Marktlücken und Differenzierungspotenziale.' || chr(10) ||
   'Schritt 4: Leite 3 konkrete Handlungsempfehlungen ab.',
   'Mind. 3 Wettbewerber analysiert. Quellen angegeben. Konkrete Handlungsempfehlungen.',
   'text',
   ARRAY['wettbewerb','konkurrenz','markt','positionierung','competitor'],
   'analyst', 'search', TRUE, 1, 'superadmin'),

  ('meeting_summary', 'Meeting-Protokoll', '📝',
   'Strukturiertes Protokoll aus Gesprächsnotizen oder Chat-Verlauf',
   'system',
   'Schritt 1: Extrahiere alle besprochenen Themen.' || chr(10) ||
   'Schritt 2: Identifiziere Entscheidungen die getroffen wurden.' || chr(10) ||
   'Schritt 3: Liste alle Aufgaben mit Verantwortlichen und Deadlines.' || chr(10) ||
   'Schritt 4: Notiere offene Fragen für das nächste Meeting.',
   'Alle Entscheidungen erfasst. Alle Aufgaben mit Verantwortlichen. Offene Punkte dokumentiert.',
   'text',
   ARRAY['meeting','protokoll','zusammenfassung','besprechung','notes'],
   'project_manager', 'document', TRUE, 2, 'superadmin'),

  ('weekly_digest', 'Wöchentliche Zusammenfassung', '📅',
   'Kompakte Zusammenfassung der wichtigsten Entwicklungen der Woche',
   'system',
   'Schritt 1: Identifiziere die 5 wichtigsten Entwicklungen/Ereignisse.' || chr(10) ||
   'Schritt 2: Bewerte ihre Relevanz für das Geschäft (hoch/mittel/niedrig).' || chr(10) ||
   'Schritt 3: Leite 3 konkrete Empfehlungen für die nächste Woche ab.' || chr(10) ||
   'Schritt 4: Notiere was beobachtet werden sollte.',
   'Max 500 Wörter. 5 Entwicklungen. 3 Empfehlungen. Handlungsorientiert.',
   'text',
   ARRAY['woche','digest','zusammenfassung','überblick','weekly'],
   'analyst', 'search', TRUE, 3, 'superadmin')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Package Skills — Marketing (3)
-- ============================================================
INSERT INTO public.skills
  (name, title, icon, description, scope, requires_package,
   instructions, quality_criteria, output_type,
   trigger_keywords, recommended_role_name, recommended_capability_type,
   is_active, sort_order, created_by_role)
VALUES
  ('campaign_planning', 'Kampagnenplanung', '🎯',
   'Strukturierter Kampagnenplan von Ziel bis Kanal',
   'package', 'marketing',
   'Schritt 1: Kläre Ziel (Awareness/Lead/Conversion), Budget und Zeitraum.' || chr(10) ||
   'Schritt 2: Definiere Zielgruppe mit Persona und Pain Points.' || chr(10) ||
   'Schritt 3: Entwickle Kernbotschaft und Value Proposition.' || chr(10) ||
   'Schritt 4: Wähle Kanäle und Formate basierend auf Zielgruppe.' || chr(10) ||
   'Schritt 5: Definiere KPIs und Erfolgsmessung.',
   'Klares Ziel definiert. Zielgruppe beschrieben. Kanäle begründet. KPIs messbar.',
   'text',
   ARRAY['kampagne','campaign','launch','marketing','plan'],
   'marketing_expert', 'reasoning', TRUE, 1, 'superadmin'),

  ('brand_voice', 'Brand Voice', '🎨',
   'Markenstimme entwickeln und dokumentieren',
   'package', 'marketing',
   'Schritt 1: Analysiere bestehende Texte auf Muster (falls vorhanden).' || chr(10) ||
   'Schritt 2: Definiere Persönlichkeit: 3-5 Adjektive die die Marke beschreiben.' || chr(10) ||
   'Schritt 3: Lege Ton fest: formell/informell, sachlich/emotional.' || chr(10) ||
   'Schritt 4: Erstelle Dos und Don''ts mit Beispielen.' || chr(10) ||
   'Schritt 5: Schreibe 3 Beispieltexte in der definierten Brand Voice.',
   'Persönlichkeit definiert. Ton klar beschrieben. Dos/Don''ts mit Beispielen. Praxistauglich.',
   'text',
   ARRAY['brand','marke','stimme','tone','voice','stil'],
   'marketing_expert', 'writing', TRUE, 2, 'superadmin'),

  ('newsletter_writing', 'Newsletter schreiben', '📧',
   'Professionellen Newsletter verfassen der konvertiert',
   'package', 'marketing',
   'Schritt 1: Definiere ein klares Thema und den Mehrwert für den Leser.' || chr(10) ||
   'Schritt 2: Schreibe eine Betreffzeile die neugierig macht (max. 50 Zeichen).' || chr(10) ||
   'Schritt 3: Verfasse ein Intro das sofort den Nutzen kommuniziert.' || chr(10) ||
   'Schritt 4: Strukturiere den Inhalt in max. 3 Abschnitte.' || chr(10) ||
   'Schritt 5: Formuliere einen klaren CTA.',
   'Betreffzeile max. 50 Zeichen. Klarer CTA. Lesernutzen im Intro. Max. 400 Wörter.',
   'text',
   ARRAY['newsletter','mailing','email','kampagne','betreff'],
   'content_strategist', 'writing', TRUE, 3, 'superadmin')
ON CONFLICT DO NOTHING;

COMMIT;
```

- [ ] **Step 2: Apply migration**
```bash
cd "C:/Users/timmr/tropenOS" && supabase db push
```

- [ ] **Step 3: Verify seed data**
```bash
supabase db query "SELECT name, scope, is_default FROM public.roles ORDER BY sort_order;"
supabase db query "SELECT COUNT(*) FROM public.roles WHERE scope='system';"
supabase db query "SELECT COUNT(*) FROM public.roles WHERE scope='package';"
```
Expected: 5 system roles (generalist is_default=true), 7 package roles total (2 spec + 5 from package_agents).

- [ ] **Step 4: Commit**
```bash
git add supabase/migrations/20260319000055_library_seed.sql
git commit -m "feat(db): seed library roles, migrate package_agents, extend skills with metadata"
```

---

## Task 5: Validators + library-resolver.ts

**Files:**
- Create: `src/lib/validators/library.ts`
- Create: `src/lib/library-resolver.ts`

- [ ] **Step 1: Create validators**

```typescript
// src/lib/validators/library.ts
import { z } from 'zod'

export const resolveWorkflowSchema = z.object({
  roleId:       z.string().uuid().optional(),
  capabilityId: z.string().uuid(),
  outcomeId:    z.string().uuid(),
  skillId:      z.string().uuid().optional(),
  projectId:    z.string().uuid().optional(),
})

export const createRoleSchema = z.object({
  name:                      z.string().min(1).max(80),
  label:                     z.string().min(1).max(120),
  icon:                      z.string().max(10).optional(),
  description:               z.string().max(500).optional(),
  scope:                     z.enum(['org','user','public']),
  system_prompt:             z.string().min(1).max(8000),
  domain_keywords:           z.array(z.string()).default([]),
  vocabulary:                z.array(z.string()).default([]),
  preferred_capability_types:z.array(z.string()).default([]),
  preferred_skill_names:     z.array(z.string()).default([]),
  preferred_outcome_types:   z.array(z.string()).default([]),
  recommended_model_class:   z.enum(['fast','deep','safe']).default('deep'),
})

export const updateRoleSchema = createRoleSchema.partial().extend({
  is_active:  z.boolean().optional(),
  is_public:  z.boolean().optional(),
  is_default: z.boolean().optional(),
})

export const adoptSchema = z.object({
  scope: z.enum(['org','user']),
  label: z.string().min(1).max(120).optional(),
})

export const createSkillSchema = z.object({
  name:                       z.string().min(1).max(80),
  title:                      z.string().min(1).max(120),
  icon:                       z.string().max(10).optional(),
  description:                z.string().max(500).optional(),
  scope:                      z.enum(['org','user','public']),
  instructions:               z.string().min(1).max(8000),
  quality_criteria:           z.string().max(1000).optional(),
  output_type:                z.enum(['text','json','artifact','notification']).default('text'),
  trigger_keywords:           z.array(z.string()).default([]),
  recommended_role_name:      z.string().max(80).optional(),
  recommended_capability_type:z.string().max(80).optional(),
})

export const updateSkillSchema = createSkillSchema.partial().extend({
  is_active:  z.boolean().optional(),
  is_public:  z.boolean().optional(),
})

export const orgSettingsUpdateSchema = z.object({
  entity_type:        z.enum(['capability','role','skill']),
  entity_id:          z.string().uuid(),
  is_enabled:         z.boolean().optional(),
  is_featured:        z.boolean().optional(),
  custom_label:       z.string().max(120).optional().nullable(),
  sort_order_override:z.number().int().optional().nullable(),
})

export const userSettingsUpdateSchema = z.object({
  entity_type: z.string(),
  entity_id:   z.string().uuid(),
  is_pinned:   z.boolean().optional(),
})
```

- [ ] **Step 2: Create library-resolver.ts**

```typescript
// src/lib/library-resolver.ts
// Central resolver for Chat + Workspace library system.
// Combines Role + Skill + Capability + Outcome into a WorkflowPlan.
// NOTE: does NOT replace capability-resolver.ts (keep that for backward compat)

import { supabaseAdmin } from '@/lib/supabase-admin'

export interface WorkflowPlan {
  model_id:           string     // api_model_id — what you pass to the model SDK
  provider:           'anthropic' | 'openai' | 'google' | 'mistral'
  system_prompt:      string
  tools:              string[]
  card_type:          string
  estimated_cost_eur: number
  budget_sufficient:  boolean
  role_id?:           string
  skill_id?:          string
  capability_id:      string
  outcome_id:         string
}

interface SkillContext {
  org_knowledge:    Record<string, string>
  project_memory:   string | null
  user_preferences: Record<string, string>
}

// DB row types (minimal — only what we need)
interface CapabilityRow {
  id: string
  capability_type: string
  system_prompt_injection: string | null
  tools: string[]
  default_model_id: string | null
}
interface ModelRow {
  id: string
  api_model_id: string
  provider: string
  cost_per_1k_output: number
  is_active: boolean
  is_eu_hosted: boolean
}
interface OutcomeRow {
  id: string
  output_type: string
  card_type: string
  system_prompt_injection: string | null
}
interface RoleRow {
  id: string
  system_prompt: string
  domain_keywords: string[]
}
interface SkillRow {
  id: string
  instructions: string
  trigger_keywords: string[]
  recommended_role_name: string | null
}

const OUTPUT_TO_CARD: Record<string, string> = {
  text: 'text', table: 'table', chart: 'chart', report: 'text',
  presentation: 'text', action_plan: 'kanban', email: 'text', code: 'code', score: 'text',
}

// Main resolution function — call before every LLM call when using library entities
export async function resolveWorkflow(input: {
  roleId?:      string
  capabilityId: string
  outcomeId:    string
  skillId?:     string
  userId:       string
  orgId:        string
  projectId?:   string
}): Promise<WorkflowPlan> {
  // Load all entities in parallel
  const [capResult, outcomeResult, roleResult, skillResult] = await Promise.all([
    supabaseAdmin.from('capabilities')
      .select('id, capability_type, system_prompt_injection, tools, default_model_id')
      .eq('id', input.capabilityId).single(),
    supabaseAdmin.from('outcomes')
      .select('id, output_type, card_type, system_prompt_injection')
      .eq('id', input.outcomeId).single(),
    input.roleId
      ? supabaseAdmin.from('roles')
          .select('id, system_prompt, domain_keywords')
          .eq('id', input.roleId).is('deleted_at', null).single()
      : Promise.resolve({ data: null, error: null }),
    input.skillId
      ? supabaseAdmin.from('skills')
          .select('id, instructions, trigger_keywords, recommended_role_name')
          .eq('id', input.skillId).is('deleted_at', null).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (capResult.error || !capResult.data) throw new Error(`Capability not found: ${input.capabilityId}`)
  if (outcomeResult.error || !outcomeResult.data) throw new Error(`Outcome not found: ${input.outcomeId}`)

  const cap     = capResult.data    as CapabilityRow
  const outcome = outcomeResult.data as OutcomeRow
  const role    = roleResult.data    as RoleRow | null
  const skill   = skillResult.data   as SkillRow | null

  // Resolve model: org override → capability default → haiku fallback
  const modelId = cap.default_model_id
  let model: ModelRow | null = null
  if (modelId) {
    const { data } = await supabaseAdmin.from('model_catalog')
      .select('id, api_model_id, provider, cost_per_1k_output, is_active, is_eu_hosted')
      .eq('id', modelId).single()
    model = data as ModelRow | null
  }
  if (!model) {
    const { data } = await supabaseAdmin.from('model_catalog')
      .select('id, api_model_id, provider, cost_per_1k_output, is_active, is_eu_hosted')
      .eq('api_model_id', 'claude-haiku-4-5-20251001').single()
    model = data as ModelRow | null
  }
  if (!model) throw new Error('No model available')

  const systemPrompt = buildSystemPrompt({ role, skill, cap, outcome }, { org_knowledge: {}, project_memory: null, user_preferences: {} })

  return {
    model_id:           model.api_model_id,
    provider:           model.provider as WorkflowPlan['provider'],
    system_prompt:      systemPrompt,
    tools:              (cap.tools ?? []) as string[],
    card_type:          outcome.card_type ?? OUTPUT_TO_CARD[outcome.output_type] ?? 'text',
    estimated_cost_eur: model.cost_per_1k_output,
    budget_sufficient:  true,  // budget check delegated to AI-chat edge function
    role_id:            role?.id,
    skill_id:           skill?.id,
    capability_id:      cap.id,
    outcome_id:         outcome.id,
  }
}

// Role detection — keyword matching, NO LLM call
export async function detectRole(
  message: string,
  orgId: string,
  userId: string,
): Promise<RoleRow | null> {
  const { data: roles } = await supabaseAdmin.from('roles')
    .select('id, system_prompt, domain_keywords')
    .is('deleted_at', null)
    .eq('is_active', true)
    .in('scope', ['system','package','org','user'])
    .limit(50)

  if (!roles?.length) return null
  const lower = message.toLowerCase()

  let bestRole: RoleRow | null = null
  let bestScore = 0

  for (const role of roles as RoleRow[]) {
    const score = role.domain_keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    if (score > bestScore) { bestScore = score; bestRole = role }
  }
  return bestScore > 0 ? bestRole : null
}

// Skill detection — keyword matching, NO LLM call
export async function detectSkill(
  message: string,
  role: RoleRow | null,
): Promise<SkillRow | null> {
  const { data: skills } = await supabaseAdmin.from('skills')
    .select('id, instructions, trigger_keywords, recommended_role_name')
    .is('deleted_at', null)
    .eq('is_active', true)
    .limit(50)

  if (!skills?.length) return null
  const lower = message.toLowerCase()

  let bestSkill: SkillRow | null = null
  let bestScore = 0

  for (const skill of skills as SkillRow[]) {
    let score = skill.trigger_keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    // Boost if skill matches role recommendation
    if (role && skill.recommended_role_name === role.id) score += 1
    if (score > bestScore) { bestScore = score; bestSkill = skill }
  }
  return bestScore > 0 ? bestSkill : null
}

// Build the final system prompt from all four parts
export function buildSystemPrompt(
  entities: { role: RoleRow | null; skill: SkillRow | null; cap: CapabilityRow; outcome: OutcomeRow },
  context: SkillContext,
): string {
  const parts: string[] = []

  // 1. Role system prompt
  if (entities.role?.system_prompt) {
    parts.push(entities.role.system_prompt)
    parts.push('---')
  }

  // 2. Skill instructions + context
  if (entities.skill?.instructions) {
    parts.push(entities.skill.instructions)
    if (context.project_memory) {
      parts.push(`\nProjekt-Kontext:\n${context.project_memory}`)
    }
    if (Object.keys(context.org_knowledge).length > 0) {
      const orgKnowledge = Object.entries(context.org_knowledge)
        .map(([k, v]) => `${k}: ${v}`).join('\n')
      parts.push(`\nOrg-Wissen:\n${orgKnowledge}`)
    }
    parts.push('---')
  }

  // 3. Capability injection
  if (entities.cap.system_prompt_injection) {
    parts.push(entities.cap.system_prompt_injection)
  }

  // 4. Outcome injection
  if (entities.outcome.system_prompt_injection) {
    parts.push(entities.outcome.system_prompt_injection)
  }

  return parts.join('\n').trim()
}

// Utility: valid outcomes for a capability
export async function getValidOutcomes(capabilityId: string) {
  const { data } = await supabaseAdmin.from('capability_outcomes')
    .select('outcome_id, is_default, sort_order, outcomes(id, label, icon, output_type)')
    .eq('capability_id', capabilityId)
    .order('sort_order')
  return data ?? []
}

// Utility: card type for outcome
export async function resolveCardType(outcomeId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('outcomes')
    .select('card_type, output_type').eq('id', outcomeId).single()
  if (!data) return 'text'
  return data.card_type ?? OUTPUT_TO_CARD[(data as OutcomeRow).output_type] ?? 'text'
}
```

- [ ] **Step 3: TypeScript check**
```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -30
```
Fix any type errors.

- [ ] **Step 4: Commit**
```bash
git add src/lib/validators/library.ts src/lib/library-resolver.ts
git commit -m "feat(lib): add library-resolver.ts and validators"
```

---

## Task 6: Library Read API Routes

**Files:**
- Create: `src/app/api/library/capabilities/route.ts`
- Create: `src/app/api/library/capabilities/[id]/outcomes/route.ts`
- Create: `src/app/api/library/outcomes/route.ts`
- Create: `src/app/api/library/roles/route.ts` (GET only — POST in Task 7)
- Create: `src/app/api/library/skills/route.ts` (GET only — POST in Task 8)

All routes follow this pattern:
```typescript
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
```

- [ ] **Step 1: Create `src/app/api/library/capabilities/route.ts`**

```typescript
// GET /api/library/capabilities
// Returns all capabilities visible to the current user (system + org-enabled + package if active)
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/capabilities')

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin.from('capabilities')
      .select('id, name, label, icon, description, capability_type, scope, package_slug, sort_order, is_active, is_eu_only, system_prompt_injection')
      .is('deleted_at', null)
      .eq('is_active', true)
      .in('scope', ['system', 'package'])  // org/user capabilities in a future iteration
      .order('sort_order')

    if (error) { log.error('fetch capabilities', { error }); throw error }
    return NextResponse.json({ capabilities: data ?? [] })
  } catch (err) {
    log.error('GET /api/library/capabilities', { err })
    return NextResponse.json({ error: 'Failed to load capabilities' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create `src/app/api/library/capabilities/[id]/outcomes/route.ts`**

```typescript
// GET /api/library/capabilities/[id]/outcomes
// Returns valid outcomes for a capability with is_default flag
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getValidOutcomes } from '@/lib/library-resolver'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const outcomes = await getValidOutcomes(id)
    return NextResponse.json({ outcomes })
  } catch {
    return NextResponse.json({ error: 'Failed to load outcomes' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create `src/app/api/library/outcomes/route.ts`**

```typescript
// GET /api/library/outcomes — all system outcomes
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin.from('outcomes')
    .select('id, name, label, icon, description, output_type, card_type, sort_order')
    .eq('is_active', true).order('sort_order')
  return NextResponse.json({ outcomes: data ?? [] })
}
```

- [ ] **Step 4: Create `src/app/api/library/roles/route.ts`**

```typescript
// GET /api/library/roles — roles visible to current user
// POST /api/library/roles — create new role (org_admin or member)
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createRoleSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/roles')

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin.from('roles')
    .select('id, name, label, icon, description, scope, requires_package, system_prompt, domain_keywords, preferred_capability_types, preferred_outcome_types, recommended_model_class, is_active, is_default, is_public, sort_order')
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(`scope.in.(system,public),scope.eq.package,and(scope.eq.org,organization_id.eq.${me.organization_id}),and(scope.eq.user,user_id.eq.${me.id})`)
    .order('sort_order')

  return NextResponse.json({ roles: data ?? [] })
}

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, createRoleSchema)
  if (validated.error) return validated.error

  const { scope, ...rest } = validated.data
  const isAdmin = ['superadmin','owner','admin'].includes(me.role)

  if (scope === 'org' && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { data, error } = await supabaseAdmin.from('roles').insert({
      ...rest,
      scope,
      organization_id: scope === 'org' ? me.organization_id : null,
      user_id: scope === 'user' ? me.id : null,
      created_by_role: me.role === 'superadmin' ? 'superadmin' : isAdmin ? 'org_admin' : 'member',
    }).select('id').single()

    if (error) { log.error('insert role', { error }); throw error }

    // Write version history
    await supabaseAdmin.from('library_versions').insert({
      entity_type: 'role', entity_id: data.id,
      organization_id: me.organization_id, changed_by: me.id,
      change_type: 'create', snapshot: { ...rest, scope },
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    log.error('POST /api/library/roles', { err })
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Create `src/app/api/library/skills/route.ts`** (same pattern as roles/route.ts)

```typescript
// GET /api/library/skills — skills visible to current user
// POST /api/library/skills — create new skill
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createSkillSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/skills')

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin.from('skills')
    .select('id, name, title, icon, description, scope, requires_package, instructions, trigger_keywords, recommended_role_name, recommended_capability_type, output_type, is_active, is_public, is_template, sort_order')
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(`scope.in.(system,public),scope.eq.package,and(scope.eq.org,organization_id.eq.${me.organization_id}),and(scope.eq.user,user_id.eq.${me.id})`)
    .order('sort_order')

  return NextResponse.json({ skills: data ?? [] })
}

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, createSkillSchema)
  if (validated.error) return validated.error

  const { scope, ...rest } = validated.data
  const isAdmin = ['superadmin','owner','admin'].includes(me.role)
  if (scope === 'org' && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data, error } = await supabaseAdmin.from('skills').insert({
      ...rest, scope,
      organization_id: scope === 'org' ? me.organization_id : null,
      user_id: scope === 'user' ? me.id : null,
      created_by_role: me.role === 'superadmin' ? 'superadmin' : isAdmin ? 'org_admin' : 'member',
    }).select('id').single()

    if (error) { log.error('insert skill', { error }); throw error }

    await supabaseAdmin.from('library_versions').insert({
      entity_type: 'skill', entity_id: data.id,
      organization_id: me.organization_id, changed_by: me.id,
      change_type: 'create', snapshot: { ...rest, scope },
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (err) {
    log.error('POST /api/library/skills', { err })
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 })
  }
}
```

- [ ] **Step 6: TypeScript check**
```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 7: Commit**
```bash
git add src/app/api/library/
git commit -m "feat(api): add library read endpoints (capabilities, outcomes, roles, skills)"
```

---

## Task 7: Roles CRUD + Community Routes

**Files:**
- Create: `src/app/api/library/roles/[id]/route.ts`
- Create: `src/app/api/library/roles/[id]/adopt/route.ts`
- Create: `src/app/api/library/roles/[id]/publish/route.ts`
- Create: `src/app/api/library/roles/[id]/unpublish/route.ts`
- Create: `src/app/api/library/roles/[id]/import/route.ts`

- [ ] **Step 1: Create `src/app/api/library/roles/[id]/route.ts`**

```typescript
// GET /api/library/roles/[id] — single role
// PATCH /api/library/roles/[id] — update role
// DELETE /api/library/roles/[id] — soft delete
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { updateRoleSchema } from '@/lib/validators/library'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/roles/[id]')
type Params = { params: Promise<{ id: string }> }

async function checkOwnership(roleId: string, userId: string, orgId: string, userRole: string) {
  const { data, error } = await supabaseAdmin.from('roles')
    .select('id, scope, user_id, organization_id').eq('id', roleId).is('deleted_at', null).single()
  if (error || !data) return null
  const r = data as { id: string; scope: string; user_id: string | null; organization_id: string | null }
  const isSuperadmin = userRole === 'superadmin'
  const isOrgAdmin = ['owner','admin'].includes(userRole) && r.organization_id === orgId
  const isOwner = r.user_id === userId
  if (isSuperadmin || isOrgAdmin || isOwner) return r
  return null
}

export async function GET(_req: Request, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { data } = await supabaseAdmin.from('roles').select('*').eq('id', id).is('deleted_at', null).single()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ role: data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const role = await checkOwnership(id, me.id, me.organization_id, me.role)
  if (!role) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

  const validated = await validateBody(req, updateRoleSchema)
  if (validated.error) return validated.error

  const snapshot = { ...role }
  const { error } = await supabaseAdmin.from('roles')
    .update({ ...validated.data, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) { log.error('update role', { error }); return NextResponse.json({ error: 'Update failed' }, { status: 500 }) }

  await supabaseAdmin.from('library_versions').insert({
    entity_type: 'role', entity_id: id,
    organization_id: me.organization_id, changed_by: me.id,
    change_type: 'update', snapshot,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const role = await checkOwnership(id, me.id, me.organization_id, me.role)
  if (!role) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

  const { error } = await supabaseAdmin.from('roles')
    .update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id)
  if (error) { log.error('delete role', { error }); return NextResponse.json({ error: 'Delete failed' }, { status: 500 }) }

  await supabaseAdmin.from('library_versions').insert({
    entity_type: 'role', entity_id: id,
    organization_id: me.organization_id, changed_by: me.id,
    change_type: 'deactivate', snapshot: { id, scope: role.scope },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `src/app/api/library/roles/[id]/adopt/route.ts`**

```typescript
// POST /api/library/roles/[id]/adopt — copy as org or user scope
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { adoptSchema } from '@/lib/validators/library'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const validated = await validateBody(req, adoptSchema)
  if (validated.error) return validated.error

  const { scope, label } = validated.data
  if (scope === 'org' && !['superadmin','owner','admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: source } = await supabaseAdmin.from('roles')
    .select('*').eq('id', id).is('deleted_at', null).single()
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const s = source as Record<string, unknown>
  const { data: copy, error } = await supabaseAdmin.from('roles').insert({
    name:                      s.name,
    label:                     label ?? s.label,
    icon:                      s.icon,
    description:               s.description,
    scope,
    organization_id:           scope === 'org' ? me.organization_id : null,
    user_id:                   scope === 'user' ? me.id : null,
    system_prompt:             s.system_prompt,
    domain_keywords:           s.domain_keywords ?? [],
    vocabulary:                s.vocabulary ?? [],
    preferred_capability_types:s.preferred_capability_types ?? [],
    preferred_skill_names:     s.preferred_skill_names ?? [],
    preferred_outcome_types:   s.preferred_outcome_types ?? [],
    recommended_model_class:   s.recommended_model_class ?? 'deep',
    source_id:                 id,
    created_by_role:           ['superadmin','owner','admin'].includes(me.role) ? 'org_admin' : 'member',
  }).select('id').single()

  if (error) return NextResponse.json({ error: 'Adopt failed' }, { status: 500 })
  return NextResponse.json({ id: copy.id }, { status: 201 })
}
```

- [ ] **Step 3: Create publish / unpublish / import routes**

```typescript
// src/app/api/library/roles/[id]/publish/route.ts
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: role } = await supabaseAdmin.from('roles')
    .select('id, scope, user_id, organization_id').eq('id', id).is('deleted_at', null).single()
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = role as { scope: string; user_id: string | null; organization_id: string | null }
  const canPublish = me.role === 'superadmin'
    || (r.user_id === me.id)
    || (['owner','admin'].includes(me.role) && r.organization_id === me.organization_id)
  if (!canPublish) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabaseAdmin.from('roles').update({ scope: 'public', is_public: true, updated_at: new Date().toISOString() }).eq('id', id)
  await supabaseAdmin.from('library_versions').insert({
    entity_type: 'role', entity_id: id, organization_id: me.organization_id,
    changed_by: me.id, change_type: 'publish', snapshot: { id },
  })
  return NextResponse.json({ ok: true })
}
```

```typescript
// src/app/api/library/roles/[id]/unpublish/route.ts
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: role } = await supabaseAdmin.from('roles')
    .select('id, scope, user_id, organization_id, source_id').eq('id', id).is('deleted_at', null).single()
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = role as { scope: string; user_id: string | null; organization_id: string | null; source_id: string | null }
  // Revert to original scope based on who owns it
  const revertScope = r.user_id === me.id ? 'user' : 'org'
  const canUnpublish = me.role === 'superadmin' || r.user_id === me.id
    || (['owner','admin'].includes(me.role) && r.organization_id === me.organization_id)
  if (!canUnpublish) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabaseAdmin.from('roles').update({ scope: revertScope, is_public: false, updated_at: new Date().toISOString() }).eq('id', id)
  await supabaseAdmin.from('library_versions').insert({
    entity_type: 'role', entity_id: id, organization_id: me.organization_id,
    changed_by: me.id, change_type: 'unpublish', snapshot: { id },
  })
  return NextResponse.json({ ok: true })
}
```

```typescript
// src/app/api/library/roles/[id]/import/route.ts
// Creates a user-scope copy of a public or system role
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: source } = await supabaseAdmin.from('roles')
    .select('*').eq('id', id).is('deleted_at', null).single()
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const s = source as Record<string, unknown>
  if (!['system','public','package'].includes(s.scope as string)) {
    return NextResponse.json({ error: 'Can only import system/public/package roles' }, { status: 422 })
  }

  const { data: copy, error } = await supabaseAdmin.from('roles').insert({
    name: s.name, label: s.label, icon: s.icon, description: s.description,
    scope: 'user', user_id: me.id,
    system_prompt: s.system_prompt, domain_keywords: s.domain_keywords ?? [],
    vocabulary: s.vocabulary ?? [], preferred_capability_types: s.preferred_capability_types ?? [],
    preferred_skill_names: s.preferred_skill_names ?? [],
    preferred_outcome_types: s.preferred_outcome_types ?? [],
    recommended_model_class: s.recommended_model_class ?? 'deep',
    source_id: id, created_by_role: 'member',
  }).select('id').single()

  if (error) return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  return NextResponse.json({ id: copy.id }, { status: 201 })
}
```

- [ ] **Step 4: TypeScript check**
```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**
```bash
git add src/app/api/library/roles/
git commit -m "feat(api): add roles CRUD, adopt, publish/unpublish, import routes"
```

---

## Task 8: Skills CRUD + Community Routes

**Files:**
- Create: `src/app/api/library/skills/[id]/route.ts`
- Create: `src/app/api/library/skills/[id]/adopt/route.ts`
- Create: `src/app/api/library/skills/[id]/publish/route.ts`
- Create: `src/app/api/library/skills/[id]/unpublish/route.ts`
- Create: `src/app/api/library/skills/[id]/import/route.ts`

> **Pattern:** Identical structure to roles routes (Task 7). Replace `roles` with `skills`, `role` with `skill`, `updateRoleSchema` with `updateSkillSchema`, `createRoleSchema` with `createSkillSchema`. The adopt/publish/unpublish/import routes are identical except for `entity_type: 'skill'` in library_versions.

- [ ] **Step 1: Create all 5 skill routes** following the roles pattern exactly

Key differences from roles:
- `skills/[id]/route.ts`: uses `updateSkillSchema`; `checkOwnership` checks `user_id` and `organization_id` same way
- `skills/[id]/adopt/route.ts`: copies `instructions`, `trigger_keywords`, `output_type`, `recommended_role_name`, `recommended_capability_type`
- Version tracking: `entity_type: 'skill'`

- [ ] **Step 2: TypeScript check**
```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/app/api/library/skills/
git commit -m "feat(api): add skills CRUD, adopt, publish/unpublish, import routes"
```

---

## Task 9: Resolve + Settings + Versions Routes

**Files:**
- Create: `src/app/api/library/resolve/route.ts`
- Create: `src/app/api/library/org-settings/route.ts`
- Create: `src/app/api/library/user-settings/route.ts`
- Create: `src/app/api/library/versions/[entity_type]/[entity_id]/route.ts`

- [ ] **Step 1: Create `src/app/api/library/resolve/route.ts`**

```typescript
// POST /api/library/resolve
// Full library resolution: role + capability + outcome + skill → WorkflowPlan
// Replaces /api/capabilities/resolve when role or skill is involved
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { resolveWorkflowSchema } from '@/lib/validators/library'
import { resolveWorkflow } from '@/lib/library-resolver'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/resolve')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, resolveWorkflowSchema)
  if (validated.error) return validated.error

  try {
    const plan = await resolveWorkflow({
      ...validated.data,
      userId: me.id,
      orgId: me.organization_id,
    })
    return NextResponse.json(plan)
  } catch (err) {
    log.error('resolveWorkflow failed', { err })
    return NextResponse.json({ error: 'Failed to resolve workflow' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create `src/app/api/library/org-settings/route.ts`**

```typescript
// GET /api/library/org-settings — org library configuration
// PATCH /api/library/org-settings — update single entity setting
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { orgSettingsUpdateSchema } from '@/lib/validators/library'

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin.from('org_library_settings')
    .select('*').eq('organization_id', me.organization_id)

  return NextResponse.json({ settings: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['superadmin','owner','admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const validated = await validateBody(req, orgSettingsUpdateSchema)
  if (validated.error) return validated.error

  const { entity_type, entity_id, ...updates } = validated.data
  await supabaseAdmin.from('org_library_settings').upsert({
    organization_id: me.organization_id, entity_type, entity_id,
    ...updates, updated_by: me.id, updated_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,entity_type,entity_id' })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `src/app/api/library/user-settings/route.ts`**

```typescript
// GET /api/library/user-settings — user library preferences
// PATCH /api/library/user-settings — update pin/last_used
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { userSettingsUpdateSchema } from '@/lib/validators/library'

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin.from('user_library_settings')
    .select('*').eq('user_id', me.id)
  return NextResponse.json({ settings: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const validated = await validateBody(req, userSettingsUpdateSchema)
  if (validated.error) return validated.error

  const { entity_type, entity_id, ...updates } = validated.data
  await supabaseAdmin.from('user_library_settings').upsert({
    user_id: me.id, entity_type, entity_id, ...updates,
    last_used_at: new Date().toISOString(),
  }, { onConflict: 'user_id,entity_type,entity_id' })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create `src/app/api/library/versions/[entity_type]/[entity_id]/route.ts`**

```typescript
// GET /api/library/versions/[entity_type]/[entity_id]
// Superadmin only — full version history for any entity
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Params = { params: Promise<{ entity_type: string; entity_id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { entity_type, entity_id } = await params
  const allowed = ['capability','outcome','role','skill']
  if (!allowed.includes(entity_type)) return NextResponse.json({ error: 'Invalid entity_type' }, { status: 400 })

  const { data } = await supabaseAdmin.from('library_versions')
    .select('id, change_type, change_reason, snapshot, created_at, changed_by')
    .eq('entity_type', entity_type).eq('entity_id', entity_id)
    .order('created_at', { ascending: false }).limit(50)

  return NextResponse.json({ versions: data ?? [] })
}
```

- [ ] **Step 5: TypeScript check**
```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**
```bash
git add src/app/api/library/resolve/ src/app/api/library/org-settings/ src/app/api/library/user-settings/ src/app/api/library/versions/
git commit -m "feat(api): add library resolve, settings, and versions endpoints"
```

---

## Task 10: Chat Input — "Agent" → "Rolle"

**Files:**
- Modify: `src/components/workspace/ChatInput.tsx`
- Modify: `src/lib/workspace-chat.ts`
- Modify: `src/hooks/useWorkspaceState.ts`

> **Goal:** Replace `package_agents` + `agents` as the chat picker source with `roles` from `/api/library/roles`. Rename "Agent" label to "Rolle". Keep the same UI structure — just change data source and label.
> **No Breaking Change:** `agent_id` can still be passed to `ai-chat` edge function if needed. We rename the client-side state to `activeRoleId` and pass `role_id` to the edge function.

- [ ] **Step 1: Read the full ChatInput.tsx**

Read `src/components/workspace/ChatInput.tsx` fully before modifying.

- [ ] **Step 2: Read useWorkspaceState.ts (lines 30-50)**

Understand current `activeAgentId` state and how it flows through.

- [ ] **Step 3: Modify ChatInput.tsx**

Key changes:
1. Replace `Agent` / `PackageAgent` interfaces with `Role`:
```typescript
interface Role {
  id: string
  label: string
  icon: string | null
  description: string | null
  scope: string
  requires_package: string | null
}
```

2. Replace `useState<Agent[]>([])` and `useState<PackageAgent[]>([])` with `useState<Role[]>([])`

3. Replace fetch from `/api/packages/agents` with fetch from `/api/library/roles`:
```typescript
useEffect(() => {
  fetch('/api/library/roles')
    .then(r => r.ok ? r.json() : null)
    .then((d: { roles: Role[] } | null) => {
      if (d) setRoles(d.roles)
    })
    .catch(() => null)
}, [])
```

4. Change prop name in ChatInputProps: `activeAgentId` → `activeRoleId`, `onSetActiveAgentId` → `onSetActiveRoleId`

5. In the dropdown UI: change label from "Agent" to "Rolle":
```tsx
// Button label
{activeRole ? (
  <><span>{activeRole.icon}</span> {activeRole.label}</>
) : (
  <><Robot size={14} /> Keine Rolle</>
)}
```

6. In the role list rendering: group by scope (system vs package vs org vs user), show scope badge.

7. Remove `packageGroups` grouping logic — just show flat list grouped by scope.

- [ ] **Step 4: Modify useWorkspaceState.ts**

Rename `activeAgentId` → `activeRoleId` and `setActiveAgentId` → `setActiveRoleId` throughout.
Update the return value to expose `activeRoleId` and `setActiveRoleId`.
Update line 255 (where `conv.agent_id` sets the active agent): `setActiveRoleId(conv.agent_id ?? null)` — keep this for backward compat with existing conversations that have agent_id.

- [ ] **Step 5: Modify workspace-chat.ts**

Replace `activeAgentId` with `activeRoleId` in `ChatActionsCtx` interface and usage.
Line 97: change `agent_id: ctx.activeAgentId ?? undefined` → `role_id: ctx.activeRoleId ?? undefined`

- [ ] **Step 6: Update all call sites**

Search for any other places that pass `activeAgentId` / `onSetActiveAgentId`:
- `src/components/workspace/ChatArea.tsx`
- `src/components/workspace/EmptyState.tsx`
- `src/components/workspace/WorkspaceLayout.tsx`

Update prop names in these files.

- [ ] **Step 7: TypeScript check**
```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -30
```
Fix all type errors.

- [ ] **Step 8: Design system check**
```bash
cd "C:/Users/timmr/tropenOS" && node scripts/ci/lint-design-system.mjs 2>&1 | grep -i "error\|chatinput" | head -20
```

- [ ] **Step 9: Commit**
```bash
git add src/components/workspace/ src/lib/workspace-chat.ts src/hooks/useWorkspaceState.ts
git commit -m "feat(chat): rename Agent → Rolle picker, load from /api/library/roles"
```

---

## Task 11: CLAUDE.md Update + Architect Log

**Files:**
- Modify: `CLAUDE.md` — add Library System section
- Modify: `docs/architect-log.md` — add entry

- [ ] **Step 1: Add Library System section to CLAUDE.md**

Read CLAUDE.md first. After the "Agenten-System" section, add:

```markdown
### Library-System (Capability + Outcome + Role + Skill)

Vier eigenständige Entitäten — alle resolviert in `src/lib/library-resolver.ts`:

| Entität | Frage | Verwaltet von |
|---------|-------|--------------|
| capabilities | WAS kann Toro? (Modell, Tools) | Superadmin only |
| outcomes | WAS kommt raus? (Format, Karten-Typ) | Superadmin only |
| roles | WER ist Toro? (Fachexpertise, System-Prompt) | Org-Admin + Member |
| skills | WIE arbeitet Toro? (Schritt-für-Schritt) | Org-Admin + Member |

**Resolver:** `src/lib/library-resolver.ts`
**Vor jedem LLM-Call:** `POST /api/library/resolve { capabilityId, outcomeId, roleId?, skillId? }`

**Scope-Hierarchie:** system → package → org → user → public
**Community (scope='public'):** explizites opt-in, nie automatisch

**Abgrenzung Rollen vs. Agenten:**
- Rolle = Toros Fachexpertise im Chat (interaktiv)
- Agent = autonome Ausführung ohne User-Interaktion (Scheduled/Reactive)

**Keine FK-Verbindung** zwischen skills und capabilities.
Skills empfehlen `recommended_capability_type` als String — nie als FK.

**System-Prompt-Baulogik:**
1. Rolle.system_prompt
2. Skill.instructions + Skill-Kontext
3. Capability.system_prompt_injection
4. Outcome.system_prompt_injection

**API routes:**
- `GET /api/library/capabilities` — alle sichtbaren Capabilities
- `GET /api/library/roles` — alle sichtbaren Rollen (ersetzt package_agents)
- `GET /api/library/skills` — alle sichtbaren Skills
- `POST /api/library/resolve` — WorkflowPlan auflösen
- `POST /api/library/roles/[id]/adopt` — kopieren als eigene Basis
- `POST /api/library/roles/[id]/import` — public/system als user-Kopie importieren

**Migrationen:**
| Datei | Inhalt |
|-------|--------|
| 20260319000052_library_extend_existing.sql | ALTER capabilities/outcomes/skills |
| 20260319000053_library_new_tables.sql | CREATE roles/library_versions/settings |
| 20260319000054_library_cards.sql | cards: role_id + skill_id |
| 20260319000055_library_seed.sql | Seed roles (7 system+package), package_agents → roles |
```

- [ ] **Step 2: Add entry to docs/architect-log.md**

```markdown
## 2026-03-19 — Library-System Fundament (Prompt 01)

**Was gebaut wurde:**
- 4 Migrations (052–055): extend capabilities/outcomes/skills, new roles/library_versions tables, cards extension, seed data
- 7 Rollen geseedet: 5 system (Generalist default, Stratege, Analyst, Kommunikator, Projektmanager) + 2 package marketing (Marketing Expert, Content Stratege)
- 5 package_agents → roles migriert (Campaign Planner, Brand Voice Writer, Social Adapter, Newsletter Spezialist, Copy Texter)
- 3 neue system-Skills + 3 package-Skills Marketing
- library-resolver.ts: resolveWorkflow(), detectRole(), detectSkill(), buildSystemPrompt()
- 20+ API routes unter /api/library/*
- Chat Input: "Agent" → "Rolle", lädt aus /api/library/roles

**Warum:**
Library-System ist das Fundament für Chat, Workspace, Agenten und Feeds.
Rollen geben Toro Fachexpertise. Skills geben Toro Schritt-für-Schritt-Anweisungen.
Capabilities + Outcomes regeln Modell-Routing und Output-Format.

**Architektur-Entscheide:**
- library-resolver.ts ist SEPARATEVON capability-resolver.ts (backward compat)
- model_catalog hat UUID PK (nicht TEXT wie in Spec — bestehende FK beibehalten)
- capabilities.requires_package: neues TEXT-Feld package_slug (UUID FK bleibt erhalten)
- skills.context_requirements bleibt TEXT (ALTER COLUMN TEXT→JSONB not done — would break existing data)
- package_agents Tabelle bleibt erhalten (nur Kopie als roles, keine Löschung)
```

- [ ] **Step 3: TypeScript final check**
```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 4: Design system lint**
```bash
cd "C:/Users/timmr/tropenOS" && node scripts/ci/lint-design-system.mjs 2>&1 | tail -5
```

- [ ] **Step 5: Commit**
```bash
git add CLAUDE.md docs/architect-log.md
git commit -m "docs: update CLAUDE.md and architect-log for library system"
```

---

## Definition of Done

- [ ] Migration 052 applied — capabilities/outcomes/skills extended
- [ ] Migration 053 applied — roles, library_versions, org/user settings tables created
- [ ] Migration 054 applied — cards has role_id + skill_id
- [ ] Migration 055 applied — 7 roles seeded, 5 package_agents migrated as roles, new skills seeded
- [ ] `resolveWorkflow()` builds correct WorkflowPlan with all 4 injections
- [ ] `detectRole()` matches keywords without LLM call
- [ ] `detectSkill()` matches keywords without LLM call
- [ ] `buildSystemPrompt()` combines Role → Skill → Capability → Outcome in order
- [ ] `POST /api/library/resolve` returns WorkflowPlan
- [ ] `GET /api/library/roles` returns system + org + user roles
- [ ] `POST /api/library/roles/[id]/adopt` creates copy with correct scope
- [ ] `POST /api/library/roles/[id]/publish` sets scope='public', is_public=true
- [ ] `POST /api/library/roles/[id]/import` creates user-scope copy
- [ ] Skills CRUD routes work identically (same patterns as roles)
- [ ] library_versions written on every create/update/delete/publish/unpublish
- [ ] Chat Input shows "Keine Rolle" / role label (not "Agent")
- [ ] Chat Input loads from `/api/library/roles` (not package_agents)
- [ ] `tsc --noEmit` clean
- [ ] `lint-design-system.mjs` 0 new errors
- [ ] CLAUDE.md updated
- [ ] Architect log updated
