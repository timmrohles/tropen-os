-- 045: RLS für operators, operator_results, workspace_templates
-- Supabase Security Advisory — drei Tabellen ohne RLS in public schema

-- ─────────────────────────────────────────────────────────────────────────────
-- operators
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- SELECT: Workspace-Teilnehmer können eigene Operator-Aufträge sehen
CREATE POLICY "operators_select" ON public.operators
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
    )
  );

-- INSERT / UPDATE / DELETE: nur Service Role (Backend) — kein direkter Client-Zugriff
-- (keine Policy → implizit geblockt für alle außer service_role)

-- ─────────────────────────────────────────────────────────────────────────────
-- operator_results
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.operator_results ENABLE ROW LEVEL SECURITY;

-- SELECT: Workspace-Teilnehmer können Ergebnisse ihrer Workspace-Operatoren sehen
CREATE POLICY "operator_results_select" ON public.operator_results
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- workspace_templates
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.workspace_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: authentifizierte User dürfen öffentliche Templates sehen
CREATE POLICY "workspace_templates_select_public" ON public.workspace_templates
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_public = true
  );

-- INSERT / UPDATE / DELETE: nur Service Role — Templates werden nur über Admin-Migrationen verwaltet
