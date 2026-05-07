# Tropen OS — Bestands-Tabelle
> Generiert: 2026-04-27 | 76 DB-Tabellen · 192 API-Routes · 109 Komponenten

---

## 1. Datenbank-Tabellen (76)

### Kern / Auth

| Tabelle | Beschreibung |
|---------|-------------|
| `organizations` | Mandanten (Firmen); Basis jeder Org-Hierarchie |
| `users` | Nutzerprofile; FK zu auth.users |
| `organization_settings` | Pro-Org-Config: Features, Branding, Budget, Workflow-Provider, AI-Governance |
| `user_preferences` | Pro-User-Config: Emoji-Stil, TTS, Beta-Status, Cockpit-Setup, Language-Style |
| `impersonation_sessions` | Superadmin-Impersonation-Log (Audit-Trail) |
| `usage_logs` | Token/API-Nutzungsprotokoll pro Org |
| `announcements` | Org-weite Ankündigungen (Admin → Nutzer) |

### Workspaces / Chat

| Tabelle | Beschreibung |
|---------|-------------|
| `workspaces` | Departments (früher: workspaces) – Abteilungs-Container |
| `workspace_members` | Mitgliedschaften in Workspaces mit Rollen |
| `workspace_items` | Inhalte eines Workspace (note/agent/etc.) |
| `workspace_comments` | Kommentar-Threads auf Workspace-Items |
| `workspace_assets` | Datei-Anhänge in Workspaces |
| `workspace_exports` | Export-Protokoll (PDF, JSON etc.) |
| `workspace_messages` | Workspace-interne Nachrichten (briefing context) |
| `workspace_participants` | Älteres Schema (abgelöst von workspace_members) |
| `conversations` | Chat-Sessions mit Typ, Intention, Share-Token |
| `messages` | Einzelne Chat-Nachrichten inkl. Attachments, Streaming-State |
| `bookmarks` | Gespeicherte Nachrichten mit full_content |
| `artifacts` | Generierte Artefakte (react/data/image/pptx/etc.) |
| `card_history` | APPEND ONLY – Versionsgeschichte von Cards |
| `cards` | Wissensbaustein-Karten in Workspaces |
| `connections` | Externe Datenquellen-Verbindungen pro Workspace |
| `templates` | Prompt-Templates / Workspace-Templates |
| `transformations` | Transformationsprozesse (Toro-Engine) |
| `transformation_links` | Verknüpfung Transformationen ↔ Workspaces/Projekte |
| `prompt_templates` | Nutzerdefinierte Prompt-Vorlagen |

### Projekte

| Tabelle | Beschreibung |
|---------|-------------|
| `projects` | Projekte mit Emoji, Kontext, Ziel, Instruktionen |
| `project_memory` | APPEND ONLY – Projektgedächtnis (feed_item, manual, etc.) |
| `project_knowledge` | Wissensbasis-Einträge pro Projekt |
| `project_documents` | Hochgeladene Dokumente mit Extraktions-Status |
| `project_participants` | Projekt-Mitglieder |
| `knowledge_entries` | Workspace-Wissensbasis (entry_type='feed' etc.) |
| `org_knowledge` | Organisations-weites Wissen |
| `dept_knowledge` | Abteilungs-Wissen |
| `dept_settings` | Abteilungs-spezifische Einstellungen |
| `memory_extraction_log` | APPEND ONLY – KI-Gedächtnis-Extraktion aus Konversationen |

### Feeds

| Tabelle | Beschreibung |
|---------|-------------|
| `feed_sources` | RSS/API-Feed-Quellen mit Status, Pausierung |
| `feed_items` | Einzelne Feed-Artikel mit Score, dismissed_at |
| `feed_processing_log` | APPEND ONLY – Verarbeitungsprotokoll pro Item |
| `feed_distributions` | Output-Konfiguration (→ project/workspace/notification) |
| `feed_runs` | APPEND ONLY – Run-Historie pro Feed-Quelle |
| `feed_notifications` | Benachrichtigungen aus Feed-Runs |
| `feed_topics` | Themen-Cluster für Feeds |
| `feed_topic_sources` | Zuordnung Feed-Quellen ↔ Topics |
| `feed_schemas` | Schema-Definition für strukturierte Feeds |
| `feed_source_schemas` | Zuordnung Quellen ↔ Schemas |
| `feed_data_sources` | Daten-Tab-Quellen (strukturierte Datensätze) |
| `feed_data_records` | APPEND ONLY – Datensätze aus feed_data_sources |

### Library / Capabilities

