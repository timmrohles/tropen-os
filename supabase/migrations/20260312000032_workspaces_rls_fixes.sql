-- 031b_workspaces_rls_fixes.sql
-- RLS-Korrekturen für workspace-Tabellen: viewer-Rolle kann nicht schreiben

-- cards: INSERT + UPDATE nur für admin/member
DROP POLICY IF EXISTS "cards_write" ON public.cards;
CREATE POLICY "cards_write" ON public.cards
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role::TEXT IN ('admin', 'member')
    )
  );

DROP POLICY IF EXISTS "cards_update" ON public.cards;
CREATE POLICY "cards_update" ON public.cards
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role::TEXT IN ('admin', 'member')
    )
  );

-- connections: INSERT nur für admin/member
DROP POLICY IF EXISTS "connections_write" ON public.connections;
CREATE POLICY "connections_write" ON public.connections
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role::TEXT IN ('admin', 'member')
    )
  );

-- knowledge_entries: INSERT nur für admin/member
DROP POLICY IF EXISTS "knowledge_entries_insert" ON public.knowledge_entries;
CREATE POLICY "knowledge_entries_insert" ON public.knowledge_entries
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role::TEXT IN ('admin', 'member')
    )
  );

-- outcomes: INSERT nur für admin/member
DROP POLICY IF EXISTS "outcomes_write" ON public.outcomes;
CREATE POLICY "outcomes_write" ON public.outcomes
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role::TEXT IN ('admin', 'member')
    )
  );
