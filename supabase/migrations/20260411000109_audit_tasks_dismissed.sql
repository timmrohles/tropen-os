-- Add dismissed_at to audit_tasks for soft-dismiss workflow
ALTER TABLE audit_tasks ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN audit_tasks.dismissed_at IS 'Set when task is dismissed by user — keeps record but hides from Open view';
