-- Tropen OS v2 – Row Level Security
-- Security-Definer-Funktion vermeidet rekursive Selbstreferenz in users-Policy

CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- organizations: nur eigene Org sichtbar
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_own" ON organizations
  FOR ALL USING (id = get_my_organization_id());

-- users: nur User der eigenen Org
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_org" ON users
  FOR ALL USING (organization_id = get_my_organization_id());

-- workspaces: nur innerhalb der Org
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces_own_org" ON workspaces
  FOR ALL USING (organization_id = get_my_organization_id());

-- workspace_members: eigene Mitgliedschaft + Admin/Owner sieht alle
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_members_access" ON workspace_members
  FOR ALL USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- conversations: nur für Workspace-Mitglieder
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_workspace_members" ON conversations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- messages: folgen Conversations
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_via_conversations" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- model_catalog: für alle eingeloggten User lesbar (kein Schreiben via Client)
ALTER TABLE model_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "model_catalog_read" ON model_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- usage_logs: Member sieht eigene, Admin/Owner sieht alle der Org
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_logs_member" ON usage_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      organization_id = get_my_organization_id()
      AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'owner')
    )
  );
