-- Tropen OS v2 – RLS für Onboarding-Flow
-- Neu eingeladene User haben noch keinen Eintrag in public.users.
-- get_my_organization_id() liefert NULL → users_own_org greift nicht.
-- Diese Policies erlauben das Lesen/Anlegen der eigenen Zeile per id = auth.uid().

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (id = auth.uid());
