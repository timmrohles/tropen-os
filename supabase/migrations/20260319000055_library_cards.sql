-- 20260319000055_library_cards.sql
-- Add role_id and skill_id to workspace cards

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS role_id  UUID REFERENCES public.roles(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cards_role_id  ON public.cards(role_id)  WHERE role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_skill_id ON public.cards(skill_id) WHERE skill_id IS NOT NULL;