| Tabelle | Beschreibung |
|---------|-------------|
| `capabilities` | Fähigkeiten-Bausteine (system/package/org/user) |
| `outcomes` | Erwartete Ergebnisse pro Capability |
| `capability_outcomes` | N:M-Verknüpfung Capabilities ↔ Outcomes |
| `capability_org_settings` | Org-spezifische Capability-Aktivierung |
| `user_capability_settings` | User-spezifische Capability-Präferenzen |
| `roles` | Rollen-Definitionen (Library-System) |
| `skills` | Skills / Kompetenzen (system/package/org/user) |
| `agent_skills` | N:M-Verknüpfung Agents ↔ Skills |
| `library_versions` | Versionierung von Library-Entitäten |
| `org_library_settings` | Org-weite Library-Konfiguration |
| `user_library_settings` | User-eigene Library-Präferenzen |

### Agenten

| Tabelle | Beschreibung |
|---------|-------------|
| `agents` | Agent-Definitionen mit Trigger, Scope, Konfiguration |
| `agent_runs` | APPEND ONLY – Ausführungsprotokoll pro Agent |
| `agent_assignments` | Zuordnung Agents ↔ Workspaces/Projekte |
| `guided_workflows` | Geführte Workflow-Definitionen (7 System + Custom) |
| `guided_workflow_options` | Optionen innerhalb eines Guided Workflow |
| `guided_workflow_settings` | Org/User-Aktivierung von Guided Workflows |

### Packages / Superadmin

| Tabelle | Beschreibung |
|---------|-------------|
| `packages` | Feature-Pakete (Marketing, etc.) |
| `org_packages` | Zuordnung Packages ↔ Orgs |
| `package_agents` | Agents aus Packages (abgelöst durch roles) |

### Perspectives / AI

| Tabelle | Beschreibung |
|---------|-------------|
| `perspective_avatars` | KI-Perspektiven-Avatare (system/org/user) |
| `perspective_user_settings` | Pin/Sort-Einstellungen pro User |
| `model_catalog` | Modell-Katalog mit Governance-Feldern, EU-Hosting, Kosten |
| `org_mcp_policies` | MCP-Verbindungs-Policies pro Org |
| `user_mcp_connections` | User-eigene MCP-Verbindungen |

### Audit

| Tabelle | Beschreibung |
|---------|-------------|
| `audit_runs` | APPEND ONLY – Audit-Durchläufe mit Score + Metadaten |
| `audit_category_scores` | APPEND ONLY – Score pro Kategorie pro Run |
| `audit_findings` | Findings mit Status (open/fixed/dismissed), consensus_level |
| `audit_fixes` | Fix-Vorschläge mit risk_level, fix_mode, judge_explanation |
| `audit_tasks` | Aufgaben zu Findings (Snapshot + completed-Status) |
| `audit_review_runs` | Multi-Modell-Review-Durchläufe |
| `scan_projects` | Externe Scan-Projekte mit Profil, Stack, Score |
| `qa_metrics` | QA-Metriken (Performance, Lighthouse) |
| `qa_lighthouse_runs` | Lighthouse-Audit-Runs |
| `qa_compliance_checks` | Compliance-Check-Ergebnisse |
| `qa_test_runs` | Test-Run-Protokoll |
| `qa_routing_log` | AI-Routing-Entscheidungen Log |

### Beta / UX

| Tabelle | Beschreibung |
|---------|-------------|
| `beta_waitlist` | Warteliste für Beta-Zugang |
| `beta_feedback` | Feedback-Ratings aus Beta-Onboarding |
| `focus_log` | APPEND ONLY – Intention-/Focus-Tracking in Conversations |
| `dashboard_widgets` | Cockpit-Widget-Konfiguration pro User/Org |

---

## 2. API-Routes (192)

### /api/admin — Admin-Verwaltung (13)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/admin/branding` | GET/PATCH | Org-Branding (Logo, Farben, KI-Assistent-Bild) |
| `/api/admin/budget` | GET/PATCH | Budget-Limit und Verbrauch pro Org |
| `/api/admin/logs` | GET | Usage-Logs mit Token-Verbrauch |
| `/api/admin/models` | GET | Modell-Liste nach Org-Config gefiltert |
| `/api/admin/models/[id]` | GET/PATCH | Einzelnes Modell aktivieren/konfigurieren |
| `/api/admin/qa/compliance` | GET | Compliance-Check-Übersicht |
| `/api/admin/qa/compliance/[id]` | GET | Einzelner Compliance-Check |
| `/api/admin/qa/overview` | GET | QA-Dashboard-Übersicht |
| `/api/admin/qa/performance` | GET | Performance-Metriken |
| `/api/admin/qa/quality` | GET | Code-Qualitäts-Metriken |
| `/api/admin/qa/routing` | GET | AI-Routing-Log |
| `/api/admin/qa/runs` | GET | QA-Run-Historie |
| `/api/admin/users` | GET/PATCH | User-Verwaltung (Rollen, Aktivierung) |

