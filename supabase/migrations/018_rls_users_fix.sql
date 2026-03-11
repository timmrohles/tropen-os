-- 018_rls_users_fix.sql
-- Fix: Users können ihre eigene Zeile immer lesen
-- Ursache: users_own_org (FOR ALL) setzt get_my_organization_id() voraus, was in
-- Edge Cases NULL liefert → Client bekommt kein Profil → orgId/role bleibt null.
-- Fix 1: Direkte SELECT-Policy für die eigene Zeile.
-- Fix 2: user_org_id() auf SECURITY DEFINER setzen (war manuell in SQL Editor geändert,
--         jetzt in Migration verankert).

-- ─── Fix 1: users_select_own ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_own'
  ) THEN
    CREATE POLICY "users_select_own" ON users
      FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

-- ─── Fix 2: user_org_id() mit SECURITY DEFINER ───────────────────────────────
-- Ohne SECURITY DEFINER läuft die Funktion unter User-Rechten und triggert selbst
-- wieder die RLS auf users → gibt NULL zurück → knowledge_sources INSERT schlägt fehl.
CREATE OR REPLACE FUNCTION user_org_id()
RETURNS uuid LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$;
