ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS ai_act_acknowledged      BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_act_acknowledged_at   TIMESTAMPTZ;
