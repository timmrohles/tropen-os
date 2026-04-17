-- Beta Pilot: waitlist, feedback, user_prefs onboarding flags
-- Sprint 11 — 2026-04-17

-- ── beta_waitlist ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beta_waitlist (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  source     TEXT        DEFAULT 'beta-landing',
  platform   TEXT,                        -- 'lovable' | 'bolt' | 'cursor' | 'other'
  message    TEXT,                        -- optional free-text field
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE beta_waitlist ENABLE ROW LEVEL SECURITY;

-- Public: anyone can join the waitlist
CREATE POLICY "beta_waitlist_public_insert"
  ON beta_waitlist FOR INSERT
  WITH CHECK (true);

-- Read: superadmin only
CREATE POLICY "beta_waitlist_superadmin_read"
  ON beta_waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ── beta_feedback ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beta_feedback (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id),
  audit_run_id UUID        REFERENCES audit_runs(id),
  ratings      JSONB       DEFAULT '{}',  -- { findings_helpful, findings_unclear, missing_something, other }
  message      TEXT,
  platform     TEXT,                      -- 'lovable' | 'bolt' | 'cursor' | 'other'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Insert: own user only
CREATE POLICY "beta_feedback_own_insert"
  ON beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Read: superadmin only
CREATE POLICY "beta_feedback_superadmin_read"
  ON beta_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ── user_preferences: beta onboarding flags ──────────────────────────────────
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS beta_onboarding_done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_beta_user         BOOLEAN DEFAULT false;
