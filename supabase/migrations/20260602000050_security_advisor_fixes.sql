-- 20260602000050_security_advisor_fixes.sql
-- Behebt Supabase Database Linter Findings (Stand 2026-06-02):
--   1× ERROR  security_definer_view        (projects_with_stats)
--   N× WARN   function_search_path_mutable (9 Funktionen)
--   4× WARN   anon/authenticated_security_definer_function_executable
--   1× WARN   rls_policy_always_true       (qa_compliance_checks UPDATE)
-- Bewusst NICHT angefasst (gewollt/riskant): siehe docs/merge-notes.

-- ── 1. CRITICAL: Security Definer View ───────────────────────────────────────
-- View nutzt jetzt die RLS/Rechte des abfragenden Users statt des Erstellers.
-- Selektiert aus projects + conversations (beide org-scoped per RLS) → korrekt isoliert.
ALTER VIEW public.projects_with_stats SET (security_invoker = on);

-- ── 2. search_path pinnen (gegen search_path-Hijacking) ──────────────────────
-- Behavior-preserving: alle Bodies referenzieren nur public-Objekte + qualifiziertes auth.uid().
ALTER FUNCTION public.get_my_organization_id()                         SET search_path = public;
ALTER FUNCTION public.user_org_id()                                    SET search_path = public;
ALTER FUNCTION public.check_and_reserve_budget(uuid, uuid, numeric)    SET search_path = public;
ALTER FUNCTION public.cleanup_deleted_conversations()                  SET search_path = public;
ALTER FUNCTION public.fn_workspace_comment_count()                     SET search_path = public;
ALTER FUNCTION public.fn_workspace_item_count()                        SET search_path = public;
ALTER FUNCTION public.knowledge_entries_update_search_vector()         SET search_path = public;
ALTER FUNCTION public.search_knowledge_chunks(vector, uuid, uuid, uuid, double precision, integer) SET search_path = public;
ALTER FUNCTION public.prevent_superadmin_assignment()                  SET search_path = public;

-- ── 3. EXECUTE-Rechte härten ─────────────────────────────────────────────────
-- Diese Funktionen werden NUR serverseitig (Service Role) bzw. von Triggern genutzt,
-- nie via Client-RPC. get_my_organization_id/user_org_id bleiben offen (RLS-kritisch).
REVOKE EXECUTE ON FUNCTION public.check_and_reserve_budget(uuid, uuid, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_deleted_conversations()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_workspace_comment_count()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_workspace_item_count()        FROM PUBLIC, anon, authenticated;
-- Service Role behält Ausführungsrecht (explizite Grants bleiben bestehen).
GRANT EXECUTE ON FUNCTION public.cleanup_deleted_conversations() TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_workspace_comment_count()     TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_workspace_item_count()        TO service_role;

-- ── 4. Over-permissive RLS-Policy entfernen ──────────────────────────────────
-- qa_compliance_checks: 'auth_update' erlaubte jedem authenticated-User jede Zeile zu ändern (USING true).
-- Updates laufen ausschließlich über Service Role (admin/qa/compliance/[id], superadmin-gated) → Policy unnötig.
DROP POLICY IF EXISTS "auth_update" ON public.qa_compliance_checks;
