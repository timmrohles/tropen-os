-- Migration: 20260317000042_feed_dismissed.sql
-- Adds dismissed_at / dismissed_by to feed_items for reversible user-hide ("Ausblenden")

ALTER TABLE public.feed_items
  ADD COLUMN IF NOT EXISTS dismissed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dismissed_by   UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feed_items_dismissed_at
  ON public.feed_items(dismissed_at)
  WHERE dismissed_at IS NOT NULL;
