-- Migration 034: Art. 14 KI-VO Human Override
-- Nutzer können KI-Antworten als falsch/unpassend markieren (Art. 14 EU AI Act)

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS flagged         BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason     TEXT     CHECK (char_length(flag_reason) <= 500),
  ADD COLUMN IF NOT EXISTS flagged_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flagged_by      UUID     REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index für Admin-Dashboard (geflaggte Nachrichten schnell abrufen)
CREATE INDEX IF NOT EXISTS messages_flagged_idx ON messages (flagged) WHERE flagged = TRUE;

-- RLS: User darf nur eigene Nachrichten flaggen
-- (Policy basiert auf conversation ownership — messages haben keinen direkten user_id)
-- Superadmin kann alle flagged messages lesen via service role (Admin-Dashboard)
