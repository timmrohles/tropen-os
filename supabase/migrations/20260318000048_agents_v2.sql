-- supabase/migrations/20260318000048_agents_v2.sql
-- Plan J2b: agents ALTER + agent_runs + Marketing-Paket-Seed
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Make user_id nullable (system/package agents have no owner) ──────────
ALTER TABLE agents ALTER COLUMN user_id DROP NOT NULL;

-- ─── 2. Drop old visibility-dependent RLS policies FIRST ────────────────────
-- (must happen before dropping visibility column)
DROP POLICY IF EXISTS "agents_select"      ON agents;
DROP POLICY IF EXISTS "agents_insert"      ON agents;
DROP POLICY IF EXISTS "agents_update"      ON agents;
DROP POLICY IF EXISTS "agents_delete"      ON agents;
-- agent_skills policies from migration 047 reference agents.visibility
DROP POLICY IF EXISTS "agent_skills_select" ON agent_skills;
DROP POLICY IF EXISTS "agent_skills_insert" ON agent_skills;
DROP POLICY IF EXISTS "agent_skills_delete" ON agent_skills;

-- ─── 3. Add scope column (replaces visibility) ───────────────────────────────
ALTER TABLE agents ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'user';

-- 3a. Migrate visibility → scope
UPDATE agents SET scope = CASE
  WHEN visibility = 'org'  THEN 'org'
  ELSE 'user'
END;

-- 3b. Drop old visibility column
ALTER TABLE agents DROP COLUMN IF EXISTS visibility;

-- 3c. Add scope constraint
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_scope_check;
ALTER TABLE agents ADD CONSTRAINT agents_scope_check
  CHECK (scope IN ('system','package','org','user'));

-- ─── 4. Add new columns ───────────────────────────────────────────────────────
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS emoji              TEXT DEFAULT '🤖',
  ADD COLUMN IF NOT EXISTS is_active          BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS trigger_type       TEXT
    CHECK (trigger_type IN ('scheduled','reactive','contextual')),
  ADD COLUMN IF NOT EXISTS trigger_config     JSONB,
  ADD COLUMN IF NOT EXISTS capability_steps   JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS input_sources      JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS output_targets     JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS requires_approval  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_cost_eur       NUMERIC DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS requires_package   TEXT,
  ADD COLUMN IF NOT EXISTS created_by_role    TEXT
    CHECK (created_by_role IN ('superadmin','org_admin','member','toro')),
  ADD COLUMN IF NOT EXISTS source_agent_id    UUID REFERENCES agents(id),
  ADD COLUMN IF NOT EXISTS is_template        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_run_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_run_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS run_count          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at         TIMESTAMPTZ;

-- ─── 5. New RLS policies for agents (scope-based) ────────────────────────────
-- SELECT: system + package visible to all; org = same org; user = own rows
CREATE POLICY agents_select ON agents FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      scope IN ('system', 'package')
      OR (scope = 'org' AND organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      ))
      OR (scope = 'user' AND user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

-- INSERT: authenticated users; system/package only by superadmin
CREATE POLICY agents_insert ON agents FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      scope NOT IN ('system','package')
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

-- UPDATE: own rows + org-admin for org-scope + superadmin
CREATE POLICY agents_update ON agents FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (scope = 'org' AND organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('owner','admin')
    ))
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- DELETE (soft): own rows + superadmin
CREATE POLICY agents_delete ON agents FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ─── Recreate agent_skills RLS policies (scope-based) ───────────────────────
CREATE POLICY "agent_skills_select" ON agent_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.id = agent_skills.agent_id
        AND (
          a.scope IN ('system', 'package')
          OR (a.scope = 'org' AND a.organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
          ))
          OR (a.scope = 'user' AND a.user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
          )
        )
    )
  );

CREATE POLICY "agent_skills_insert" ON agent_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.id = agent_skills.agent_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_skills_delete" ON agent_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.id = agent_skills.agent_id AND a.user_id = auth.uid()
    )
  );

