-- Sprint 6b: Project profile fields for scan_projects
-- Stores auto-detected stack + user interview answers

ALTER TABLE scan_projects
  ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_url TEXT,
  ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS audience TEXT
    CHECK (audience IN ('b2b', 'b2c', 'internal', 'unclear')),
  ADD COLUMN IF NOT EXISTS compliance_requirements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS not_applicable_categories INTEGER[] DEFAULT '{}';
