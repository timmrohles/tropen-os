-- 20260317000040_cards_capability.sql
-- Add capability + outcome context to workspace cards
-- Idempotent: ADD COLUMN IF NOT EXISTS guards.

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS capability_id UUID REFERENCES public.capabilities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS outcome_id     UUID REFERENCES public.outcomes(id)      ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sources        JSONB,
  ADD COLUMN IF NOT EXISTS last_run_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_run_at    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cards_capability_id ON public.cards (capability_id);
CREATE INDEX IF NOT EXISTS idx_cards_outcome_id    ON public.cards (outcome_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_run_at   ON public.cards (next_run_at) WHERE next_run_at IS NOT NULL;
