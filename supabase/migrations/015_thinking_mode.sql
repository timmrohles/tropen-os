-- Tropen OS v2 – Thinking Mode Präferenz
-- Speichert ob der User den "Toro denkt laut nach"-Modus aktiviert hat.
-- Aktuell nur UI-Präferenz (experimentell), Edge Function wird in späterer Version eingebunden.

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS thinking_mode BOOLEAN DEFAULT FALSE;
