# Tropen OS — Schichten-Mapping (ADR-020)
> Generiert: 2026-04-27
> Referenz-Schichten: **Chat · Inbox · Projektwissen · Merker · Artefakte · Projektboard**
> Markierungen: `?` = kein Schichten-Fit (Plattform-Infrastruktur) · `DUP` = Doppelung zu anderer Position

---

## Legende

| Kürzel | Bedeutung |
|--------|-----------|
| **CH** | Chat (Diskurs, geführte Konversation) |
| **IN** | Inbox (Auffangbecken, externe Quellen) |
| **PW** | Projektwissen (strukturiert, persistent) |
| **MK** | Merker (manuell kuratierte Highlights) |
| **AR** | Artefakte (abgeleitete Zustände) |
| **PB** | Projektboard (integrierende Sicht) |
| **?** | Plattform-Infrastruktur / kein Schichten-Fit |
| **DUP** | Doppelung zu einer anderen Position |

---

## 1. Datenbank-Tabellen (76)

### Kern / Auth (7 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `organizations` | ? | Plattform-Mandant; umschließt alle Schichten |
| `users` | ? | Identität; Voraussetzung, keine Schicht |
| `organization_settings` | ? | Plattform-Config (Features, Budget, Branding) |
| `user_preferences` | ? | User-Config (Sprache, TTS, Beta-Status) |
| `impersonation_sessions` | ? | Superadmin-Audit-Trail |
| `usage_logs` | ? | Observability / Abrechnung |
| `announcements` | ? | Org-Comms; kein Wissens-Flow |

### Workspaces / Chat (19 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `conversations` | CH | Kern-Chat-Session |
| `messages` | CH | Einzelne Nachrichten |
| `focus_log` | CH | Intention-Tracking in Konversationen |
| `workspace_messages` | CH | DUP — Briefing-Kontext in Workspace; paralleler Chat-Store neben `messages` |
| `workspaces` | PB | Department-Container; Projektboard-Hülle |
| `workspace_members` | PB | Membership der integr. Sicht |
| `workspace_participants` | PB | DUP — älteres Schema von `workspace_members` |
| `workspace_items` | PB | Items (Note/Agent) in der Workspace-Sicht |
| `workspace_comments` | CH | Diskussion auf Items — aber kein Konversations-Kontext → DUP mit `messages` |
| `workspace_assets` | AR | Datei-Anhänge = Artefakte |
| `workspace_exports` | AR | Export-Zustände = Artefakte |
| `bookmarks` | MK | Manuell kuratierte Chat-Highlights |
| `artifacts` | AR | Generierte Artefakte (React/PPTX/ECharts) |
| `cards` | PW | DUP — Wissensbaustein-Karten; parallele PW-Struktur neben `project_memory` |
| `card_history` | AR | Versionierte Zustände von Cards |
| `connections` | ? | Externe Datenquellen-Verbindungen; Infrastruktur |
| `templates` | AR | Vorlagen = abgeleitete Zustände |
| `transformations` | ? | Verarbeitungspipeline; kein Schichten-Speicher |
| `transformation_links` | ? | Mapping-Hilfstabelle; kein Schichten-Speicher |
| `prompt_templates` | ? | Chat-Aids; kein eigener Schichten-Speicher |

### Projekte (10 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `projects` | PB | Projekt-Container; Projektboard-Wurzel |
| `project_memory` | PW | Kern-Projektwissen (APPEND ONLY) |
| `project_knowledge` | PW | DUP — separater Wissens-Store neben `project_memory` |
| `project_documents` | PW | Dokumente als Wissensquelle |
| `project_participants` | PB | DUP — älteres Schema; Mitgliedschaft auf Projekt-Ebene |
| `knowledge_entries` | PW | DUP — Workspace-Wissensbasis; drittes paralleles PW-Konstrukt |
| `org_knowledge` | PW | DUP — org-weites Wissen; viertes PW-Konstrukt |
| `dept_knowledge` | PW | DUP — Abteilungs-Wissen; fünftes PW-Konstrukt |
| `dept_settings` | ? | Abteilungs-Config; kein Schichten-Speicher |
| `memory_extraction_log` | PW | Extraktion-Protokoll; Beweis-Trail für PW-Befüllung |