### /api/agents — Agenten-System (8)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/agents` | GET/POST | Agenten-Liste + neuen Agent anlegen |
| `/api/agents/[id]` | GET/PATCH/DELETE | Agent lesen/bearbeiten/löschen |
| `/api/agents/[id]/copy` | POST | Agent duplizieren |
| `/api/agents/[id]/run` | POST | Agent manuell auslösen |
| `/api/agents/[id]/runs` | GET | Run-Historie eines Agents |
| `/api/agents/runs/[run_id]` | GET | Einzelner Run-Detail |
| `/api/agents/webhook/[agent_id]` | POST | Webhook-Trigger für externen Aufruf |
| `/api/packages/agents` | GET | Package-Agenten (system-scope) |

### /api/audit — Audit-System (16)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/audit/run` | POST | Audit-Run starten (intern, Tropen OS selbst) |
| `/api/audit/trigger` | POST | Audit starten + in DB persistieren |
| `/api/audit/runs` | GET | Run-Liste mit Scores |
| `/api/audit/runs/[id]` | GET | Run-Detail mit Kategorien + Findings |
| `/api/audit/findings/[id]` | PATCH | Finding-Status ändern (dismiss, fix, etc.) |
| `/api/audit/fix/generate` | POST | Fix-Prompt für einzelnes Finding generieren |
| `/api/audit/fix/batch-generate` | POST | Fix-Prompts für mehrere Findings |
| `/api/audit/fix/consensus` | POST | Consensus-Fix via Multi-Modell-Komitee |
| `/api/audit/fix/apply` | POST | Fix als applied markieren |
| `/api/audit/fix/reject` | POST | Fix ablehnen |
| `/api/audit/review` | POST | Multi-Modell-Review eines Findings |
| `/api/audit/self-assessment` | POST | Self-Assessment-Antworten speichern |
| `/api/audit/tasks` | GET/POST | Task zu Finding anlegen/listen |
| `/api/audit/tasks/[id]` | PATCH | Task als erledigt markieren |
| `/api/audit/export-rules` | GET | Regelwerk als JSON exportieren |
| `/api/scan-projects/[id]` | GET/PATCH | Scan-Projekt lesen/aktualisieren |

### /api/chat — Chat & Stream (3)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/chat/stream` | POST | Canvas/Card-Chat SSE-Stream (Anthropic direkt) |
| `/api/chat/generate-chips` | POST | Kontext-Chips für Chat-Input generieren |
| `/api/chat/project-intro` | POST | Projekt-Einstiegsnachricht generieren |

### /api/cockpit — Dashboard-Widgets (11)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/cockpit/feed-highlights` | GET | Top-5-Feed-Artikel letzte 24h |
| `/api/cockpit/recommendation` | GET | Regelbasierte Empfehlung (kein LLM) |
| `/api/cockpit/recent-activity` | GET | Letzte Chats + Artefakte des Users |
| `/api/cockpit/projects` | GET | Aktive Projekte mit Chat-Count |
| `/api/cockpit/artifact-stats` | GET | Artefakt-Statistiken (diese Woche/gesamt) |
| `/api/cockpit/team-activity` | GET | Admin: Org-weite Aktivität letzte 2 Tage |
| `/api/cockpit/budget` | GET | Budget-% + Euro-Werte |
| `/api/cockpit/code-health` | GET | Letzter Audit-Score für Cockpit-Widget |
| `/api/cockpit/setup` | POST | Cockpit-Setup als abgeschlossen markieren |
| `/api/cockpit/widgets` | GET/PATCH | Widget-Konfiguration laden/speichern |
| `/api/cockpit/widgets/[id]` | PATCH/DELETE | Einzelnes Widget konfigurieren/entfernen |

### /api/conversations — Konversationen (5)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/conversations/new-from-message` | POST | Neue Konversation aus bestehender Nachricht |
| `/api/conversations/reply` | POST | Direktantwort in Konversation |
| `/api/conversations/[id]/extract-memory` | POST | Gedächtnis-Extraktion triggern |
| `/api/conversations/[id]/set-intention` | POST | Konversations-Intention setzen (focused/guided) |
| `/api/conversations/[id]/share` | POST/DELETE | Share-Token anlegen/widerrufen |

### /api/cron — Scheduled Jobs (6)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/cron/feed-fetch` | POST | Cron: Feed-Quellen abrufen |
| `/api/cron/feed-process` | POST | Cron: Feed-Items verarbeiten + Stage 2/3 |
| `/api/cron/feed-digest` | POST | Cron: Tagesübersicht generieren |
| `/api/cron/feed-cleanup` | POST | Cron: Alte Feed-Items bereinigen |
| `/api/cron/sync-feeds` | POST | Cron: Feed-Sync-Trigger |
| `/api/cron/agents` | POST | Cron: Geplante Agenten ausführen |

