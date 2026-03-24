-- user_preferences: link_previews Toggle für rechte Seitenleiste
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS link_previews BOOLEAN DEFAULT true;