### Feeds (12 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `feed_sources` | IN | Quellen-Konfiguration der Inbox |
| `feed_items` | IN | Eingehende Inbox-Items |
| `feed_processing_log` | IN | Verarbeitungs-Protokoll (APPEND ONLY) |
| `feed_runs` | IN | Run-Protokoll (APPEND ONLY) |
| `feed_notifications` | IN | Inbox-Benachrichtigungen |
| `feed_topics` | IN | Themen-Clustering für Inbox |
| `feed_topic_sources` | IN | Quellen ↔ Topics |
| `feed_schemas` | IN | Schema-Definitionen für strukturierte Feeds |
| `feed_source_schemas` | IN | Quellen ↔ Schemas |
| `feed_data_sources` | IN | Daten-Tab-Quellen |
| `feed_data_records` | IN | Eingehende Datensätze (APPEND ONLY) |
| `feed_distributions` | ? | Routing-Konfiguration (Inbox → andere Schichten); kein Schichten-Speicher selbst |

### Library / Capabilities (11 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `capabilities` | ? | Library-Abstraktion; Meta-Layer oberhalb der 6 Schichten |
| `outcomes` | ? | Library; kein direkter Schichten-Speicher |
| `capability_outcomes` | ? | N:M-Mapping; Infrastruktur |
| `capability_org_settings` | ? | Config; kein Schichten-Speicher |
| `user_capability_settings` | ? | Config; kein Schichten-Speicher |
| `roles` | ? | Library-Rollen; Vorlage für Konfiguration |
| `skills` | ? | Library-Skills; Vorlage |
| `agent_skills` | ? | N:M-Mapping; Infrastruktur |
| `library_versions` | AR | Versions-Historie von Library-Entities = Artefakt-Charakter |
| `org_library_settings` | ? | Org-Config; kein Schichten-Speicher |
| `user_library_settings` | ? | User-Config; kein Schichten-Speicher |

### Agenten (6 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `agents` | ? | Prozess-Layer; operiert auf Schichten, ist keine Schicht |
| `agent_runs` | ? | Prozess-Protokoll (APPEND ONLY); kein Schichten-Speicher |
| `agent_assignments` | ? | Zuweisung; Infrastruktur |
| `guided_workflows` | CH | Geführte Konversation = Chat-Schicht |
| `guided_workflow_options` | CH | Schritte im Guided Chat |
| `guided_workflow_settings` | CH | Aktivierung von Guided Workflows |

### Packages / Superadmin (3 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `packages` | ? | Plattform-Produkt-Bundle; kein Schichten-Speicher |
| `org_packages` | ? | Zuordnung; Infrastruktur |
| `package_agents` | ? | Veraltet; abgelöst durch `roles` |

### Perspectives / AI (5 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `perspective_avatars` | CH | Chat-Beteiligte (parallele KI-Stimmen) |
| `perspective_user_settings` | CH | Pin/Sort der Chat-Avatare |
| `model_catalog` | ? | Plattform-Config; kein Schichten-Speicher |
| `org_mcp_policies` | ? | Integration-Policy; Infrastruktur |
| `user_mcp_connections` | ? | Integration; Infrastruktur |

### Audit (12 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `audit_runs` | AR | Abgeleiteter Zustand des Projekts (Score-Snapshot) |
| `audit_category_scores` | AR | Detailscores = Artefakt-Daten |
| `audit_findings` | AR | Findings = abgeleiteter Projekt-Zustand |
| `audit_fixes` | AR | Fix-Vorschläge = abgeleitete Artefakte |
| `audit_tasks` | PB | Aufgaben zu Findings = Projektboard-Items |
| `audit_review_runs` | AR | Multi-Modell-Review-Ergebnisse |
| `scan_projects` | PB | Externe Projekte in der Sicht |
| `qa_metrics` | AR | Metriken-Snapshots |
| `qa_lighthouse_runs` | AR | Performance-Snapshot |
| `qa_compliance_checks` | AR | Compliance-Snapshot |
| `qa_test_runs` | AR | Test-Ergebnisse |
| `qa_routing_log` | ? | AI-Routing-Protokoll; Observability |

### Beta / UX (4 Tabellen)

| Tabelle | Schicht | Anmerkung |
|---------|---------|-----------|
| `beta_waitlist` | ? | Marketing/Wachstum; kein Schichten-Speicher |
| `beta_feedback` | ? | Produkt-Feedback; kein Schichten-Speicher |
| `dashboard_widgets` | PB | Cockpit-Konfiguration = Projektboard-Sicht |
| `impersonation_sessions` | ? | (bereits oben gelistet) |

---

### Tabellen-Zusammenfassung

