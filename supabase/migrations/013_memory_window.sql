-- Tropen OS v2 – Memory Window für User Preferences
-- Speichert die gewünschte Gesprächsfenstergröße pro User
-- Wird als memory_size Input an Dify Chatflow übergeben

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS memory_window INTEGER DEFAULT 20;
