-- 028_workspaces_organization_id.sql
-- Stellt sicher dass workspaces.organization_id existiert und korrekt befüllt ist.
-- Sicher auszuführen: IF NOT EXISTS verhindert Fehler wenn Spalte schon da ist.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Backfill: organization_id aus workspace_members → users ableiten
-- für alle Workspaces die noch keinen organization_id Eintrag haben
UPDATE public.workspaces w
SET organization_id = u.organization_id
FROM public.workspace_members wm
JOIN public.users u ON u.id = wm.user_id
WHERE wm.workspace_id = w.id
  AND w.organization_id IS NULL;
