CREATE TABLE project_compliance_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('master', 'detail')),
  question_key TEXT NOT NULL,
  question_value JSONB,
  answered_at TIMESTAMPTZ DEFAULT now(),
  answered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, question_key)
);

CREATE INDEX idx_project_compliance_data_project_scope
  ON project_compliance_data (project_id, scope);

ALTER TABLE project_compliance_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_data_select_own_org"
  ON project_compliance_data FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_my_organization_id()
    )
  );

CREATE POLICY "compliance_data_insert_own_org"
  ON project_compliance_data FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_my_organization_id()
    )
  );

CREATE POLICY "compliance_data_update_own_org"
  ON project_compliance_data FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_my_organization_id()
    )
  );
