-- 20260318000049_conversations_workspace.sql
-- Plan F-Canvas: Extend conversations with workspace context
-- Idempotent: ADD COLUMN IF NOT EXISTS guards.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS workspace_id UUID
    REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS card_id UUID
    REFERENCES public.cards(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS conversation_type TEXT NOT NULL DEFAULT 'chat'
    CHECK (conversation_type IN (
      'chat',
      'workspace_briefing',
      'workspace_silo',
      'workspace_card'
    ));

-- Index for workspace-scoped conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_workspace
  ON public.conversations(workspace_id, conversation_type)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_card
  ON public.conversations(card_id)
  WHERE card_id IS NOT NULL;

-- RLS: workspace_silo conversations are readable by workspace participants
-- (Uses supabaseAdmin in API layer so RLS is bypassed — no policy change needed)
