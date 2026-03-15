-- Migration: tsvector Trigger für knowledge_entries
-- Aktualisiert search_vector automatisch bei INSERT und UPDATE

-- GIN Index für Volltextsuche
CREATE INDEX IF NOT EXISTS knowledge_entries_search_vector_gin_idx
  ON knowledge_entries USING GIN (search_vector);

-- Trigger-Funktion
CREATE OR REPLACE FUNCTION knowledge_entries_update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'german',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS knowledge_entries_search_vector_trigger ON knowledge_entries;
CREATE TRIGGER knowledge_entries_search_vector_trigger
  BEFORE INSERT OR UPDATE ON knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION knowledge_entries_update_search_vector();

-- Bestehende Einträge aktualisieren (falls Tabelle nicht leer)
UPDATE knowledge_entries
SET search_vector = to_tsvector(
  'german',
  coalesce(title, '') || ' ' || coalesce(content, '')
);
