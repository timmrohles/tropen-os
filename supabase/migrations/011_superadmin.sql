-- 011_superadmin.sql
-- Erweitert users.role um 'superadmin' für internes Tropen-Tool

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'owner', 'admin', 'member', 'viewer'));
