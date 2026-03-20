-- Intention System: Weichenstellung Chat-Start
-- Ergänzt conversations um Intention-Tracking + neue focus_log Tabelle (APPEND ONLY)

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS intention
    TEXT CHECK (intention IN ('focused', 'open'))
    DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS current_project_id
    UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS drift_detected
    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_since_message
    INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS focus_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  from_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  to_project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  message_index   INTEGER NOT NULL,
  reason          TEXT CHECK (reason IN ('explicit','implicit','drift')),
  created_at      TIMESTAMPTZ DEFAULT now()
  -- APPEND ONLY: kein UPDATE, kein DELETE
);

ALTER TABLE focus_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "focus_log_own" ON focus_log
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