| Schicht | Anzahl | Dopplungen (DUP) |
|---------|--------|-----------------|
| CH — Chat | 9 | `workspace_messages`, `workspace_comments` |
| IN — Inbox | 11 | — |
| PW — Projektwissen | 8 | `project_knowledge`, `knowledge_entries`, `org_knowledge`, `dept_knowledge`, `cards` |
| MK — Merker | 1 | — |
| AR — Artefakte | 11 | — |
| PB — Projektboard | 7 | `workspace_participants`, `project_participants` |
| ? — Plattform-Infra | 29 | — |

**Kritischste Dopplungs-Cluster:**
- **PW hat 5 parallele Strukturen:** `project_memory` + `project_knowledge` + `knowledge_entries` + `org_knowledge` + `dept_knowledge` + `cards` → 6 Tabellen für dasselbe Konzept
- **Membership-DUP:** `workspace_participants` (alt) vs `workspace_members` (neu); `project_participants` (alt) vs kein direkter Nachfolger

---

## 2. API-Routes (192) — nach Domain gruppiert

### /api/chat + /api/conversations + /api/messages (8 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/chat/stream` | CH | SSE-Stream; Kern des Chat-Flows |
| `/api/chat/generate-chips` | CH | Chat-Vorschläge |
| `/api/chat/project-intro` | CH | Chat-Einstieg |
| `/api/conversations/*` | CH | Session-Management |
| `/api/conversations/[id]/extract-memory` | PW | Wissens-Extraktion aus Chat → Projektwissen |
| `/api/conversations/[id]/set-intention` | CH | Chat-Intention setzen |
| `/api/conversations/[id]/share` | CH | Chat teilen |
| `/api/messages/[id]/flag` | MK | Nachricht markieren (Vorstufe Merker) |

### /api/perspectives (6 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/perspectives/avatars` | CH | Chat-Avatar-Verwaltung |
| `/api/perspectives/query` | CH | Parallele Avatar-Antworten im Chat |
| `/api/perspectives/post-to-chat` | CH | Perspektiven-Ergebnis in Chat einfügen |
| `/api/perspectives/settings` | CH | Chat-Avatar-Konfiguration |

### /api/guided (7 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/guided/detect` | CH | Workflow-Erkennung aus Chat-Nachricht |
| `/api/guided/resolve` | CH | Workflow-Schritte für Chat auflösen |
| `/api/guided/workflows` | CH | Workflow-Definition (Guided Chat) |
| `/api/guided/settings` | CH | Guided-Aktivierung |

### /api/feeds + /api/cron/feed-* (19 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/feeds/[id]/run` | IN | Feed-Ausführung (Inbox befüllen) |
| `/api/feeds/[id]/runs` | IN | Run-Historie |
| `/api/feeds/[id]/pause` | IN | Feed-Steuerung |
| `/api/feeds/[id]/resume` | IN | Feed-Steuerung |
| `/api/feeds/[id]/distributions` | IN→PW/PB | Routing: Inbox-Items → andere Schichten |
| `/api/feeds/data-sources` | IN | Daten-Tab-Quellen |
| `/api/feeds/data-sources/[id]/records` | IN | Datensätze lesen |
| `/api/feeds/data-sources/[id]/fetch` | IN | Manuell abrufen |
| `/api/feeds/notifications` | IN | Inbox-Benachrichtigungen |
| `/api/cron/feed-fetch` | IN | Cron: Inbox befüllen |
| `/api/cron/feed-process` | IN | Cron: Inbox verarbeiten |
| `/api/cron/feed-digest` | IN | Cron: Tagesübersicht |
| `/api/cron/feed-cleanup` | IN | Cron: Inbox bereinigen |
| `/api/cron/sync-feeds` | IN | Cron: Sync |
| `/api/debug/feeds` | IN | Debug-Endpoint |

### /api/projects/* (11 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/projects` | PB | Projekte listen/anlegen (Container) |
| `/api/projects/[id]` | PB | Projekt-Detail (Hülle) |
| `/api/projects/[id]/memory` | PW | Kern-Projektwissen |
| `/api/projects/[id]/memory/summary` | PW | Wissens-Zusammenfassung |
| `/api/projects/[id]/memory/[memId]` | PW | Einzelner Memory-Eintrag |
| `/api/projects/[id]/documents` | PW | Dokumente als Wissensquelle |
| `/api/projects/[id]/documents/[docId]` | PW | Einzelnes Dokument |
| `/api/projects/[id]/chats` | CH | Chats eines Projekts |
| `/api/projects/[id]/merge` | PB | Projekts zusammenführen |
| `/api/projects/scan` | IN | Externer Projekt-Scan (Inbox-ähnlich) |
| `/api/knowledge` | PW | DUP — parallele PW-Route neben `/api/projects/[id]/memory` |

