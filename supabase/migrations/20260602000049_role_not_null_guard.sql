-- 20260602000049_role_not_null_guard.sql
-- Fix: Alle User brauchen eine Rolle, keine NULLs mehr erlaubt,
-- und DB-Trigger verhindert superadmin-Zuweisung via Application-Code.

-- 1. Backfill: NULL-Rollen → 'member'
UPDATE public.users SET role = 'member' WHERE role IS NULL;

-- 2. NOT NULL Constraint
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;

-- 3. Trigger: verhindert neue superadmin-Zuweisungen
CREATE OR REPLACE FUNCTION prevent_superadmin_assignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role <> 'superadmin' THEN
    RETURN NEW;
  END IF;

  -- Bestehender Superadmin darf bleiben (UPDATE ohne Rollenwechsel)
  IF TG_OP = 'UPDATE' AND OLD.role = 'superadmin' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'superadmin-Rolle kann nicht via Application zugewiesen werden.';
END;
$$;

DROP TRIGGER IF EXISTS guard_superadmin_role ON public.users;
CREATE TRIGGER guard_superadmin_role
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_superadmin_assignment();
