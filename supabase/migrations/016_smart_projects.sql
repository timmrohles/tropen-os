-- Tropen OS – Smarte Projekte Phase 2
-- Erweitert projects um Kontext, Ton, Sprache, Zielgruppe, Gedächtnis
--
-- HINWEIS: Diese Migration muss manuell im Supabase Dashboard ausgeführt werden
-- (SQL Editor → Inhalt einfügen → Run). Kein lokales Supabase vorhanden.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS context        TEXT,
  ADD COLUMN IF NOT EXISTS tone           TEXT DEFAULT 'casual'
    CHECK (tone IN ('formal','casual','technical','creative')),
  ADD COLUMN IF NOT EXISTS language       TEXT DEFAULT 'auto'
    CHECK (language IN ('de','en','auto')),
  ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'internal'
    CHECK (target_audience IN ('internal','customers','public')),
  ADD COLUMN IF NOT EXISTS memory         TEXT,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();
