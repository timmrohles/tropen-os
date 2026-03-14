// context-builder.ts — backwards compatibility shim
// Real implementation is in workspace-context.ts (Plan C)
export { buildWorkspaceContext, buildCardContext } from '@/lib/workspace-context'

// ---------------------------------------------------------------------------
// buildContextSnapshot — backwards-compat async wrapper
// ---------------------------------------------------------------------------
// The new workspace-context.ts version takes (workspaceId, workspace, cards, cardId?)
// but existing callers use await buildContextSnapshot(workspaceId, cardId?).
// This wrapper preserves the old two-argument call signature.
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function buildContextSnapshot(
  workspaceId: string,
  cardId?: string,
): Promise<Record<string, unknown>> {
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, title, goal, status')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!workspace) throw new Error(`Workspace ${workspaceId} nicht gefunden`)

  const { data: cardRows } = await supabaseAdmin
    .from('cards')
    .select('id, title, role, status')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const cards = (cardRows ?? []) as { id: string; title: string; role: string; status: string }[]

  const snapshot: Record<string, unknown> = {
    workspaceId,
    workspaceTitle: workspace.title,
    workspaceGoal: workspace.goal,
    workspaceStatus: workspace.status,
    cardCount: cards.length,
    cardId: cardId ?? null,
    cardStatuses: cards.reduce<Record<string, string>>((acc, c) => {
      acc[c.id] = c.status
      return acc
    }, {}),
    capturedAt: new Date().toISOString(),
  }

  return snapshot
}