### /api/feeds — Feed-System (13)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/feeds/[id]/run` | POST | Feed manuell ausführen |
| `/api/feeds/[id]/runs` | GET | Run-Historie eines Feeds |
| `/api/feeds/[id]/pause` | POST | Feed pausieren |
| `/api/feeds/[id]/resume` | POST | Feed fortsetzen |
| `/api/feeds/[id]/distributions` | GET/POST | Outputs konfigurieren |
| `/api/feeds/[id]/distributions/[distId]` | DELETE | Distribution entfernen |
| `/api/feeds/data-sources` | GET/POST | Daten-Tab-Quellen |
| `/api/feeds/data-sources/[id]` | GET/PATCH/DELETE | Einzelne Datenquelle |
| `/api/feeds/data-sources/[id]/fetch` | POST | Datenquelle manuell abrufen |
| `/api/feeds/data-sources/[id]/records` | GET | Datensätze einer Quelle |
| `/api/feeds/notifications` | GET | Feed-Benachrichtigungen |
| `/api/feeds/notifications/[id]` | PATCH | Benachrichtigung als gelesen markieren |
| `/api/feeds/inbound/email` | POST | Inbound-Email → Feed-Item |

### /api/library — Library-System (17)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/library/capabilities` | GET/POST | Capabilities listen/anlegen |
| `/api/library/capabilities/[id]/outcomes` | GET | Outcomes einer Capability |
| `/api/library/outcomes` | GET/POST | Outcomes listen/anlegen |
| `/api/library/roles` | GET/POST | Rollen listen/anlegen |
| `/api/library/roles/[id]` | GET/PATCH/DELETE | Rolle lesen/bearbeiten |
| `/api/library/roles/[id]/adopt` | POST | Systemrolle als Org-Kopie übernehmen |
| `/api/library/roles/[id]/import` | POST | Rolle importieren |
| `/api/library/roles/[id]/publish` | POST | Rolle veröffentlichen |
| `/api/library/roles/[id]/unpublish` | POST | Rolle depublizieren |
| `/api/library/skills` | GET/POST | Skills listen/anlegen |
| `/api/library/skills/[id]` | GET/PATCH/DELETE | Skill lesen/bearbeiten |
| `/api/library/skills/[id]/adopt` | POST | System-Skill übernehmen |
| `/api/library/skills/[id]/import` | POST | Skill importieren |
| `/api/library/skills/[id]/publish` | POST | Skill veröffentlichen |
| `/api/library/skills/[id]/unpublish` | POST | Skill depublizieren |
| `/api/library/org-settings` | GET/PATCH | Org-Library-Einstellungen |
| `/api/library/user-settings` | GET/PATCH | User-Library-Einstellungen |
| `/api/library/resolve` | POST | Library-Entity für LLM-Call auflösen |
| `/api/library/versions/[entity_type]/[entity_id]` | GET | Versions-Historie einer Library-Entity |

### /api/perspectives — KI-Perspektiven (6)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/perspectives/avatars` | GET/POST | Avatare listen/anlegen |
| `/api/perspectives/avatars/[id]` | PATCH/DELETE | Avatar bearbeiten/löschen |
| `/api/perspectives/avatars/[id]/copy` | POST | Avatar kopieren |
| `/api/perspectives/query` | POST | Parallele SSE-Streams aller Avatare |
| `/api/perspectives/post-to-chat` | POST | Perspektiven-Antwort in Chat einfügen |
| `/api/perspectives/settings` | GET/PATCH | Pin/Sort-Einstellungen |

### /api/projects — Projekte (11)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/projects` | GET/POST | Projekte listen/anlegen |
| `/api/projects/[id]` | GET/PATCH/DELETE | Projekt lesen/bearbeiten/archivieren |
| `/api/projects/[id]/chats` | GET | Chats eines Projekts |
| `/api/projects/[id]/memory` | GET/POST | Projektgedächtnis |
| `/api/projects/[id]/memory/summary` | POST | Gedächtnis-Zusammenfassung generieren |
| `/api/projects/[id]/memory/[memId]` | DELETE | Memory-Eintrag löschen |
| `/api/projects/[id]/documents` | GET/POST | Dokumente eines Projekts |
| `/api/projects/[id]/documents/[docId]` | GET/DELETE | Einzelnes Dokument |
| `/api/projects/[id]/merge` | POST | Projekt in anderes zusammenführen |
| `/api/projects/scan` | POST | Externen Projektordner scannen (File System Access) |
| `/api/home/org-stats` | GET | Dashboard-Statistiken (Chats, Artefakte, Nutzer) |

