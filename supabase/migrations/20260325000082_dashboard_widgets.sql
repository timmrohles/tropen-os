-- Dashboard Widget System
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  widget_type     TEXT NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  size            TEXT NOT NULL DEFAULT 'medium'
    CHECK (size IN ('small', 'medium', 'large')),
  config          JSONB DEFAULT '{}',
  is_visible      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, widget_type)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user
  ON dashboard_widgets(user_id)
  WHERE is_visible = true;

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dashboard_widgets_own" ON dashboard_widgets
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS dashboard_setup_done BOOLEAN DEFAULT false;
