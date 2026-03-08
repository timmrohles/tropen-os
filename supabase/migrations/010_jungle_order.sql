-- ── Ordnung im Dschungel – Schema-Erweiterungen ─────────────────────────────

-- Soft Delete für Conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by   UUID        REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS merged_into  UUID        REFERENCES conversations(id);

-- Medien-Typen (für spätere Medien-Ordner, Phase 3)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS has_files   BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS file_types  TEXT[]   DEFAULT '{}';

-- RLS: User sieht nur eigene gelöschte Chats; Org-Admin sieht alle
-- (bestehende RLS-Policies bleiben; deleted_at-Filter in der App)

-- Papierkorb-Cleanup: löscht Einträge die älter als 30 Tage sind
CREATE OR REPLACE FUNCTION cleanup_deleted_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM conversations
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
