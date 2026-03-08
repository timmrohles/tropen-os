-- Migration 005: Atomische Budget-Prüfung via RPC
-- Verhindert Race Conditions bei parallelen Anfragen durch FOR UPDATE Lock
-- Wird aus der Edge Function ai-chat aufgerufen (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION check_and_reserve_budget(
  org_id        UUID,
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
  -- Org-Ausgaben diesen Monat mit Zeilensperrung (verhindert Race Condition)
  SELECT COALESCE(SUM(cost_eur), 0)
    INTO current_org_spend
    FROM usage_logs
   WHERE organization_id = org_id
     AND created_at >= month_start
   FOR UPDATE;

  -- Org-Budget-Limit laden
  SELECT budget_limit
    INTO org_limit
    FROM organizations
   WHERE id = org_id;

  -- Org-Limit prüfen
  IF org_limit IS NOT NULL AND (current_org_spend + estimated_cost) > org_limit THEN
    RETURN FALSE;
  END IF;

  -- Workspace-Ausgaben prüfen (wenn Limit gesetzt)
  SELECT budget_limit
    INTO ws_limit
    FROM workspaces
   WHERE id = p_workspace_id;

  IF ws_limit IS NOT NULL THEN
    SELECT COALESCE(SUM(cost_eur), 0)
      INTO current_ws_spend
      FROM usage_logs
     WHERE workspace_id = p_workspace_id
       AND created_at >= month_start
     FOR UPDATE;

    IF (current_ws_spend + estimated_cost) > ws_limit THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nur die Edge Function (service role) darf die RPC aufrufen
REVOKE ALL ON FUNCTION check_and_reserve_budget(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_reserve_budget(UUID, UUID, NUMERIC) TO service_role;
