-- Migration 007: Organization Settings + User Preferences (Onboarding + Co-Branding)
-- Vollständig idempotent (IF NOT EXISTS + DROP/CREATE für Policies)
--
-- HINWEIS: Erstelle manuell in Supabase Dashboard → Storage:
--   Bucket "organization-logos" (Public, max 2 MB, allowed types: image/*)

-- Fix: Erlaubt eingeladenen Usern, ihren eigenen Profil-Eintrag beim Onboarding zu erstellen.
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ────────────────────────────────────────────────────
-- Organisation Einstellungen (Co-Branding + Onboarding)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID REFERENCES organizations(id) UNIQUE,
  logo_url                TEXT,
  primary_color           TEXT DEFAULT '#14b8a6',
  organization_display_name TEXT,
  ai_guide_name           TEXT DEFAULT 'Toro',
  ai_guide_description    TEXT DEFAULT 'Dein KI-Guide durch den Informationsdschungel',
  onboarding_completed    BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_settings_own_org" ON organization_settings;
CREATE POLICY "org_settings_own_org" ON organization_settings
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────
-- User Präferenzen (Chat-Stil + Modell + Onboarding)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) UNIQUE,
  chat_style          TEXT DEFAULT 'structured'
    CHECK (chat_style IN ('clear', 'structured', 'detailed')),
  model_preference    TEXT DEFAULT 'auto'
    CHECK (model_preference IN ('cheapest', 'eu_only', 'auto')),
  visible_tabs        TEXT[] DEFAULT
    ARRAY['workspaces','dashboard','models','budget','logs','users'],
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_own" ON user_preferences;
CREATE POLICY "user_preferences_own" ON user_preferences
  FOR ALL USING (user_id = auth.uid());