### /api/bookmarks (1 Route)

| Route | Schicht | Anmerkung |
|-------|---------|-----------|
| `/api/bookmarks` | MK | Merker-CRUD |

### /api/artifacts (5 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/artifacts` | AR | Artefakte listen |
| `/api/artifacts/[id]` | AR | Artefakt-CRUD |
| `/api/artifacts/save` | AR | Artefakt aus Chat speichern |
| `/api/artifacts/transform` | AR | React/TS transformieren |
| `/api/artifacts/export-pptx` | AR | PPTX-Export |

### /api/cockpit + /api/home (12 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/cockpit/feed-highlights` | PB | Inbox-Highlights im Projektboard |
| `/api/cockpit/recommendation` | PB | Projektboard-Empfehlung |
| `/api/cockpit/recent-activity` | PB | Aktivitäts-Sicht |
| `/api/cockpit/projects` | PB | Projekt-Status im Projektboard |
| `/api/cockpit/artifact-stats` | PB | Artefakt-Statistiken im Projektboard |
| `/api/cockpit/team-activity` | PB | Team-Sicht |
| `/api/cockpit/budget` | PB | Budget-Sicht |
| `/api/cockpit/code-health` | PB | Audit-Score im Projektboard |
| `/api/cockpit/setup` | PB | Projektboard einrichten |
| `/api/cockpit/widgets` | PB | Widget-Konfiguration |
| `/api/cockpit/widgets/[id]` | PB | Einzelnes Widget |
| `/api/home/org-stats` | PB | Dashboard-Statistiken |

### /api/workspaces (24 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/workspaces` | PB | Container-Ebene |
| `/api/workspaces/[id]` | PB | Container-Detail |
| `/api/workspaces/[id]/cards` | PW | DUP — Cards als PW neben `project_memory` |
| `/api/workspaces/[id]/cards/[cid]` | PW | DUP |
| `/api/workspaces/[id]/items` | PB | Workspace-Items (Note/Agent) |
| `/api/workspaces/[id]/members` | PB | Mitglieder |
| `/api/workspaces/[id]/members/suggestions` | PB | Mitglieder-Vorschläge |
| `/api/workspaces/[id]/members/[memberId]` | PB | Mitglied bearbeiten |
| `/api/workspaces/[id]/comments` | CH | Diskussion auf Items |
| `/api/workspaces/[id]/comments/[commentId]` | CH | Kommentar bearbeiten |
| `/api/workspaces/[id]/assets` | AR | Datei-Anhänge = Artefakte |
| `/api/workspaces/[id]/assets/[aid]` | AR | Anhang entfernen |
| `/api/workspaces/[id]/share` | PB | Share-Link |
| `/api/workspaces/[id]/copy` | PB | Workspace duplizieren |
| `/api/workspaces/[id]/export` | AR | Workspace-Export |
| `/api/workspaces/[id]/exports` | AR | Export-Liste |
| `/api/workspaces/[id]/chat` | CH | Workspace-Chat |
| `/api/workspaces/[id]/connections` | ? | Externe Verbindungen; Infrastruktur |
| `/api/workspaces/[id]/connections/[connid]` | ? | Verbindung; Infrastruktur |
| `/api/workspaces/[id]/briefing` | AR | Briefing-Generierung = Artefakt |
| `/api/workspaces/briefing` | AR | Org-Briefing |
| `/api/workspaces/[id]/picker` | PB | Picker-Sicht |
| `/api/workspaces/[id]/post-chat` | PW | Chat-Ergebnis → Workspace-Wissen |
| `/api/shared/[token]` | PB | Geteilter Workspace |

### /api/audit (16 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/audit/run` | AR | Audit starten → Artefakt erzeugen |
| `/api/audit/trigger` | AR | Audit triggern + persistieren |
| `/api/audit/runs` | AR | Run-Liste |
| `/api/audit/runs/[id]` | AR | Run-Detail |
| `/api/audit/findings/[id]` | AR | Finding-Status ändern |
| `/api/audit/fix/generate` | AR | Fix-Prompt generieren |
| `/api/audit/fix/batch-generate` | AR | Batch Fix-Prompts |
| `/api/audit/fix/consensus` | AR | Consensus-Fix via Komitee |
| `/api/audit/fix/apply` | AR | Fix anwenden |
| `/api/audit/fix/reject` | AR | Fix ablehnen |
| `/api/audit/review` | AR | Multi-Modell-Review |
| `/api/audit/self-assessment` | AR | Self-Assessment speichern |
| `/api/audit/tasks` | PB | Task zu Finding = Projektboard |
| `/api/audit/tasks/[id]` | PB | Task-Status |
| `/api/audit/export-rules` | AR | Regelwerk-Export |
| `/api/scan-projects/[id]` | PB | Scan-Projekt-Detail |