### /api/settings — Einstellungen (4)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/settings/profile` | GET/PATCH | User-Profil (Name, Avatar, Sprache) |
| `/api/settings/org` | GET/PATCH | Org-Einstellungen (Name, Adresse) |
| `/api/settings/ki-context` | GET/PATCH | KI-Kontext-Anleitung des Users |
| `/api/settings/connections` | GET/POST/DELETE | Externe Verbindungen (MCP etc.) |

### /api/superadmin — Superadmin (9)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/superadmin/clients` | GET/POST | Alle Orgs listen/anlegen |
| `/api/superadmin/clients/[id]` | PATCH/DELETE | Org bearbeiten |
| `/api/superadmin/clients/[id]/activate-user` | POST | User-Account aktivieren |
| `/api/superadmin/impersonate` | GET | Aktive Impersonation prüfen |
| `/api/superadmin/impersonate/[id]` | POST/DELETE | Als Org impersonieren |
| `/api/superadmin/agents` | GET | Agent Rule Packs mit Findings-Counts |
| `/api/superadmin/packages` | GET/POST | Packages verwalten |
| `/api/superadmin/packages/[orgId]` | GET/PATCH | Org-Packages |
| `/api/superadmin/perspectives` | GET/POST | System-Avatare verwalten |
| `/api/superadmin/perspectives/[id]` | PATCH/DELETE | System-Avatar bearbeiten |

### /api/workspaces — Workspaces (24)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/workspaces` | GET/POST | Workspaces listen/anlegen |
| `/api/workspaces/[id]` | GET/PATCH/DELETE | Workspace lesen/bearbeiten |
| `/api/workspaces/[id]/cards` | GET/POST | Cards eines Workspace |
| `/api/workspaces/[id]/cards/[cid]` | GET/PATCH/DELETE | Card lesen/bearbeiten |
| `/api/workspaces/[id]/items` | GET/POST | Items (Notes, Agents) listen/anlegen |
| `/api/workspaces/[id]/items/[itemId]` | PATCH/DELETE | Item bearbeiten |
| `/api/workspaces/[id]/members` | GET/POST | Mitglieder verwalten |
| `/api/workspaces/[id]/members/suggestions` | GET | Mitglieder-Vorschläge (Org-User) |
| `/api/workspaces/[id]/members/[memberId]` | PATCH/DELETE | Mitglied bearbeiten |
| `/api/workspaces/[id]/comments` | GET/POST | Kommentare |
| `/api/workspaces/[id]/comments/[commentId]` | PATCH/DELETE | Kommentar bearbeiten |
| `/api/workspaces/[id]/assets` | GET/POST | Datei-Anhänge |
| `/api/workspaces/[id]/assets/[aid]` | DELETE | Anhang entfernen |
| `/api/workspaces/[id]/share` | POST/DELETE | Share-Link anlegen/widerrufen |
| `/api/workspaces/[id]/copy` | POST | Workspace duplizieren |
| `/api/workspaces/[id]/export` | POST | Workspace exportieren |
| `/api/workspaces/[id]/exports` | GET | Export-Liste |
| `/api/workspaces/[id]/chat` | POST | Workspace-Chat triggern |
| `/api/workspaces/[id]/connections` | GET/POST | Verbindungen zum Workspace |
| `/api/workspaces/[id]/connections/[connid]` | PATCH/DELETE | Verbindung bearbeiten |
| `/api/workspaces/[id]/briefing` | POST | Workspace-Briefing generieren |
| `/api/workspaces/[id]/picker` | GET | Workspace-Auswahl (für Modals) |
| `/api/workspaces/[id]/post-chat` | POST | Chat-Ergebnis in Workspace posten |
| `/api/workspaces/briefing` | POST | Org-weites Briefing |

### Sonstige API-Routes (19)

