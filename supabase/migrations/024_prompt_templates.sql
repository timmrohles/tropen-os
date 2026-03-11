-- Eigene Prompt-Vorlagen speichern
CREATE TABLE IF NOT EXISTS prompt_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  content         TEXT NOT NULL,
  is_shared       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- User sieht eigene + geteilte der Org
CREATE POLICY "prompt_templates_select" ON prompt_templates
  FOR SELECT USING (
    user_id = auth.uid()
    OR (is_shared = TRUE AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "prompt_templates_insert" ON prompt_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "prompt_templates_delete" ON prompt_templates
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "prompt_templates_update" ON prompt_templates
  FOR UPDATE USING (user_id = auth.uid());