### /api/library (19 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/library/capabilities` | ? | Library-Abstraktion; Meta-Layer |
| `/api/library/capabilities/[id]/outcomes` | ? | Library |
| `/api/library/outcomes` | ? | Library |
| `/api/library/roles` | ? | Library |
| `/api/library/roles/[id]` | ? | Library |
| `/api/library/roles/[id]/adopt` | ? | Library |
| `/api/library/roles/[id]/import` | ? | Library |
| `/api/library/roles/[id]/publish` | ? | Library |
| `/api/library/roles/[id]/unpublish` | ? | Library |
| `/api/library/skills` | ? | Library |
| `/api/library/skills/[id]` | ? | Library |
| `/api/library/skills/[id]/adopt` | ? | Library |
| `/api/library/skills/[id]/import` | ? | Library |
| `/api/library/skills/[id]/publish` | ? | Library |
| `/api/library/skills/[id]/unpublish` | ? | Library |
| `/api/library/org-settings` | ? | Library-Config |
| `/api/library/user-settings` | ? | Library-Config |
| `/api/library/resolve` | ? | Library-Resolution für LLM |
| `/api/library/versions/[entity_type]/[entity_id]` | AR | Versions-Historie = Artefakt-Charakter |

### /api/agents + /api/cron/agents (7 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/agents` | ? | Agent-Definitionen; Prozess-Layer |
| `/api/agents/[id]` | ? | Agent-CRUD |
| `/api/agents/[id]/copy` | ? | Agent duplizieren |
| `/api/agents/[id]/run` | ? | Agent auslösen |
| `/api/agents/[id]/runs` | ? | Run-Protokoll |
| `/api/agents/runs/[run_id]` | ? | Run-Detail |
| `/api/agents/webhook/[agent_id]` | ? | Webhook-Trigger |
| `/api/packages/agents` | ? | Package-Agents |
| `/api/cron/agents` | ? | Cron: Agenten auslösen |

### /api/admin + /api/superadmin (22 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/admin/*` | ? | Plattform-Administration |
| `/api/superadmin/*` | ? | Superadmin; kein Schichten-Speicher |

### /api/settings (4 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/settings/profile` | ? | User-Config |
| `/api/settings/org` | ? | Org-Config |
| `/api/settings/ki-context` | PW | KI-Kontext = Projektwissen-ähnlich (User-Instruktionen) |
| `/api/settings/connections` | ? | MCP-Verbindungen; Infrastruktur |

### /api/capabilities + /api/skills + /api/transformations (8 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/capabilities/*` | ? | Library-Layer |
| `/api/skills/*` | ? | Library-Layer |
| `/api/transformations` | ? | Verarbeitungspipeline |
| `/api/transformations/analyze` | ? | Pipeline-Analyse |

### /api/beta + /api/onboarding (4 Routes)

| Route-Gruppe | Schicht | Anmerkung |
|-------------|---------|-----------|
| `/api/beta/*` | ? | Marketing/Wachstum |
| `/api/onboarding/complete` | ? | Onboarding-Status |

### Sonstige Routes (10 Routes)

| Route | Schicht | Anmerkung |
|-------|---------|-----------|
| `/api/images/generate` | AR | Generiertes Bild = Artefakt |
| `/api/tts` | ? | Hilfsfunktion; kein Schichten-Speicher |
| `/api/search` | PB | Schichten-übergreifende Suche |
| `/api/health` | ? | Infrastruktur |
| `/api/public/chat` | CH | Öffentlicher Chat |
| `/api/s/[token]` | CH | Shared-Chat-Resolver |
| `/api/repo-map/generate` | AR | Repo-Map = Artefakt |
| `/api/prompt-templates/*` | ? | Chat-Aid; kein eigener Schichten-Speicher |
| `/api/usage/stats` | ? | Observability |
| `/api/user/impersonation-sessions` | ? | Admin-Infrastruktur |
| `/api/announcements/*` | ? | Org-Comms |

---

### Routes-Zusammenfassung

| Schicht | Routes (ca.) | Dopplungen |
|---------|-------------|------------|
| CH — Chat | 30 | `/api/workspaces/[id]/comments` |
| IN — Inbox | 19 | — |
| PW — Projektwissen | 12 | `/api/workspaces/[id]/cards`, `/api/knowledge` |
| MK — Merker | 2 | — |
| AR — Artefakte | 28 | — |
| PB — Projektboard | 24 | — |
| ? — Plattform-Infra | 77 | — |