| Route | Methoden | Beschreibung |
|-------|----------|-------------|
| `/api/artifacts` | GET | Artefakte listen |
| `/api/artifacts/[id]` | GET/PATCH/DELETE | Einzelnes Artefakt |
| `/api/artifacts/save` | POST | Artefakt aus Chat speichern |
| `/api/artifacts/transform` | POST | React/TS Artefakt via Sucrase transformieren |
| `/api/artifacts/export-pptx` | POST | Präsentations-Artefakt als PPTX exportieren |
| `/api/capabilities` | GET/POST | Capabilities (einfaches Listing) |
| `/api/capabilities/org-settings` | GET/PATCH | Org-Capability-Einstellungen |
| `/api/capabilities/resolve` | POST | Capability + Outcome für LLM auflösen |
| `/api/capabilities/settings` | GET/PATCH | User-Capability-Einstellungen |
| `/api/guided/detect` | POST | Guided Workflow aus Nachricht erkennen |
| `/api/guided/resolve` | POST | Guided Workflow-Schritte auflösen |
| `/api/guided/settings` | GET/PATCH | Guided-Workflow-Einstellungen |
| `/api/guided/workflows` | GET/POST | Guided Workflows listen/anlegen |
| `/api/guided/workflows/[id]` | GET/PATCH/DELETE | Workflow bearbeiten |
| `/api/guided/workflows/[id]/copy` | POST | Workflow kopieren |
| `/api/beta/waitlist` | POST | Auf Waitlist eintragen |
| `/api/beta/feedback` | POST | Beta-Feedback senden |
| `/api/beta/onboarding-complete` | POST | Onboarding als abgeschlossen markieren |
| `/api/bookmarks` | GET/POST/DELETE | Lesezeichen verwalten |
| `/api/images/generate` | POST | DALL-E Bildgenerierung |
| `/api/tts` | POST | Text-to-Speech (OpenAI tts-1, voice=nova) |
| `/api/repo-map/generate` | POST | Repo-Map generieren + in DB/Disk speichern |
| `/api/search` | GET | Globale Suche (Artefakte, Chats, Projekte) |
| `/api/health` | GET | Health-Check-Endpoint |
| `/api/public/chat` | POST | Öffentlicher Chat (kein Auth) |
| `/api/s/[token]` | GET | Shared-Chat-Resolver |
| `/api/shared/[token]` | GET | Workspace-Share-Resolver |
| `/api/knowledge` | GET/POST | Wissensbasis-Einträge |
| `/api/messages/[id]/flag` | POST | Nachricht flaggen |
| `/api/onboarding/complete` | POST | Onboarding abschließen |
| `/api/usage/stats` | GET | Usage-Statistiken des Users |
| `/api/user/impersonation-sessions` | GET | Impersonation-Sessions des Users |
| `/api/skills` | GET/POST | Skills listen/anlegen |
| `/api/skills/[id]` | GET/PATCH/DELETE | Skill bearbeiten |
| `/api/prompt-templates` | GET/POST | Prompt-Templates |
| `/api/prompt-templates/[id]` | PATCH/DELETE | Template bearbeiten |
| `/api/transformations` | GET/POST | Transformationen |
| `/api/transformations/analyze` | POST | Transformation analysieren |
| `/api/transformations/[id]` | GET/PATCH/DELETE | Transformation bearbeiten |
| `/api/announcements` | GET/POST | Ankündigungen |
| `/api/announcements/[id]` | PATCH/DELETE | Ankündigung bearbeiten |
| `/api/debug/feeds` | GET | Debug-Endpoint für Feed-Status |

---

## 3. Komponenten (109 TSX-Dateien)

