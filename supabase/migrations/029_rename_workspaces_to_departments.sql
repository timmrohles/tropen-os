-- 029_rename_workspaces_to_departments.sql
-- Umbenennung: workspaces → departments, workspace_members → department_members
-- Idempotent: prüft ob Tabellen bereits existieren/umbenannt wurden.

DO $$
BEGIN
  -- workspaces → departments (nur wenn workspaces noch existiert und departments noch nicht)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'workspaces')
  AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'departments') THEN
    ALTER TABLE public.workspaces RENAME TO departments;
  END IF;

  -- workspace_members → department_members (nur wenn workspace_members noch existiert)
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'workspace_members')
  AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema = 'public' AND table_name = 'department_members') THEN
    ALTER TABLE public.workspace_members RENAME TO department_members;
  END IF;
END $$;

-- Budget-RPC neu erstellen mit departments statt workspaces
CREATE OR REPLACE FUNCTION check_and_reserve_budget(
  org_id         UUID,
  p_workspace_id UUID,
  estimated_cost NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  current_org_spend   NUMERIC;
  current_ws_spend    NUMERIC;
  org_limit           NUMERIC;
  ws_limit            NUMERIC;
  month_start         TIMESTAMPTZ := date_trunc('month', NOW());
BEGIN
  SELECT budget_limit
    INTO org_limit
    FROM organizations
   WHERE id = org_id
   FOR UPDATE;

  IF org_limit IS NOT NULL THEN
    SELECT COALESCE(SUM(cost_eur), 0)
      INTO current_org_spend
      FROM usage_logs
     WHERE organization_id = org_id
       AND created_at >= month_start;

    IF (current_org_spend + estimated_cost) > org_limit THEN
      RETURN FALSE;
    END IF;
  END IF;

  SELECT budget_limit
    INTO ws_limit
    FROM departments
   WHERE id = p_workspace_id
   FOR UPDATE;

  IF ws_limit IS NOT NULL THEN
    SELECT COALESCE(SUM(cost_eur), 0)
      INTO current_ws_spend
      FROM usage_logs
     WHERE workspace_id = p_workspace_id
       AND created_at >= month_start;

    IF (current_ws_spend + estimated_cost) > ws_limit THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION check_and_reserve_budget(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_reserve_budget(UUID, UUID, NUMERIC) TO service_role;

-- RLS Policies auf conversations aktualisieren (nur wenn conversations existiert)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    DROP POLICY IF EXISTS "conv_select" ON conversations;
    DROP POLICY IF EXISTS "conv_insert" ON conversations;
    DROP POLICY IF EXISTS "conv_update" ON conversations;
    DROP POLICY IF EXISTS "conv_delete" ON conversations;

    -- Nur erstellen wenn department_members existiert
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'department_members') THEN
      CREATE POLICY "conv_select" ON conversations FOR SELECT
        USING (workspace_id IN (
          SELECT workspace_id FROM department_members WHERE user_id = auth.uid()
        ));

      CREATE POLICY "conv_insert" ON conversations FOR INSERT
        WITH CHECK (workspace_id IN (
          SELECT workspace_id FROM department_members WHERE user_id = auth.uid()
        ));

      CREATE POLICY "conv_update" ON conversations FOR UPDATE
        USING (workspace_id IN (
          SELECT workspace_id FROM department_members WHERE user_id = auth.uid()
        ));

      CREATE POLICY "conv_delete" ON conversations FOR DELETE
        USING (workspace_id IN (
          SELECT workspace_id FROM department_members WHERE user_id = auth.uid()
        ));
    END IF;
  END IF;
END $$;