---

## 3. Komponenten (109 TSX)

### /components/workspace — Chat & Canvas (44 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `_DESIGN_REFERENCE.tsx` | 1273 | ? | Dev-Only Referenz; kein Schichten-Element |
| `ArtifactRenderer.tsx` | 494 | AR | Kern-Artefakt-Renderer |
| `ChatArea.tsx` | 471 | CH | Haupt-Chat-Bereich |
| `WorkspaceBriefing.tsx` | 470 | AR | Briefing = abgeleitetes Artefakt |
| `ChatMessage.tsx` | 401 | CH | Nachricht im Chat |
| `MemorySaveModal.tsx` | 374 | PW | Wissens-Extraktion aus Chat |
| `TemplateDrawer.tsx` | 365 | ? | Template-Bibliothek; Hilfsmittel |
| `ChatHeaderStrip.tsx` | 345 | CH | Chat-Navigation |
| `SessionPanel.tsx` | 335 | PW | Kontext/Wissen für aktive Session |
| `WorkspaceLayout.tsx` | 304 | PB | Integrierende Layout-Shell |
| `PerspectivesBottomSheet.tsx` | 300 | CH | Perspektiven-Antworten im Chat |
| `ArtifactsDrawer.tsx` | 248 | AR | Artefakt-Übersicht |
| `ChatInput.tsx` | 238 | CH | Eingabe-Komponente |
| `ActionLayer.tsx` | 183 | CH | Nachrichts-Aktionen (Übersetzen, Kürzen) |
| `ChatRenderers.tsx` | 178 | CH | Nachrichten-Rendering |
| `modals/JungleModal.tsx` | 175 | CH | Jungle-Order im Chat-Kontext |
| `PerspectivesStrip.tsx` | 175 | CH | Avatar-Strip über Chat |
| `FocusedFlow.tsx` | 171 | CH | Guided/Focused-Mode-UI |
| `BookmarksDrawer.tsx` | 161 | MK | Merker-Übersicht |
| `SearchDrawer.tsx` | 156 | PB | Schichten-übergreifende Suche |
| `ConvItem.tsx` | 156 | CH | Konversations-Element in Sidebar |
| `PostToWorkspaceModal.tsx` | 154 | PW | Chat-Ergebnis → Workspace-Wissen |
| `modals/MergeModal.tsx` | 151 | PB | Projektboard-Operation |
| `PerspectivesBar.tsx` | 142 | CH | Perspectives-Bar |
| `SourcesBar.tsx` | 139 | PW | Quellen-Anzeige (Projektwissen-Kontext) |
| `ContextMenu.tsx` | 120 | CH | Chat-Kontext-Aktionen |
| `GuidedStepCard.tsx` | 79 | CH | Guided-Workflow-Schritt |
| `PanelSelect.tsx` | 78 | ? | UI-Utility |
| `WorkspaceActionCard.tsx` | 70 | PB | Workspace-Aktion im Board |
| `SaveArtifactModal.tsx` | 69 | AR | Artefakt speichern |
| `ArtifactsView.tsx` | 69 | AR | Artefakt-Listenansicht im Chat |
| `IntentionGate.tsx` | 62 | CH | Intention vor Chat-Nutzung |
| `Papierkorb.tsx` | 61 | PB | Gelöschte Elemente-Sicht |
| `BriefingSteps.tsx` | 59 | AR | Briefing-Schritte-Anzeige |
| `ParallelConfirmBubble.tsx` | 54 | CH | Parallel-Tab-Bestätigung im Chat |
| `GuidedModePicker.tsx` | 53 | CH | Guided-Modus-Auswahl |
| `SplitArtifactPanel.tsx` | 47 | AR | Split-View für Artefakte |
| `GuidedSummary.tsx` | 42 | CH | Zusammenfassung nach Guided Flow |
| `ThinkingBlock.tsx` | 40 | CH | Streaming-Indikator |
| `ChatContextStrip.tsx` | 40 | CH | Kontext-Strip (Projekt-Wissen im Chat) |
| `ContextBar.tsx` | 30 | CH | Kontext-Bar |
| `QuickChips.tsx` | 29 | CH | Vorschlags-Chips in Toro-Bubble |
| `CodeBlock.tsx` | 22 | AR | Syntax-Highlighter (Artefakt-Rendering) |
| `PerspectiveMessage.tsx` | 13 | CH | Einzelne Perspektiven-Antwort |
| `ModelComparePopover.tsx` | 6 | CH | Modell-Vergleich-Trigger im Chat |

