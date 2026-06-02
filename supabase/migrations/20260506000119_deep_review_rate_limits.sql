-- deep_review_invocations: Rate-Limiting für Deep Review (24h Cooldown + 10/Monat pro User)
CREATE TABLE IF NOT EXISTS deep_review_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES audit_runs(id),
  invoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cost_eur NUMERIC(6,4)
);

CREATE INDEX idx_dri_user_id ON deep_review_invocations(user_id);

CREATE INDEX idx_dri_invoked_at ON deep_review_invocations(invoked_at);

ALTER TABLE deep_review_invocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own" ON deep_review_invocations
  FOR SELECT USING (auth.uid() = user_id);
