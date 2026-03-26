-- Migration 070: emoji_style + suggestions_enabled in user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS emoji_style  VARCHAR DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS suggestions_enabled BOOLEAN DEFAULT true;