### /components/ws — Canvas-Ansicht (10 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `ChatPanel.tsx` | 293 | CH | Chat im Canvas |
| `Canvas.tsx` | 280 | PB | Knoten-Canvas = Projektboard-Sicht |
| `WorkspaceForm.tsx` | 278 | PB | Workspace anlegen/bearbeiten |
| `DetailPanel.tsx` | 262 | PW | Card-Detail = Projektwissen |
| `CardForm.tsx` | 243 | PW | Card-Erfassung = Projektwissen |
| `SiloPanel.tsx` | 159 | PB | Filter-Sicht im Board |
| `WorkspaceCard.tsx` | 158 | PB | Card-Darstellung im Canvas |
| `WorkspaceList.tsx` | 149 | PB | Workspace-Liste im Canvas |
| `TopBar.tsx` | 132 | ? | Layout; kein Schichten-Element |
| `ConnectionLines.tsx` | 100 | PB | Visuelle Verbindungen im Board |

### /components/layout — Layout-Shell (5 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `TopBar.tsx` | 325 | ? | Plattform-Navigation |
| `Sidebar.tsx` | 261 | PB | Schichten-Navigation (zeigt alle Schichten) |
| `MobileHeader.tsx` | 242 | ? | Layout; kein Schichten-Element |
| `BottomNav.tsx` | 135 | PB | Mobile Projektboard-Navigation |
| `AppShell.tsx` | 77 | ? | Layout-Wrapper |

### /components/workspaces — Workspace-Liste (10 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `WorkspacesList.tsx` | 337 | PB | Workspace-Grid = Projektboard |
| `MembersList.tsx` | 240 | PB | Mitglieder-Tab |
| `WorkspaceItemsList.tsx` | 181 | PB | Items-Tab |
| `WorkspacePicker.tsx` | 159 | PB | Workspace-Picker |
| `AddItemModal.tsx` | 152 | PB | Item hinzufügen |
| `WorkspaceCard.tsx` | 151 | PB | Karten-Darstellung |
| `CommentThread.tsx` | 147 | CH | Diskussion — DUP mit Chat |
| `ShareLinkPanel.tsx` | 109 | PB | Share-Konfiguration |
| `WorkspaceSettings.tsx` | 124 | PB | Workspace-Einstellungen |
| `CardTile.tsx` | 112 | PW | Card-Kachel = Projektwissen |

### /components/cockpit — Dashboard (13 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `CockpitOnboarding.tsx` | 122 | PB | Onboarding ins Projektboard |
| `WidgetPickerModal.tsx` | 95 | PB | Widget-Auswahl für Board |
| `CockpitGrid.tsx` | 94 | PB | Widget-Grid = Projektboard-Sicht |
| `widgets/CodeHealthWidget.tsx` | 127 | PB | Audit-Score im Board |
| `widgets/BudgetUsageWidget.tsx` | 71 | PB | Budget im Board |
| `widgets/RecentActivityWidget.tsx` | 67 | PB | Aktivitäts-Sicht |
| `widgets/FeedHighlightsWidget.tsx` | 60 | PB | Inbox-Highlights im Board |
| `widgets/ProjectStatusWidget.tsx` | 59 | PB | Projekt-Status im Board |
| `widgets/ArtifactOverviewWidget.tsx` | 57 | PB | Artefakt-Statistiken im Board |
| `widgets/TeamActivityWidget.tsx` | 52 | PB | Team-Sicht im Board |
| `widgets/ToroRecommendationWidget.tsx` | 49 | PB | Empfehlung im Board |
| `widgets/QuickActionsWidget.tsx` | 44 | PB | Schnell-Links im Board |
| `widgets/Shared.tsx` | 51 | PB | Widget-Helfer |

### /components/admin — Admin-Panels (6 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `qa/QaShared.tsx` | 199 | ? | Admin-Tool; kein Schichten-Element |
| `qa/PerformancePanel.tsx` | 165 | ? | Admin |
| `qa/CompliancePanel.tsx` | 144 | ? | Admin |
| `qa/OverviewPanel.tsx` | 139 | ? | Admin |
| `qa/RoutingPanel.tsx` | 134 | ? | Admin |
| `qa/QualityPanel.tsx` | 133 | ? | Admin |

