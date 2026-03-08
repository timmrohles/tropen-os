-- Migration 012: Fix check_and_reserve_budget – FOR UPDATE war ungültig mit Aggregaten
-- PostgreSQL erlaubt FOR UPDATE nicht zusammen mit Aggregat-Funktionen (SUM, etc.)
-- Korrekte Serialisierung: FOR UPDATE auf die Org/Workspace-Zeile, Aggregat separat

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
  -- Org-Zeile sperren (serialisiert parallele Anfragen, FOR UPDATE auf einzelner Zeile ist gültig)
  SELECT budget_limit
    INTO org_limit
    FROM organizations
   WHERE id = org_id
   FOR UPDATE;

  -- Org-Limit prüfen (wenn kein Limit gesetzt, überspringen)
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

  -- Workspace-Zeile sperren und Budget prüfen (wenn Limit gesetzt)
  SELECT budget_limit
    INTO ws_limit
    FROM workspaces
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

-- Berechtigungen bleiben identisch
REVOKE ALL ON FUNCTION check_and_reserve_budget(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_reserve_budget(UUID, UUID, NUMERIC) TO service_role;
