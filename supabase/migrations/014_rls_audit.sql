-- Tropen OS v2 – Datenschutz-Audit: RLS-Policies schärfen
-- Audit-Ergebnis:
--   • messages: FOR ALL erlaubte Client-seitige Inserts → gefälschte KI-Antworten möglich
--   • conversations: FOR ALL erlaubte Workspace-Mitglieder gegenseitig Hard-DELETE
--   • usage_logs, organizations, users, workspaces, etc.: korrekt

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. messages: Kein direktes Schreiben vom Client
--    Inserts/Updates erfolgen ausschließlich über Edge Function (Service Role,
--    bypasses RLS). Clients dürfen nur lesen.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages_via_conversations" ON messages;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. conversations: Granulare Policies statt FOR ALL
--    Lesen: alle Workspace-Mitglieder
--    Erstellen: nur eigene Conversation im eigenen Workspace
--    Bearbeiten: eigene Conversations + Admin/Owner (inkl. Soft Delete via deleted_at)
--    Löschen: nur Admin/Owner (App nutzt Soft Delete; Hard Delete nur für Cleanup)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "conversations_workspace_members" ON conversations;

CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'owner', 'superadmin')
  );

CREATE POLICY "conversations_delete" ON conversations
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'owner', 'superadmin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. usage_logs: Bereits korrekt (FOR SELECT = nur Lesen)
--    INSERT/UPDATE/DELETE haben keine Policy → implizit geblockt (RLS Default Deny)
--    Inserts kommen ausschließlich von der Edge Function (Service Role).
--    Keine Änderung erforderlich — Dokumentation zur Vollständigkeit.
-- ─────────────────────────────────────────────────────────────────────────────
-- (keine SQL-Änderung)

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Superadmin-Bypass: /superadmin/* nutzt supabaseAdmin (Service Role)
--    → RLS wird komplett bypassed. Kein Policy-Update erforderlich.
-- ─────────────────────────────────────────────────────────────────────────────
-- (keine SQL-Änderung)
