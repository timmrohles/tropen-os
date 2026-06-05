-- 20260605000001_preflight_runs.sql
-- Pre-Flight MVP: persistierte Läufe (Input + Ergebnis), org-/user-gescoped.
-- Schreibzugriff ausschließlich über Service-Role (API) — daher keine INSERT/UPDATE-Policy.

CREATE TABLE preflight_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE preflight_runs ENABLE ROW LEVEL SECURITY;

-- SELECT: eigene Org
CREATE POLICY "preflight_runs_select_own_org" ON preflight_runs
  FOR SELECT USING (organization_id = get_my_organization_id());

-- DELETE: eigener Lauf (DSGVO-Hygiene)
CREATE POLICY "preflight_runs_delete_own" ON preflight_runs
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_preflight_runs_user_created ON preflight_runs (user_id, created_at DESC);
