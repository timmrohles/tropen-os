-- Migration 027: QA-Tabellen für Tropen AI Admin Dashboard
-- Erstellt: 2026-03-11

-- Tabelle: qa_test_runs
CREATE TABLE qa_test_runs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_type     TEXT NOT NULL CHECK (run_type IN (
                 'functional','integration','regression',
                 'bias','hallucination','routing','security','lighthouse'
               )),
  triggered_by         TEXT NOT NULL DEFAULT 'manual'
               CHECK (triggered_by IN ('ci_cd','manual','scheduled')),
  triggered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'running'
               CHECK (status IN ('running','passed','failed','partial')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  commit_sha   VARCHAR(40),
  summary      JSONB NOT NULL DEFAULT '{"total":0,"passed":0,"failed":0,"skipped":0}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle: qa_metrics
CREATE TABLE qa_metrics (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model         VARCHAR(64) NOT NULL,
  metric_type   TEXT NOT NULL CHECK (metric_type IN (
                  'quality_score','hallucination_rate','bias_score',
                  'latency_p50','latency_p95','error_rate','routing_accuracy'
                )),
  value         NUMERIC(8,2) NOT NULL,
  unit          VARCHAR(16) NOT NULL DEFAULT 'score',
  bias_category VARCHAR(32),
  measured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  run_id        UUID REFERENCES qa_test_runs(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle: qa_routing_log
CREATE TABLE qa_routing_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type       VARCHAR(64) NOT NULL DEFAULT 'chat',
  model_selected  VARCHAR(64) NOT NULL,
  routing_reason  VARCHAR(128) NOT NULL DEFAULT 'direct',
  latency_ms      INTEGER,
  status          TEXT NOT NULL DEFAULT 'success'
                  CHECK (status IN ('success','timeout','error')),
  error_message   TEXT,
  user_id         VARCHAR(128), -- SHA-256 Hash, nie Klartext
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle: qa_compliance_checks
CREATE TABLE qa_compliance_checks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article         VARCHAR(32) NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'fail'
                  CHECK (status IN ('pass','warn','fail')),
  notes           TEXT,
  open_action     TEXT,
  deadline        VARCHAR(32),
  checked_by      VARCHAR(64) NOT NULL DEFAULT 'system',
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle: qa_lighthouse_runs
CREATE TABLE qa_lighthouse_runs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  performance   SMALLINT CHECK (performance BETWEEN 0 AND 100),
  accessibility SMALLINT CHECK (accessibility BETWEEN 0 AND 100),
  best_practices SMALLINT CHECK (best_practices BETWEEN 0 AND 100),
  seo           SMALLINT CHECK (seo BETWEEN 0 AND 100),
  lcp_ms        NUMERIC(8,2),
  inp_ms        NUMERIC(8,2),
  cls_score     NUMERIC(5,3),
  commit_sha    VARCHAR(40),
  url           TEXT NOT NULL,
  run_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_qa_metrics_model_type   ON qa_metrics(model, metric_type, measured_at DESC);
CREATE INDEX idx_qa_routing_log_created  ON qa_routing_log(created_at DESC);
CREATE INDEX idx_qa_routing_log_model    ON qa_routing_log(model_selected, created_at DESC);
CREATE INDEX idx_qa_test_runs_type       ON qa_test_runs(run_type, created_at DESC);
CREATE INDEX idx_qa_compliance_article   ON qa_compliance_checks(article);
CREATE INDEX idx_qa_lighthouse_run_at    ON qa_lighthouse_runs(run_at DESC);

-- Row Level Security
ALTER TABLE qa_test_runs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_metrics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_routing_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_lighthouse_runs  ENABLE ROW LEVEL SECURITY;

-- Service Role: vollen Zugriff
CREATE POLICY "service_role_all" ON qa_test_runs        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON qa_metrics          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON qa_routing_log      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON qa_compliance_checks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON qa_lighthouse_runs  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authentifizierte User: nur lesen (Dashboard)
CREATE POLICY "auth_read" ON qa_test_runs        FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON qa_metrics          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON qa_routing_log      FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON qa_compliance_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update" ON qa_compliance_checks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_read" ON qa_lighthouse_runs  FOR SELECT TO authenticated USING (true);

-- ── Seed: EU AI Act Compliance-Checks ─────────────────────────────────────────
INSERT INTO qa_compliance_checks (article, label, status, notes, checked_by) VALUES
  ('Art. 50',   'KI-Interaktion offenlegen (Transparenz-Pflicht)',       'warn', 'Toro-Branding vorhanden, System-Prompt nicht öffentlich', 'system'),
  ('Art. 13',   'Nutzer-Transparenz: Modell-Metadaten in Response',      'warn', 'SessionPanel zeigt Modell — Response-Header fehlen noch', 'system'),
  ('Art. 14',   'Human Override / Eskalationsmechanismus',               'fail', 'Noch nicht implementiert', 'system'),
  ('Art. 12',   'Automatisches Logging aller KI-Entscheidungen',         'fail', 'usage_logs vorhanden, qa_routing_log neu — Vollständigkeit prüfen', 'system'),
  ('Art. 11',   'Technische Dokumentation vor Launch',                   'fail', 'CLAUDE.md vorhanden — formale Doku fehlt', 'system'),
  ('Art. 10',   'Bias-Datensätze dokumentiert und archiviert',           'fail', 'qa_metrics Tabelle erstellt — Evaluierungen ausstehend', 'system'),
  ('Art. 9',    'Risikoregister angelegt und aktuell',                   'fail', 'Noch nicht erstellt', 'system'),
  ('Art. 15',   'Robustheit & Cybersecurity (Prompt Injection)',         'pass', 'Injection-Detection in public/chat/route.ts implementiert', 'system'),
  ('DSGVO',     'Datenschutzerklärung + Verarbeitungsverzeichnis',       'warn', 'AVV-Vorlage vorhanden — vollständiges Verzeichnis fehlt', 'system'),
  ('ISO 42001', 'KI-Managementsystem Zertifizierung (Ziel 2027)',        'fail', 'Langfristiges Ziel, kein akuter Handlungsbedarf', 'system')
ON CONFLICT (article) DO NOTHING;
