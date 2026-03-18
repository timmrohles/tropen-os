-- Add agent_id column to conversations table
-- Referenced by useWorkspaceState.ts, workspace-actions.ts, ai-chat Edge Function

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
