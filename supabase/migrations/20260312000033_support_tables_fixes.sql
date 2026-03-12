-- 032b_support_tables_fixes.sql
-- Fixes for 032_support_tables.sql:
-- 1. Split dept_settings FOR ALL into explicit operations
-- 2. Add missing DELETE policies for org_knowledge and dept_knowledge
-- 3. Add missing card_id index on agent_assignments

-- ── dept_settings: ersetze FOR ALL durch explizite Policies ─────────────────
DROP POLICY IF EXISTS "dept_settings_write" ON public.dept_settings;

CREATE POLICY "dept_settings_insert" ON public.dept_settings
  FOR INSERT WITH CHECK (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );
CREATE POLICY "dept_settings_update" ON public.dept_settings
  FOR UPDATE USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );
CREATE POLICY "dept_settings_delete" ON public.dept_settings
  FOR DELETE USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );

-- ── org_knowledge: DELETE Policy für Admins ──────────────────────────────────
CREATE POLICY "org_knowledge_delete" ON public.org_knowledge
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
    )
  );

-- ── dept_knowledge: DELETE Policy für dept_admins ────────────────────────────
CREATE POLICY "dept_knowledge_delete" ON public.dept_knowledge
  FOR DELETE USING (
    department_id IN (
      SELECT workspace_id FROM public.department_members
      WHERE user_id = auth.uid() AND role::TEXT = 'admin'
    )
  );

-- ── agent_assignments: fehlender card_id Index ───────────────────────────────
CREATE INDEX IF NOT EXISTS agent_assignments_card_id_idx
  ON public.agent_assignments(card_id) WHERE card_id IS NOT NULL;