### /components/workspace — Chat & Canvas (41 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `_DESIGN_REFERENCE.tsx` | 1273 | Lebende Design-Referenz (nur Dev) — alle UI-Patterns |
| `ArtifactRenderer.tsx` | 494 | iFrame-Renderer für alle Artefakt-Typen (React/HTML/PPTX/ECharts) |
| `ChatArea.tsx` | 471 | Haupt-Chat-Bereich mit Streaming, Scroll, Parallel-Tabs |
| `WorkspaceBriefing.tsx` | 470 | Workspace-Briefing-Panel mit Steps |
| `ChatMessage.tsx` | 401 | Einzelne Chat-Nachricht (User/Assistant/Thinking) |
| `MemorySaveModal.tsx` | 374 | Modal zum Speichern von Gedächtnis-Einträgen |
| `TemplateDrawer.tsx` | 365 | Seitlicher Drawer für Prompt-Templates |
| `ChatHeaderStrip.tsx` | 345 | Chat-Header mit Tabs, Konversations-Name |
| `SessionPanel.tsx` | 335 | Rechtes Session-Panel mit Kontext-Einstellungen |
| `WorkspaceLayout.tsx` | 304 | Layout-Shell für Workspace-Ansicht |
| `PerspectivesBottomSheet.tsx` | 300 | Bottom-Sheet für KI-Perspektiven-Antworten |
| `ArtifactsDrawer.tsx` | 248 | Seitlicher Drawer mit Artefakt-Übersicht |
| `ChatInput.tsx` | 238 | Chat-Eingabefeld mit Voice, Attachments, Chips |
| `ActionLayer.tsx` | 183 | Overlay-Aktionen auf Nachrichten (Kürzen, Übersetzen, etc.) |
| `ChatRenderers.tsx` | 178 | Rendering-Logik für verschiedene Nachrichten-Typen |
| `modals/JungleModal.tsx` | 175 | Modal für Jungle-Order-Interaktionen |
| `PerspectivesStrip.tsx` | 175 | Avatar-Strip über ChatInput |
| `FocusedFlow.tsx` | 171 | Guided/Focused-Mode-UI |
| `BookmarksDrawer.tsx` | 161 | Lesezeichen-Drawer |
| `SearchDrawer.tsx` | 156 | Globale Such-UI (Seitlicher Drawer) |
| `ConvItem.tsx` | 156 | Konversations-Listenelement in der Sidebar |
| `PostToWorkspaceModal.tsx` | 154 | Modal: Chat-Ergebnis in Workspace posten |
| `modals/MergeModal.tsx` | 151 | Modal: Projekte zusammenführen |
| `PerspectivesBar.tsx` | 142 | Perspectives-Bar (kompakt) |
| `SourcesBar.tsx` | 139 | Quellen-Anzeige-Bar |
| `ContextMenu.tsx` | 120 | Rechtsklick-Kontextmenü |
| `GuidedStepCard.tsx` | 79 | Card für einzelnen Guided-Workflow-Schritt |
| `PanelSelect.tsx` | 78 | Custom Dropdown-Komponente für Panel |
| `WorkspaceActionCard.tsx` | 70 | Aktions-Card im Workspace |
| `SaveArtifactModal.tsx` | 69 | Modal: Artefakt speichern |
| `ArtifactsView.tsx` | 69 | Artefakt-Übersicht-Ansicht im Chat |
| `IntentionGate.tsx` | 62 | Guard: Intention setzen vor Chat-Nutzung |
| `Papierkorb.tsx` | 61 | Gelöschte Elemente-Ansicht |
| `BriefingSteps.tsx` | 59 | Schrittweise Briefing-Anzeige |
| `ParallelConfirmBubble.tsx` | 54 | Bestätigungs-Bubble für Parallel-Tabs |
| `GuidedModePicker.tsx` | 53 | Auswahl des Guided-Modus |
| `SplitArtifactPanel.tsx` | 47 | Split-View-Panel für Artefakte |
| `GuidedSummary.tsx` | 42 | Zusammenfassung am Ende eines Guided Flows |
| `ThinkingBlock.tsx` | 40 | "Thinking..."-Anzeige während Streaming |
| `ChatContextStrip.tsx` | 40 | Kontext-Strip unter dem Chat |
| `ContextBar.tsx` | 30 | Kontext-Anzeige-Bar |
| `QuickChips.tsx` | 29 | Schnell-Vorschläge als Chips in Toro-Bubble |
| `PerspectiveMessage.tsx` | 13 | Einzelne Perspektiven-Antwort |
| `ModelComparePopover.tsx` | 6 | Modell-Vergleich-Popover (Stub/minimal) |
| `CodeBlock.tsx` | 22 | Lazy-loaded Syntax-Highlighter-Wrapper |

### /components/ws — Canvas-Ansicht (8 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `ChatPanel.tsx` | 293 | Chat-Panel der Canvas-Ansicht |
| `Canvas.tsx` | 280 | Haupt-Canvas (Knotenansicht) |
| `WorkspaceForm.tsx` | 278 | Formular zum Erstellen/Bearbeiten von Workspaces |
| `DetailPanel.tsx` | 262 | Detail-Panel einer Canvas-Card |
| `CardForm.tsx` | 243 | Formular für Canvas-Cards |
| `SiloPanel.tsx` | 159 | Silo/Filter-Panel im Canvas |
| `WorkspaceCard.tsx` | 158 | Card-Darstellung im Canvas |
| `WorkspaceList.tsx` | 149 | Workspace-Liste in Canvas-Ansicht |
| `TopBar.tsx` | 132 | TopBar der Canvas-Ansicht |
| `ConnectionLines.tsx` | 100 | SVG-Verbindungslinien zwischen Canvas-Nodes |

### /components/layout — Layout-Shell (5 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `TopBar.tsx` | 325 | Haupt-TopBar mit Tabs, Benachrichtigungen, Account |
| `Sidebar.tsx` | 261 | Linke Navigations-Sidebar mit Feature-Gates |
| `MobileHeader.tsx` | 242 | Mobile Header-Komponente |
| `BottomNav.tsx` | 135 | Mobile Bottom-Navigation |
| `AppShell.tsx` | 77 | Äußere App-Shell (Sidebar + Content-Bereich) |

### /components/workspaces — Workspace-Liste (9 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `WorkspacesList.tsx` | 337 | Workspace-Übersicht mit Grid + Suche |
| `MembersList.tsx` | 240 | Mitglieder-Tab mit Einladung |
| `WorkspaceItemsList.tsx` | 181 | Items-Tab (Notes, Agents) |
| `AddItemModal.tsx` | 152 | Modal: Item zu Workspace hinzufügen |
| `WorkspaceCard.tsx` | 151 | Karten-Darstellung in der Listen-Ansicht |
| `CommentThread.tsx` | 147 | Kommentar-Thread-Ansicht |
| `WorkspacePicker.tsx` | 159 | Workspace-Picker (Modal) |
| `WorkspaceSettings.tsx` | 124 | Einstellungs-Tab eines Workspace |
| `ShareLinkPanel.tsx` | 109 | Share-Link-Verwaltungs-Panel |
| `CardTile.tsx` | 112 | Card-Kachel in Workspace-Übersicht |

