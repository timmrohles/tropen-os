-- Migration 020: Superadmin als workspace_member in Demo Workspace eintragen
-- timmrohles@gmail.com soll den "Demo Workspace" nutzen können

DO $$
DECLARE
  timm_id    uuid;
  ws_id      uuid;
BEGIN
  SELECT id INTO timm_id FROM public.users WHERE email = 'timmrohles@gmail.com' LIMIT 1;
  IF timm_id IS NULL THEN
    RAISE NOTICE 'timmrohles@gmail.com nicht gefunden – nichts zu tun.';
    RETURN;
  END IF;

  -- Workspace der Tropen Demo GmbH holen (oder irgendein Workspace des Superadmin-Org)
  SELECT w.id INTO ws_id
  FROM public.workspaces w
  JOIN public.users u ON u.organization_id = w.organization_id
  WHERE u.id = timm_id
  LIMIT 1;

  IF ws_id IS NULL THEN
    RAISE NOTICE 'Kein Workspace für Superadmin-Org gefunden – nichts zu tun.';
    RETURN;
  END IF;

  -- Nur einfügen wenn noch nicht Mitglied
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, timm_id, 'admin')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RAISE NOTICE 'Superadmin (%) als admin in Workspace % eingetragen.', timm_id, ws_id;
END $$;
