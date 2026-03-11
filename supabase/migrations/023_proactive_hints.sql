-- 1b: proaktive Hilfe-Toggle
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS proactive_hints BOOLEAN NOT NULL DEFAULT TRUE;
