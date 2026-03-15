# Tropen OS — Migrations-Übersicht
> Supabase CLI ist global installiert, Projekt verlinkt (Ref: `vlwivsjfmcejhiqluaav`).

---

## Workflow

```bash
# Neue Migration anlegen und pushen
supabase/migrations/0XX_name.sql schreiben
cd "/c/Users/timmr/tropen OS" && supabase db push

# Migration bereits manuell per SQL Editor angewendet?
supabase migration repair --status applied <nummer>
# → dann: supabase db push
```

**Fallstricke:**
- `.env.local` muss Unix-Zeilenenden (LF) haben — CRLF bricht den Parser
- Migration-Nummern: einfache Zahlen (001, 002...), kein Timestamp-Format
- APPEND ONLY Tabellen: `card_history`, `project_memory`, `feed_processing_log` — niemals UPDATE oder DELETE

---

## Alle Migrationen

| Datei | Inhalt |
|-------|--------|
| 001_initial.sql | Schema-Grundlage |
| 002_rls.sql | Row Level Security |
| 003_seed.sql | Seed-Daten |
| 004_invite_policies.sql | Einladungs-Policies |
| 005_budget_rpc.sql | Budget-Funktionen |
| 006_conversations_task_type.sql | task_type Spalte |
| 007_onboarding.sql | Onboarding-Felder |
| 008_projects.sql | projects-Tabelle + project_id in conversations |
| 009_ai_act.sql | ai_act_acknowledged + ai_act_acknowledged_at in user_preferences |
| 010_jungle_order.sql | deleted_at, deleted_by, merged_into, has_files, file_types in conversations + cleanup_deleted_conversations() |
| 011_superadmin.sql | role-Check um 'superadmin' erweitert |
| 012_fix_budget_rpc.sql | check_and_reserve_budget: FOR UPDATE von Aggregat auf Einzelzeile verschoben |
| 013_memory_window.sql | memory_window INTEGER in user_preferences |
| 014_rls_audit.sql | messages auf SELECT-only, conversations granulare Policies |
| 015_thinking_mode.sql | thinking_mode BOOLEAN in user_preferences (experimentell) |
| 016_smart_projects.sql | projects um description, context, tone, language, target_audience, memory, updated_at erweitert |
| 017_rag_foundation.sql | pgvector, knowledge_sources/documents/chunks/citations |
| 018_rls_users_fix.sql | users_select_own Policy + user_org_id() SECURITY DEFINER |
| 019_workspace_members_rls.sql | workspace_members RLS-Fix |
| 020_superadmin_workspace_member.sql | Superadmin als workspace_member eingetragen |
| 021_impersonation.sql | impersonation_sessions + support_access_enabled in user_preferences |
| 022_artifacts.sql | artifacts + bookmarks Tabellen |
| 023_proactive_hints.sql | proactive_hints BOOLEAN in user_preferences |
| 024_prompt_templates.sql | prompt_templates Tabelle |
| 025_agents.sql | agents Tabelle (Agenten-System Phase 1) |
| 026_packages.sql | packages, package_agents, org_packages + Marketing-Paket Seed |
| 027+ | diverse Fixes (RLS, workspace → department rename) |
| 030_projects_schema.sql | projects, project_participants, project_knowledge, project_memory (APPEND ONLY) |
| 031_workspaces_schema.sql | workspaces, workspace_participants, cards, card_history (APPEND ONLY), connections, knowledge_entries, outcomes |
| 032_support_tables.sql | dept_settings, org_knowledge, dept_knowledge, agent_assignments, transformations, transformation_links, templates |
| 033_feed_tables.sql | feed_sources, feed_schemas, feed_source_schemas, feed_items, feed_processing_log (APPEND ONLY), feed_distributions |
| 20260314000035_workspace_plan_c.sql | workspace_assets, workspace_exports, workspace_messages |
| 20260314000036_feeds_v2.sql | Feeds v2-Schema: keywords, min_score, content_hash UNIQUE |
