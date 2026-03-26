-- Rename dashboard_widgets → cockpit_widgets
ALTER TABLE IF EXISTS dashboard_widgets
  RENAME TO cockpit_widgets;

-- Rename column in user_preferences
ALTER TABLE IF EXISTS user_preferences
  RENAME COLUMN dashboard_setup_done TO cockpit_setup_done;

-- Rename index (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_dashboard_widgets_user') THEN
    ALTER INDEX idx_dashboard_widgets_user RENAME TO idx_cockpit_widgets_user;
  END IF;
END $$;

-- Recreate RLS policies with new names
-- (Supabase RLS policies cannot be renamed — drop old, create new)
DROP POLICY IF EXISTS "dashboard_widgets_own" ON cockpit_widgets;
DROP POLICY IF EXISTS "Users manage own cockpit widgets" ON cockpit_widgets;

CREATE POLICY "cockpit_widgets_own" ON cockpit_widgets
  FOR ALL USING (user_id = auth.uid());