### /components/cockpit — Dashboard (10 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `CockpitOnboarding.tsx` | 122 | Onboarding-Flow für Cockpit-Setup |
| `WidgetPickerModal.tsx` | 95 | Modal zur Widget-Auswahl |
| `CockpitGrid.tsx` | 94 | Widget-Grid-Layout |
| `widgets/CodeHealthWidget.tsx` | 127 | Widget: Letzter Audit-Score |
| `widgets/BudgetUsageWidget.tsx` | 71 | Widget: Budget-Verbrauch |
| `widgets/RecentActivityWidget.tsx` | 67 | Widget: Letzte Aktivitäten |
| `widgets/FeedHighlightsWidget.tsx` | 60 | Widget: Top Feed-Artikel |
| `widgets/ProjectStatusWidget.tsx` | 59 | Widget: Projekt-Status-Übersicht |
| `widgets/ArtifactOverviewWidget.tsx` | 57 | Widget: Artefakt-Statistiken |
| `widgets/TeamActivityWidget.tsx` | 52 | Widget: Team-Aktivität (Admin) |
| `widgets/ToroRecommendationWidget.tsx` | 49 | Widget: Regelbasierte Empfehlung |
| `widgets/QuickActionsWidget.tsx` | 44 | Widget: Schnell-Links |
| `widgets/Shared.tsx` | 51 | Geteilte Widget-Helfer |

### /components/admin — Admin-Panels (6 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `qa/QaShared.tsx` | 199 | Geteilte QA-Panel-Komponenten |
| `qa/PerformancePanel.tsx` | 165 | QA Performance-Metriken-Panel |
| `qa/CompliancePanel.tsx` | 144 | QA Compliance-Check-Panel |
| `qa/OverviewPanel.tsx` | 139 | QA Übersichts-Panel |
| `qa/RoutingPanel.tsx` | 134 | QA AI-Routing-Log-Panel |
| `qa/QualityPanel.tsx` | 133 | QA Code-Qualitäts-Panel |

### /components/home — Landing / Home (5 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `OrgOnboardingProgress.tsx` | 112 | Onboarding-Fortschritts-Anzeige |
| `ChatCTA.tsx` | 75 | Call-to-Action für neuen Chat |
| `OrgHealthSection.tsx` | 74 | Org-Gesundheits-Übersicht |
| `FeatureGrid.tsx` | 71 | Feature-Grid auf Landing-Page |
| `AnnouncementsFeed.tsx` | 60 | Ankündigungs-Feed |
| `RecentlyUsed.tsx` | 58 | Zuletzt genutzte Items |

### /components/artefakte (1 Datei)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `ArtifactPreviewModal.tsx` | 87 | Modal: Artefakt-Vorschau mit ArtifactRenderer |

### /components/ui (1 Datei)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `ToroBird.tsx` | 68 | Animierter Toro-Bird SVG |

### Globale Komponenten (11 Dateien)

| Komponente | Zeilen | Beschreibung |
|-----------|--------|-------------|
| `ToroChatWidget.tsx` | 242 | Floating Chat-Widget (öffentliche Seiten) |
| `AccountSwitcher.tsx` | 139 | Account/Org-Wechsler |
| `ImpersonationBanner.tsx` | 113 | Banner bei aktiver Superadmin-Impersonation |
| `NavBarNotifications.tsx` | 80 | Notifications-Bell in TopBar |
| `CookieBanner.tsx` | 83 | DSGVO-Cookie-Banner |
| `ParrotIcon.tsx` | 58 | Parrot-Icon (animiert) |
| `AppFooter.tsx` | 57 | App-Footer |
| `Parrot.tsx` | 27 | Parrot-Basis-Komponente |
| `ServiceWorkerRegistrar.tsx` | 18 | PWA Service-Worker-Registrierung |
| `AxeHelper.tsx` | 18 | a11y-Dev-Helper (Dev-only) |
| `MessageActions.tsx` | 95 | Aktionen auf Nachrichten (Copy, TTS, Bookmark) |

---

## Zusammenfassung

| Bereich | Anzahl |
|---------|--------|
| DB-Tabellen | 76 |
| API-Routes (route.ts) | 192 |
| Komponenten (TSX) | 109 |
| Migrations-Dateien | 121 |
| Gesamte Komponenten-Zeilen | 16.903 |