-- ─── 6. CREATE agent_runs (APPEND ONLY) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID REFERENCES agents(id) ON DELETE CASCADE,
  organization_id     UUID REFERENCES organizations(id),
  user_id             UUID,
  triggered_by        TEXT NOT NULL
    CHECK (triggered_by IN ('schedule','event','manual','webhook','n8n')),
  trigger_payload     JSONB,
  status              TEXT NOT NULL
    CHECK (status IN ('running','success','error','skipped','cancelled')),
  steps_completed     INTEGER DEFAULT 0,
  steps_total         INTEGER DEFAULT 0,
  input_summary       JSONB,
  output_artifact_id  UUID,
  output_summary      TEXT,
  token_usage         JSONB,
  cost_eur            NUMERIC,
  error_message       TEXT,
  error_step          INTEGER,
  started_at          TIMESTAMPTZ DEFAULT now(),
  completed_at        TIMESTAMPTZ
  -- APPEND ONLY — niemals UPDATE oder DELETE
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent   ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_org     ON agent_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status  ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started ON agent_runs(started_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_runs_select ON agent_runs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY agent_runs_insert ON agent_runs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- ─── 7. Seed: 5 Marketing-Paket Agenten ──────────────────────────────────────
-- Migriert aus package_agents (Migration 026) → agents als scope='package'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM agents WHERE scope = 'package' AND requires_package = 'marketing'
  ) THEN
    INSERT INTO agents (
      scope, name, description, system_prompt, emoji,
      is_active, is_template, requires_package, created_by_role,
      display_order
    ) VALUES
      (
        'package',
        'Campaign Planner',
        'Kampagnen von der Idee bis zum Briefing strukturieren',
        'Du bist ein erfahrener Marketing-Stratege. Du hilfst dabei, Kampagnen von der Idee bis zum Briefing zu strukturieren. Du denkst in Zielen, Zielgruppen, Botschaften und Kanälen. Du stellst immer zuerst klärende Fragen bevor du eine Kampagne entwirfst.',
        '🎯', true, true, 'marketing', 'superadmin', 0
      ),
      (
        'package',
        'Brand Voice Writer',
        'Konsistente Markenstimme entwickeln und anwenden',
        'Du bist ein Brand-Voice-Experte. Du hilfst dabei, eine konsistente Markenstimme zu entwickeln, zu dokumentieren und auf alle Texte anzuwenden. Du analysierst bestehende Texte, erkennst Muster und formulierst klare Regeln für Ton, Sprache und Persönlichkeit.',
        '✍️', true, true, 'marketing', 'superadmin', 1
      ),
      (
        'package',
        'Social Adapter',
        'Inhalte für LinkedIn, Instagram, X und TikTok adaptieren',
        'Du bist ein Social-Media-Spezialist. Du adaptierst Inhalte für verschiedene Plattformen und deren spezifische Formate, Tonalitäten und Algorithmus-Logiken. Du kennst die Unterschiede zwischen LinkedIn, Instagram, X und TikTok genau.',
        '📱', true, true, 'marketing', 'superadmin', 2
      ),
      (
        'package',
        'Newsletter Spezialist',
        'Öffnungsraten, Klickrate und Leserbindung optimieren',
        'Du bist ein Newsletter-Experte mit Fokus auf Öffnungsraten, Klickrate und Leserbindung. Du schreibst Betreffzeilen die neugierig machen, Intros die zum Lesen verführen und CTAs die konvertieren. Du kennst die Unterschiede zwischen B2B und B2C Newslettern.',
        '📧', true, true, 'marketing', 'superadmin', 3
      ),
      (
        'package',
        'Copy Texter',
        'Headlines, Ads und Landingpage-Texte die verkaufen',
        'Du bist ein erfahrener Werbetexter. Du schreibst Headlines, Ads, Landingpage-Texte und CTAs die verkaufen. Du arbeitest mit bewährten Frameworks wie AIDA, PAS und StoryBrand. Du fragst immer nach Zielgruppe, Angebot und gewünschter Reaktion bevor du schreibst.',
        '✏️', true, true, 'marketing', 'superadmin', 4
      );
  END IF;
END $$;