### /components/home — Landing (6 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `OrgOnboardingProgress.tsx` | 112 | PB | Fortschritts-Sicht = Projektboard |
| `ChatCTA.tsx` | 75 | CH | Einstieg in Chat |
| `OrgHealthSection.tsx` | 74 | PB | Org-Zustand = Projektboard-Sicht |
| `FeatureGrid.tsx` | 71 | ? | Landing-Page; Plattform-Komm. |
| `AnnouncementsFeed.tsx` | 60 | ? | Org-Comms |
| `RecentlyUsed.tsx` | 58 | PB | Letzte Aktivitäten im Board |

### /components/artefakte (1 Datei)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `ArtifactPreviewModal.tsx` | 87 | AR | Artefakt-Vorschau |

### /components/ui (1 Datei)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `ToroBird.tsx` | 68 | ? | Plattform-Branding |

### Globale Komponenten (11 Dateien)

| Komponente | Zeilen | Schicht | Anmerkung |
|-----------|--------|---------|-----------|
| `ToroChatWidget.tsx` | 242 | CH | Chat-Widget |
| `AccountSwitcher.tsx` | 139 | ? | Plattform-Navigation |
| `ImpersonationBanner.tsx` | 113 | ? | Admin-Infrastruktur |
| `MessageActions.tsx` | 95 | MK | Bookmark-Aktion; Merker-Einstieg |
| `CookieBanner.tsx` | 83 | ? | Legal/Compliance |
| `NavBarNotifications.tsx` | 80 | IN | Inbox-Benachrichtigungen in TopBar |
| `ParrotIcon.tsx` | 58 | ? | Branding |
| `AppFooter.tsx` | 57 | ? | Layout |
| `Parrot.tsx` | 27 | ? | Branding |
| `ServiceWorkerRegistrar.tsx` | 18 | ? | PWA-Infrastruktur |
| `AxeHelper.tsx` | 18 | ? | Dev-Tool |

---

### Komponenten-Zusammenfassung

| Schicht | Komponenten | Dopplungen |
|---------|-------------|------------|
| CH — Chat | 35 | `CommentThread.tsx` |
| IN — Inbox | 1 | — |
| PW — Projektwissen | 7 | — |
| MK — Merker | 3 | — |
| AR — Artefakte | 9 | — |
| PB — Projektboard | 31 | — |
| ? — Plattform-Infra | 23 | — |

**Fehlendes Schichten-UI:** Inbox hat nur 1 Komponente (`NavBarNotifications.tsx`) — kein dediziertes Inbox-UI gebaut.

---

## Gesamtüberblick & kritische Befunde

### Schichten-Abdeckung

| Schicht | DB-Tabellen | API-Routes | Komponenten | Urteil |
|---------|------------|------------|-------------|--------|
| CH — Chat | 9 | 30 | 35 | ✅ Gut abgedeckt |
| IN — Inbox | 11 | 19 | 1 | ⚠️ UI fehlt fast vollständig |
| PW — Projektwissen | 8 | 12 | 7 | ⚠️ Stark fragmentiert (DUPs) |
| MK — Merker | 1 | 2 | 3 | ⚠️ Minimal |
| AR — Artefakte | 11 | 28 | 9 | ✅ Gut abgedeckt |
| PB — Projektboard | 7 | 24 | 31 | ✅ Gut abgedeckt |
| ? — Plattform-Infra | 29 | 77 | 23 | ℹ️ Erwartet |

### Top-5-Probleme

1. **Projektwissen-Fragmentierung (kritisch):** 6 parallele Speicher-Strukturen (`project_memory`, `project_knowledge`, `knowledge_entries`, `org_knowledge`, `dept_knowledge`, `cards`) — keine klare Kanonisierung.

2. **Inbox hat kein UI (kritisch):** 11 Tabellen und 19 Routes, aber nur 1 Komponente. Die Inbox existiert als Datenschicht (Feeds), aber die User-Interaktionsschicht fehlt.

3. **Merker ist unterentwickelt (mittel):** 1 Tabelle, 2 Routes, 3 Komponenten — nur Bookmarks. Kein Sichtbarkeits-Mechanismus, keine Reaktivierung in späteren Sessions (ADR-020 beschreibt das als Kernfunktion).

4. **Library/Capabilities ohne Schichten-Fit (mittel):** 11 Tabellen + 19 Routes ohne klares Schichten-Mapping. Das ist ein Meta-Layer, der in ADR-020 nicht erwähnt wird — entweder in Schichten einordnen oder explizit als 7. Layer modellieren.

5. **Plattform-Infra-Overhead (beobachten):** 77 von 192 Routes (40%) und 29 von 76 Tabellen sind Plattform-Infrastruktur ohne Schichten-Fit. Zeigt wie viel betrieben werden muss, bevor die 6 Schichten zum Tragen kommen.
