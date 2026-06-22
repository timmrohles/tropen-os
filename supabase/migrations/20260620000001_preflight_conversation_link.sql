-- 20260620000001_preflight_conversation_link.sql
-- Companion MVP Sub-Plan 1: Pre-Flight-Chat lebt in einer conversation (type='preflight'),
-- verknüpft mit dem preflight_project. B-Recycling: nutzt conversations + messages.

-- 1) conversation_type um 'preflight' erweitern (bisher: chat/workspace_briefing/workspace_silo/workspace_card)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_conversation_type_check
  CHECK (conversation_type IN ('chat','workspace_briefing','workspace_silo','workspace_card','preflight'));

-- 2) Brücke preflight_project → conversation (der einzige echte Schema-Zusatz, Spec §6)
ALTER TABLE public.preflight_projects
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_preflight_projects_conversation
  ON public.preflight_projects(conversation_id)
  WHERE conversation_id IS NOT NULL;
