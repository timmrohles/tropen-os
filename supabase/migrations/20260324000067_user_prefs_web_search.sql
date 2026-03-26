-- Migration 067: Add web_search_enabled to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS web_search_enabled BOOLEAN DEFAULT false;
