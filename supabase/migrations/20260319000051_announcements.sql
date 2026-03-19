-- Neuigkeiten von Tropen (Superadmin) und Org-Admins
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- NULL = Tropen-weit (von Superadmin), gesetzt = Org-spezifisch
  title           TEXT NOT NULL,
  body            TEXT,
  url             TEXT,
  url_label       TEXT,
  type            TEXT NOT NULL DEFAULT 'info'
                    CHECK (type IN ('info', 'update', 'warning')),
  source          TEXT NOT NULL DEFAULT 'org'
                    CHECK (source IN ('tropen', 'org')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_org ON announcements(organization_id, published_at DESC);
CREATE INDEX idx_announcements_tropen ON announcements(source, is_active, published_at DESC)
  WHERE organization_id IS NULL;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- User sieht: eigene Org-Announcements + Tropen-Announcements
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR organization_id IS NULL
  );

-- Nur Org-Admins und Superadmins können anlegen
CREATE POLICY "announcements_insert" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'owner', 'superadmin')
    )
  );

-- Nur der Ersteller oder Superadmin kann löschen/deaktivieren (per API-Guard, RLS ist defensiv)
CREATE POLICY "announcements_update" ON announcements
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "announcements_delete" ON announcements
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );
