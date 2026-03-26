-- Migration 071: user_preferences — toro_address + language_style
-- toro_address: how Toro addresses the user (e.g. "du", "Sie", custom name)
-- language_style: personal writing style notes injected into system prompt

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS toro_address   VARCHAR DEFAULT '',
  ADD COLUMN IF NOT EXISTS language_style TEXT    DEFAULT '';
