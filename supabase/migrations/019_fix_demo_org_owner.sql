-- 019_fix_demo_org_owner.sql
-- test@tropen.ai war ein fiktiver Platzhalter-Owner der Demo-Org.
-- Wird entfernt. timmrohles@gmail.com (superadmin) bleibt erhalten.

DO $$
DECLARE
  test_id  uuid;
  timm_id  uuid;
BEGIN
  SELECT id INTO test_id FROM public.users WHERE email = 'test@tropen.ai' LIMIT 1;
  SELECT id INTO timm_id FROM public.users WHERE email = 'timmrohles@gmail.com' LIMIT 1;

  IF test_id IS NULL THEN
    RAISE NOTICE 'test@tropen.ai nicht gefunden – nichts zu tun.';
    RETURN;
  END IF;

  -- Abhängigkeiten auflösen (alle FKs auf users.id)
  DELETE FROM workspace_members WHERE user_id = test_id;
  DELETE FROM user_preferences   WHERE user_id = test_id;

  IF timm_id IS NOT NULL THEN
    UPDATE conversations SET user_id = timm_id WHERE user_id = test_id;
    UPDATE usage_logs    SET user_id = timm_id WHERE user_id = test_id;
  END IF;

  DELETE FROM public.users WHERE id = test_id;

  BEGIN
    DELETE FROM auth.users WHERE id = test_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'auth.users-Eintrag nicht gelöscht (ignoriert).';
  END;

  RAISE NOTICE 'test@tropen.ai entfernt.';
END $$;
