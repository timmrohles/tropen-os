# Inventur-Code — Tag-1-Artefakt
> Datum: 2026-04-27 | Basis: ADR-020 Sechs-Schichten-Wissens-Architektur
> Zielgruppe: Solo-Entrepreneurs, DACH-Region, Vibe-Coding-Stack (Lovable/Bolt/Cursor/Claude Code)

**Empfehlungen:**
- `BEHALTEN` — passt direkt in die neue Architektur, kein Umbau nötig
- `UMWIDMEN` — Substanz ist wertvoll, Framing/Name/Scope muss sich ändern
- `WEGFALL` — wurde für alten Use Case gebaut, hat keine Rolle im neuen Produkt
- `VERTIEFUNG NÖTIG` — Entscheidung hängt von offenen Produkt-Fragen ab

---

## 1. Datenbank-Tabellen (76)

### Kern / Auth (7)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `organizations` | BEHALTEN | Multi-Tenancy bleibt; auch Solo-Entrepreneur hat eine Org-Einheit |
| `users` | BEHALTEN | Fundamentale Identität; alternativlos |
| `organization_settings` | UMWIDMEN | Viele Felder verlieren Relevanz (dept_features, workflow_provider); auf Solo-Entrepreneur-Config reduzieren |
| `user_preferences` | BEHALTEN | Personalisierung (Sprache, TTS, Beta) passt direkt |
| `impersonation_sessions` | BEHALTEN | Sicherheits-Audit-Trail; auch für kleines Produkt notwendig |
| `usage_logs` | BEHALTEN | Abrechnungs-Basis; kein Umbau nötig |
| `announcements` | WEGFALL | B2B-Feature (Admin → Mitarbeiter); Solo-Entrepreneur hat keinen separaten Admin |

### Chat (8)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `conversations` | BEHALTEN | Kern der Chat-Schicht; schema ist sauber |
| `messages` | BEHALTEN | Kern der Chat-Schicht; alternativlos |
| `focus_log` | WEGFALL | Intention-Tracking war für komplexe B2B-Multi-Projekt-Flows gebaut; für Solo overkill |
| `workspace_messages` | WEGFALL | DUP zu `messages`; Briefing-Kontext gehört in `project_memory` oder `messages` |
| `workspace_comments` | UMWIDMEN | Diskussion auf Items ist sinnvoll, aber als `conversations`-Eintrag mit `context_type='item'` statt eigener Tabelle |
| `bookmarks` | UMWIDMEN | Richtige Tabelle für Merker-Schicht, aber Session-Reaktivierung (ADR-020 Kernfunktion) fehlt noch |
| `perspective_avatars` | VERTIEFUNG NÖTIG | Parallele KI-Stimmen könnten in ADR-021 Veredler-Kontext passen; für Solo-Entrepreneur-MVP aber Komplexitäts-Risiko |
| `perspective_user_settings` | VERTIEFUNG NÖTIG | Folgt Entscheidung zu perspective_avatars |

### Projektwissen-Cluster (10) — kritischster Befund

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `project_memory` | BEHALTEN | Kanonischer PW-Speicher; APPEND ONLY-Garantie; wird zur einzigen PW-Quelle der Wahrheit |
| `memory_extraction_log` | BEHALTEN | Beweis-Trail für automatische Toro-Extraktion; ADR-020 Konsequenz-Mechanismus braucht das |
| `project_documents` | BEHALTEN | Dokument-Upload als Wissensquelle; saubere externe Input-Tür |
| `cards` | UMWIDMEN | PW-Fragmente in anderer Form; Schema nach `project_memory`-Migration konsolidieren, danach deprecated |
| `card_history` | UMWIDMEN | Versions-Trail bleibt wertvoll; zu `project_memory_history` umbenennen wenn cards migriert |
| `project_knowledge` | WEGFALL | DUP zu `project_memory`; Inhalt migrieren, Tabelle löschen |
| `knowledge_entries` | WEGFALL | DUP (Workspace-Level PW); `project_memory` mit scope-Feld übernimmt das |
| `org_knowledge` | WEGFALL | DUP (Org-Level); durch `project_memory` mit `scope='org'` ersetzbar |
| `dept_knowledge` | WEGFALL | Abteilungs-Konzept fällt für Solo-Entrepreneur weg |
| `project_participants` | WEGFALL | Altes Schema; DUP zu `workspace_members` ohne Nachfolger |

### Projektwissen-Container (3)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `projects` | BEHALTEN | Projekt-Organismus-Wurzel; zentrales Container-Konzept bleibt |
| `workspaces` | UMWIDMEN | Dept-Semantik muss weg; wird zum Projektboard-Container für Solo-Projekte (ggf. umbenennen) |
| `workspace_members` | VERTIEFUNG NÖTIG | Solo-Entrepreneur arbeitet allein; Team-Features sind Phase 2, nicht MVP |

### Inbox / Feeds (12)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `feed_sources` | UMWIDMEN | Solide Inbox-Quellen-Basis; von "Feed" zu "Inbox-Quelle" umrahmen, UX-Paradigma wechseln |
| `feed_items` | UMWIDMEN | Kern-Inbox-Daten; Schema passt, Feature-Name ändert sich zu Inbox |
| `feed_distributions` | UMWIDMEN | Schichten-Routing (Inbox → PW/PB) ist das richtige Konzept; als `layer_routing` umbenennen |
| `feed_notifications` | BEHALTEN | Inbox-Benachrichtigungen; passt direkt |
| `feed_topics` | BEHALTEN | Themen-Clustering für Inbox; bleibt nützlich |
| `feed_processing_log` | BEHALTEN | Observability; APPEND ONLY — nicht anfassen |
| `feed_runs` | BEHALTEN | Run-Protokoll; APPEND ONLY — nicht anfassen |
| `feed_topic_sources` | BEHALTEN | Quellen↔Topics-Mapping; kein Umbau nötig |
| `feed_schemas` | BEHALTEN | Schema-Definitionen für strukturierte Inbox-Quellen |
| `feed_source_schemas` | BEHALTEN | Quellen↔Schema-Mapping |
| `feed_data_sources` | BEHALTEN | Daten-Tab-Quellen; nützlich für strukturierte Inbox |
| `feed_data_records` | BEHALTEN | Eingehende Datensätze; APPEND ONLY — nicht anfassen |

### Artefakte (5)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `artifacts` | BEHALTEN | Kern der Artefakte-Schicht; alle generierten Zustände laufen hier rein |
| `workspace_assets` | BEHALTEN | Datei-Anhänge als Artefakte; saubere Funktion |
| `workspace_exports` | BEHALTEN | Export-Zustände; passt als Artefakte-Trail |
| `templates` | VERTIEFUNG NÖTIG | Grenze zwischen Artefakt (abgeleitete Vorlage) und Chat-Aid unklar; Entscheidung vor Implementierung |
| `prompt_templates` | UMWIDMEN | Wenn Merker-Schicht ausgebaut wird: user-kuratierte Prompts sind Merker, keine eigene Tabelle |

### Projektboard (3)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `dashboard_widgets` | UMWIDMEN | Cockpit → Projektboard; Widget-Konzept bleibt, Framing und Widgets-Set überarbeiten |
| `workspace_items` | UMWIDMEN | Inhaltselemente im Board brauchen klarere Typisierung nach den 6 Schichten |
| `workspace_exports` | BEHALTEN | (bereits oben) |

### Audit (12)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `audit_runs` | BEHALTEN | Kern-Produkt; Audit ist das primäre Artefakt |
| `audit_category_scores` | BEHALTEN | Score-Drill-Down; Teil des Audit-Artefakts |
| `audit_findings` | BEHALTEN | Findings = abgeleiteter Projekt-Zustand; Kern |
| `audit_fixes` | BEHALTEN | Fix-Vorschläge als Artefakte; Kern |
| `audit_tasks` | BEHALTEN | Projektboard-Items aus Findings; klare Funktion |
| `scan_projects` | BEHALTEN | Externer Projekt-Scan bleibt Kern-Feature |
| `audit_review_runs` | VERTIEFUNG NÖTIG | Multi-Modell-Review ist teuer; zahlt Solo-Entrepreneur dafür? Kostenmodell klären |
| `qa_metrics` | UMWIDMEN | War intern; wird zu `audit_metrics` für externe Projekte; umbenennen |
| `qa_lighthouse_runs` | UMWIDMEN | In `audit_runs` integrieren statt eigener Tabelle; Lighthouse ist ein Audit-Datenpunkt |
| `qa_compliance_checks` | UMWIDMEN | In `audit_findings` mit `source='compliance'` überführen statt eigener Tabelle |
| `qa_test_runs` | WEGFALL | Internes Test-Framework; für externes Produkt nicht relevant |
| `qa_routing_log` | WEGFALL | Internes AI-Routing-Protokoll; Observability, kein User-Value |

### Library / Capabilities (11) — größter Wegfall-Block

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `capabilities` | WEGFALL | Komplexes B2B-Abstraktionssystem ohne Entsprechung in ADR-020; für Solo-Entrepreneur nicht erklärbar |
| `outcomes` | WEGFALL | Folgt Wegfall von capabilities |
| `capability_outcomes` | WEGFALL | Folgt Wegfall |
| `capability_org_settings` | WEGFALL | Folgt Wegfall |
| `user_capability_settings` | WEGFALL | Folgt Wegfall |
| `org_library_settings` | WEGFALL | Library fällt weg |
| `user_library_settings` | WEGFALL | Library fällt weg |
| `agent_skills` | WEGFALL | Skills-System fällt mit Library weg |
| `library_versions` | WEGFALL | Versions-Trail für Library; fällt mit Library weg |
| `roles` | VERTIEFUNG NÖTIG | Könnten als "Projekt-Archetypen" (z.B. SaaS-Startup, E-Commerce) überleben; Entscheidung offen |
| `skills` | VERTIEFUNG NÖTIG | Könnten als Toro-Fähigkeiten-Beschreibung überleben; Entscheidung offen |

### Agenten (6)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `guided_workflows` | BEHALTEN | Geführte Konversation = Kern der Chat-Schicht; niedrige Reibung für Einsteiger |
| `guided_workflow_options` | BEHALTEN | Schritte im Guided Chat; gehört zu guided_workflows |
| `guided_workflow_settings` | BEHALTEN | Aktivierung von Guided Workflows; kein Umbau nötig |
| `agents` | VERTIEFUNG NÖTIG | Toro als Meta-Agent ist das Konzept; custom Agenten für Solo? Vielleicht als "Toro-Automatisierungen" vereinfacht |
| `agent_runs` | VERTIEFUNG NÖTIG | Folgt Entscheidung zu agents |
| `agent_assignments` | WEGFALL | Zuweisung zu Workspaces ist zu komplex für Solo-Entrepreneur-MVP |

### Packages / Superadmin (3)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `packages` | WEGFALL | B2B-Feature-Packaging ohne Rolle im neuen Produkt-Modell |
| `org_packages` | WEGFALL | Folgt Wegfall von packages |
| `package_agents` | WEGFALL | Bereits als veraltet markiert; abgelöst durch roles |

### AI-Infrastruktur (3)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `model_catalog` | BEHALTEN | AI-Governance und EU-Hosting-Flags bleiben relevanter Differenziator |
| `org_mcp_policies` | VERTIEFUNG NÖTIG | MCP-Integration für Solo-Entrepreneur nützlich (Lovable/Cursor-Brücke), aber Scope unklar |
| `user_mcp_connections` | VERTIEFUNG NÖTIG | Folgt Entscheidung zu MCP |

### Beta (2)

| Tabelle | Empfehlung | Begründung |
|---------|-----------|-----------|
| `beta_waitlist` | BEHALTEN | Aktives Beta-Programm läuft |
| `beta_feedback` | BEHALTEN | Aktives Beta-Programm läuft |

---

### Tabellen-Scorecard

| Empfehlung | Anzahl | % |
|-----------|--------|---|
| BEHALTEN | 28 | 37% |
| UMWIDMEN | 16 | 21% |
| WEGFALL | 22 | 29% |
| VERTIEFUNG NÖTIG | 10 | 13% |

**Größte Wegfall-Cluster:** Library/Capabilities (8 Tabellen), Dept-Knowledge-DUPs (4 Tabellen), Packages (3 Tabellen), internes QA (2 Tabellen)

---

## 2. API-Routes (192) — nach Domain gruppiert

### /api/chat + /api/conversations (8 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/chat/stream` | BEHALTEN | Kern-Chat; alternativlos |
| `/api/chat/generate-chips` | BEHALTEN | Niedrigschwelliger Chat-Einstieg; passt zu Solo-Entrepreneur-UX |
| `/api/chat/project-intro` | BEHALTEN | Geführter Kontext-Einstieg; ADR-020 Eingangstür |
| `/api/conversations/*` | BEHALTEN | Session-Management; Chat-Schicht Basis |
| `/api/conversations/[id]/extract-memory` | BEHALTEN | Toros automatische PW-Extraktion; ADR-020 Kernfunktion |
| `/api/conversations/[id]/set-intention` | UMWIDMEN | Intention-Konzept vereinfachen; "focused/guided" als Gesprächs-Modi reicht |
| `/api/conversations/[id]/share` | BEHALTEN | Teilen von Chats; bleibt nützlich |
| `/api/messages/[id]/flag` | UMWIDMEN | Zu Merker-Schicht ausbauen: "Flag" → "Als Merker speichern" |

### /api/perspectives (6 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/perspectives/*` | VERTIEFUNG NÖTIG | Hängt an der Entscheidung zu perspective_avatars; Technologie ist gebaut, Produkt-Fit prüfen |

### /api/guided (7 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/guided/detect` | BEHALTEN | Workflow-Erkennung im Chat; ADR-020 niedrige Reibung |
| `/api/guided/resolve` | BEHALTEN | Workflow-Schritte auflösen; Chat-Schicht |
| `/api/guided/workflows` | BEHALTEN | Workflow-Definitionen; kein Umbau nötig |
| `/api/guided/settings` | BEHALTEN | Aktivierung; kein Umbau nötig |

### /api/feeds (15 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/feeds/[id]/run` | UMWIDMEN | Umbenennen zu `/api/inbox/sources/[id]/run`; selbe Logik, neues Paradigma |
| `/api/feeds/[id]/runs` | UMWIDMEN | Folgt Umbenennung |
| `/api/feeds/[id]/pause` | UMWIDMEN | Folgt Umbenennung |
| `/api/feeds/[id]/resume` | UMWIDMEN | Folgt Umbenennung |
| `/api/feeds/[id]/distributions` | UMWIDMEN | Zu `/api/inbox/routing` — beschreibt besser was es tut |
| `/api/feeds/data-sources` | UMWIDMEN | Folgt Inbox-Umbenennung |
| `/api/feeds/data-sources/[id]/records` | UMWIDMEN | Folgt |
| `/api/feeds/data-sources/[id]/fetch` | UMWIDMEN | Folgt |
| `/api/feeds/notifications` | BEHALTEN | Inbox-Benachrichtigungen; kein Umbau nötig |
| `/api/cron/feed-fetch` | BEHALTEN | Cron-Logik bleibt; nur Route-Name ändern wenn feeds → inbox |
| `/api/cron/feed-process` | BEHALTEN | Verarbeitungs-Cron; bleibt |
| `/api/cron/feed-digest` | BEHALTEN | Tagesübersicht; nützlich für Solo-Entrepreneur |
| `/api/cron/feed-cleanup` | BEHALTEN | Hygiene; bleibt |
| `/api/cron/sync-feeds` | BEHALTEN | Sync; bleibt |
| `/api/debug/feeds` | WEGFALL | Debug-Endpoint; in Produktion nicht nötig |

### /api/projects (11 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/projects` | BEHALTEN | Projekt-CRUD; Kern |
| `/api/projects/[id]` | BEHALTEN | Projekt-Detail; Kern |
| `/api/projects/[id]/memory` | BEHALTEN | Kanonischer PW-Zugriff; wird zur primären PW-Route |
| `/api/projects/[id]/memory/summary` | BEHALTEN | PW-Zusammenfassung für Chat-Kontext; ADR-020 Schicht-Sichtbarkeit |
| `/api/projects/[id]/memory/[memId]` | BEHALTEN | Granularer PW-Zugriff; bleibt |
| `/api/projects/[id]/documents` | BEHALTEN | Dokument-Upload als externe Eingangstür |
| `/api/projects/[id]/documents/[docId]` | BEHALTEN | Dokument-Detail; kein Umbau |
| `/api/projects/[id]/chats` | BEHALTEN | Chats eines Projekts; Navigation |
| `/api/projects/[id]/merge` | VERTIEFUNG NÖTIG | Projekt-Merge für Solo-Entrepreneur selten gebraucht; Priorität prüfen |
| `/api/projects/scan` | BEHALTEN | Kern-Feature: externer Projekt-Scan |
| `/api/knowledge` | WEGFALL | DUP zu `/api/projects/[id]/memory`; konsolidieren |

### /api/bookmarks (1 Route)

| Route | Empfehlung | Begründung |
|-------|-----------|-----------|
| `/api/bookmarks` | UMWIDMEN | Zu `/api/merker` ausbauen; Session-Reaktivierung hinzufügen (ADR-020 Kernfunktion fehlt) |

### /api/artifacts (5 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/artifacts` | BEHALTEN | Artefakte-Schicht Kern |
| `/api/artifacts/[id]` | BEHALTEN | CRUD; kein Umbau |
| `/api/artifacts/save` | BEHALTEN | Chat → Artefakt-Flow; ADR-020 Abstrom |
| `/api/artifacts/transform` | BEHALTEN | React/TS-Transformation; Kern für Code-Artefakte |
| `/api/artifacts/export-pptx` | BEHALTEN | PPTX-Export; Artefakte-Schicht |

### /api/cockpit (12 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/cockpit/feed-highlights` | UMWIDMEN | Zu `/api/projektboard/inbox-highlights`; gleiche Daten, neues Framing |
| `/api/cockpit/recommendation` | BEHALTEN | Regelbasierte Empfehlung; Projektboard-Sicht |
| `/api/cockpit/recent-activity` | BEHALTEN | Aktivitäts-Aggregation; nützlich |
| `/api/cockpit/projects` | BEHALTEN | Projekt-Übersicht im Board; kein Umbau |
| `/api/cockpit/artifact-stats` | BEHALTEN | Artefakt-Zähler im Board |
| `/api/cockpit/team-activity` | VERTIEFUNG NÖTIG | Team-Feature; Priorität für Solo-MVP unklar |
| `/api/cockpit/budget` | BEHALTEN | Budget-Sicht bleibt; Solo-Entrepreneur zahlt direkt |
| `/api/cockpit/code-health` | BEHALTEN | Audit-Score im Board; Kern |
| `/api/cockpit/setup` | BEHALTEN | Onboarding; wichtig für ersten Eindruck |
| `/api/cockpit/widgets` | UMWIDMEN | Widget-Konzept bleibt, aber Set überarbeiten nach ADR-020-Schichten |
| `/api/cockpit/widgets/[id]` | UMWIDMEN | Folgt Widget-Umbau |
| `/api/home/org-stats` | UMWIDMEN | Umbenennen; org-stats → projekt-stats für Solo-Kontext |

### /api/workspaces (24 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/workspaces` | UMWIDMEN | Container-Konzept bleibt; Name und Semantik prüfen nach Workspace-Umwidmung |
| `/api/workspaces/[id]` | UMWIDMEN | Folgt |
| `/api/workspaces/[id]/cards` | WEGFALL | DUP zu `/api/projects/[id]/memory`; nach PW-Konsolidierung obsolet |
| `/api/workspaces/[id]/cards/[cid]` | WEGFALL | Folgt |
| `/api/workspaces/[id]/items` | VERTIEFUNG NÖTIG | Items-Konzept im Board unklar; nach ADR-020-Schichten-Klarheit entscheiden |
| `/api/workspaces/[id]/members` | VERTIEFUNG NÖTIG | Team-Features; Priorität für Solo-MVP prüfen |
| `/api/workspaces/[id]/members/suggestions` | VERTIEFUNG NÖTIG | Folgt |
| `/api/workspaces/[id]/members/[memberId]` | VERTIEFUNG NÖTIG | Folgt |
| `/api/workspaces/[id]/comments` | UMWIDMEN | In `conversations` mit context_type integrieren statt eigener Route |
| `/api/workspaces/[id]/comments/[commentId]` | UMWIDMEN | Folgt |
| `/api/workspaces/[id]/assets` | BEHALTEN | Datei-Anhänge; Artefakte-Schicht |
| `/api/workspaces/[id]/assets/[aid]` | BEHALTEN | Folgt |
| `/api/workspaces/[id]/share` | BEHALTEN | Teilen; wichtig für Solo-Entrepreneur (externe Zusammenarbeit) |
| `/api/workspaces/[id]/copy` | VERTIEFUNG NÖTIG | Workspace duplizieren; seltener Use Case für Solo, Priorität prüfen |
| `/api/workspaces/[id]/export` | BEHALTEN | Daten-Souveränität; kulturelles Bedürfnis der Zielgruppe |
| `/api/workspaces/[id]/exports` | BEHALTEN | Export-Liste; kein Umbau |
| `/api/workspaces/[id]/chat` | BEHALTEN | Workspace-Chat bleibt |
| `/api/workspaces/[id]/connections` | VERTIEFUNG NÖTIG | Externe Verbindungen; MCP-Entscheidung abwarten |
| `/api/workspaces/[id]/connections/[connid]` | VERTIEFUNG NÖTIG | Folgt |
| `/api/workspaces/[id]/briefing` | BEHALTEN | Briefing als Artefakt; nützlich |
| `/api/workspaces/briefing` | BEHALTEN | Org-Briefing; kein Umbau nötig |
| `/api/workspaces/[id]/picker` | BEHALTEN | Picker-Komponente; UX-Hilfsmittel |
| `/api/workspaces/[id]/post-chat` | BEHALTEN | Chat → Workspace-PW; ADR-020 Abstrom |
| `/api/shared/[token]` | BEHALTEN | Geteilter Workspace; wichtig für externe Kollaboration |

### /api/audit (16 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/audit/run` | BEHALTEN | Kern-Produkt-Aktion |
| `/api/audit/trigger` | BEHALTEN | Trigger + Persistierung; kein Umbau |
| `/api/audit/runs` | BEHALTEN | Run-Historie; kein Umbau |
| `/api/audit/runs/[id]` | BEHALTEN | Run-Detail; kein Umbau |
| `/api/audit/findings/[id]` | BEHALTEN | Finding-Status; kein Umbau |
| `/api/audit/fix/generate` | BEHALTEN | Fix-Prompt; Kern |
| `/api/audit/fix/batch-generate` | BEHALTEN | Batch; nützlich |
| `/api/audit/fix/consensus` | VERTIEFUNG NÖTIG | Multi-Modell-Consensus teuer; Kostenmodell für Solo-Entrepreneur klären |
| `/api/audit/fix/apply` | BEHALTEN | Fix-Trail; kein Umbau |
| `/api/audit/fix/reject` | BEHALTEN | Fix-Trail; kein Umbau |
| `/api/audit/review` | VERTIEFUNG NÖTIG | Multi-Modell-Review; Kostenmodell prüfen |
| `/api/audit/self-assessment` | BEHALTEN | Self-Assessment; niedrige Reibung, hoher Wert |
| `/api/audit/tasks` | BEHALTEN | Tasks im Projektboard; kein Umbau |
| `/api/audit/tasks/[id]` | BEHALTEN | Task-Status; kein Umbau |
| `/api/audit/export-rules` | BEHALTEN | Regelwerk-Export; Daten-Souveränität |
| `/api/scan-projects/[id]` | BEHALTEN | Externer Scan; Kern |

### /api/library (19 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/library/capabilities` | WEGFALL | Library/Capabilities fällt weg |
| `/api/library/capabilities/[id]/outcomes` | WEGFALL | Folgt |
| `/api/library/outcomes` | WEGFALL | Folgt |
| `/api/library/roles` | VERTIEFUNG NÖTIG | Rollen könnten als Projekt-Archetypen überleben |
| `/api/library/roles/[id]` | VERTIEFUNG NÖTIG | Folgt |
| `/api/library/roles/[id]/adopt` | VERTIEFUNG NÖTIG | Folgt |
| `/api/library/roles/[id]/import` | VERTIEFUNG NÖTIG | Folgt |
| `/api/library/roles/[id]/publish` | WEGFALL | Community-Publishing für Solo-MVP nicht relevant |
| `/api/library/roles/[id]/unpublish` | WEGFALL | Folgt |
| `/api/library/skills` | VERTIEFUNG NÖTIG | Folgt Skills-Entscheidung |
| `/api/library/skills/[id]` | VERTIEFUNG NÖTIG | Folgt |
| `/api/library/skills/[id]/adopt` | VERTIEFUNG NÖTIG | Folgt |
| `/api/library/skills/[id]/import` | VERTIEFUNG NÖTIG | Folgt |
| `/api/library/skills/[id]/publish` | WEGFALL | Community-Publishing für MVP nicht relevant |
| `/api/library/skills/[id]/unpublish` | WEGFALL | Folgt |
| `/api/library/org-settings` | WEGFALL | Library fällt weg |
| `/api/library/user-settings` | WEGFALL | Library fällt weg |
| `/api/library/resolve` | VERTIEFUNG NÖTIG | Wenn Roles/Skills überleben, bleibt Resolve; sonst weg |
| `/api/library/versions/*` | WEGFALL | Library fällt weg |

### /api/agents + /api/cron/agents (9 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/agents` | VERTIEFUNG NÖTIG | Custom Agenten für Solo-MVP: vereinfachen zu "Toro-Automatisierungen" oder ganz weglassen |
| `/api/agents/[id]` | VERTIEFUNG NÖTIG | Folgt |
| `/api/agents/[id]/copy` | VERTIEFUNG NÖTIG | Folgt |
| `/api/agents/[id]/run` | VERTIEFUNG NÖTIG | Folgt |
| `/api/agents/[id]/runs` | VERTIEFUNG NÖTIG | Folgt |
| `/api/agents/runs/[run_id]` | VERTIEFUNG NÖTIG | Folgt |
| `/api/agents/webhook/[agent_id]` | WEGFALL | Webhook für externe Trigger; Solo-MVP zu komplex |
| `/api/packages/agents` | WEGFALL | Package-Agenten; Packages fallen weg |
| `/api/cron/agents` | VERTIEFUNG NÖTIG | Geplante Automatisierungen; sinnvoll wenn agents vereinfacht überleben |

### /api/admin + /api/superadmin (22 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/admin/branding` | UMWIDMEN | Für Solo-Entrepreneur weniger relevant; vereinfachen auf Basis-Einstellungen |
| `/api/admin/budget` | BEHALTEN | Budget-Kontrolle bleibt für jeden User |
| `/api/admin/logs` | VERTIEFUNG NÖTIG | Admin-Logs; Relevanz für Solo-Entrepreneur prüfen |
| `/api/admin/models` | BEHALTEN | Model-Governance bleibt |
| `/api/admin/models/[id]` | BEHALTEN | Modell-Detail |
| `/api/admin/qa/*` | WEGFALL | Internes QA-Tool; kein Platz im neuen Produkt |
| `/api/admin/users` | VERTIEFUNG NÖTIG | User-Verwaltung; bei Solo-Entrepreneur vereinfacht |
| `/api/superadmin/*` | BEHALTEN | Superadmin-Infrastruktur; kein Produkt-Change nötig |

### /api/settings (4 Routes)

| Route-Gruppe | Empfehlung | Begründung |
|-------------|-----------|-----------|
| `/api/settings/profile` | BEHALTEN | User-Profil; immer nötig |
| `/api/settings/org` | BEHALTEN | Org-Einstellungen; kein Umbau |
| `/api/settings/ki-context` | BEHALTEN | KI-Kontext als Projektwissen-ähnliche Instruktion; ADR-020 Eingangstür |
| `/api/settings/connections` | VERTIEFUNG NÖTIG | MCP-Verbindungen; hängt an MCP-Entscheidung |

### Sonstige Routes (10)

| Route | Empfehlung | Begründung |
|-------|-----------|-----------|
| `/api/images/generate` | BEHALTEN | Bild-Generierung als Artefakt; nützlich |
| `/api/tts` | BEHALTEN | TTS; Komfort-Feature, bleibt |
| `/api/search` | BEHALTEN | Schichten-übergreifende Suche; ADR-020 Suche als Abstrom-Kanal |
| `/api/health` | BEHALTEN | Infrastruktur; immer nötig |
| `/api/public/chat` | VERTIEFUNG NÖTIG | Öffentlicher Chat; Use Case für neues Produkt prüfen |
| `/api/s/[token]` | BEHALTEN | Shared-Chat; Teilen bleibt wichtig |
| `/api/repo-map/generate` | BEHALTEN | Repo-Map als Artefakt; Kern für Vibe-Coder-Zielgruppe |
| `/api/prompt-templates/*` | UMWIDMEN | In Merker-Schicht integrieren statt eigener Route |
| `/api/usage/stats` | BEHALTEN | User-facing Statistiken; kein Umbau |
| `/api/user/impersonation-sessions` | BEHALTEN | Sicherheit; kein Umbau |
| `/api/announcements/*` | WEGFALL | B2B-Comms-Feature; fällt mit Ankündigungen-Tabelle weg |
| `/api/capabilities/*` | WEGFALL | Capabilities fallen weg |
| `/api/skills/*` | VERTIEFUNG NÖTIG | Folgt Skills-Entscheidung |
| `/api/transformations/*` | WEGFALL | Transformations-Abstraktion ohne Schichten-Fit; als interner Prozess behandeln |

---

### Routes-Scorecard

| Empfehlung | Anzahl (ca.) | % |
|-----------|-------------|---|
| BEHALTEN | 78 | 41% |
| UMWIDMEN | 30 | 16% |
| WEGFALL | 36 | 19% |
| VERTIEFUNG NÖTIG | 48 | 25% |

---

## 3. Komponenten (109 TSX)

### /components/workspace — Chat & Canvas (44 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `_DESIGN_REFERENCE.tsx` | BEHALTEN | Dev-Referenz; nicht anfassen |
| `ArtifactRenderer.tsx` | BEHALTEN | Kern-Artefakt-Renderer; alle Typen abgedeckt |
| `ChatArea.tsx` | BEHALTEN | Haupt-Chat-Bereich; Kern |
| `WorkspaceBriefing.tsx` | UMWIDMEN | Briefing als Artefakt gut; als Projektboard-Einstiegs-View positionieren |
| `ChatMessage.tsx` | BEHALTEN | Nachricht; kein Umbau |
| `MemorySaveModal.tsx` | UMWIDMEN | Umbenennen: "WissensExtraktion" — macht deutlich dass PW entsteht |
| `TemplateDrawer.tsx` | VERTIEFUNG NÖTIG | Template-Konzept unklar in neuer Architektur; warten bis Template-Entscheidung |
| `ChatHeaderStrip.tsx` | BEHALTEN | Chat-Navigation; kein Umbau |
| `SessionPanel.tsx` | UMWIDMEN | PW-Anzeige für aktive Session ist richtig; als "Projektwissen-Kontext" umbenennen |
| `WorkspaceLayout.tsx` | BEHALTEN | Layout-Shell; kein Umbau |
| `PerspectivesBottomSheet.tsx` | VERTIEFUNG NÖTIG | Folgt Perspectives-Entscheidung |
| `ArtifactsDrawer.tsx` | BEHALTEN | Artefakte-Übersicht; kein Umbau |
| `ChatInput.tsx` | BEHALTEN | Eingabe; Kern |
| `ActionLayer.tsx` | BEHALTEN | Nachrichts-Aktionen; kein Umbau |
| `ChatRenderers.tsx` | BEHALTEN | Rendering-Logik; kein Umbau |
| `modals/JungleModal.tsx` | VERTIEFUNG NÖTIG | Jungle-Order-Konzept im neuen Produkt prüfen |
| `PerspectivesStrip.tsx` | VERTIEFUNG NÖTIG | Folgt Perspectives-Entscheidung |
| `FocusedFlow.tsx` | BEHALTEN | Guided/Focused-Chat; ADR-020 niedrige Reibung |
| `BookmarksDrawer.tsx` | UMWIDMEN | Zu "Merker-Drawer" ausbauen; Session-Reaktivierung hinzufügen |
| `SearchDrawer.tsx` | BEHALTEN | Schichten-übergreifende Suche; kein Umbau |
| `ConvItem.tsx` | BEHALTEN | Konversations-Element; kein Umbau |
| `PostToWorkspaceModal.tsx` | UMWIDMEN | "In Projektwissen speichern" statt Workspace-Framing |
| `modals/MergeModal.tsx` | VERTIEFUNG NÖTIG | Projekt-Merge seltener Solo-Use-Case; Priorität prüfen |
| `PerspectivesBar.tsx` | VERTIEFUNG NÖTIG | Folgt Perspectives-Entscheidung |
| `SourcesBar.tsx` | BEHALTEN | Quellen-Kontext im Chat; ADR-020 Sichtbarkeit |
| `ContextMenu.tsx` | BEHALTEN | Kontext-Aktionen; kein Umbau |
| `GuidedStepCard.tsx` | BEHALTEN | Guided Chat-Schritt; Kern |
| `PanelSelect.tsx` | BEHALTEN | UI-Utility; kein Umbau |
| `WorkspaceActionCard.tsx` | UMWIDMEN | Aktions-Karte im Projektboard; umbenennen |
| `SaveArtifactModal.tsx` | BEHALTEN | Artefakt speichern; kein Umbau |
| `ArtifactsView.tsx` | BEHALTEN | Artefakte im Chat; kein Umbau |
| `IntentionGate.tsx` | WEGFALL | Intention-Gate war über-engineered; Guided Workflows ersetzen das einfacher |
| `Papierkorb.tsx` | WEGFALL | Papierkorb-Ansicht ohne klare Schichten-Rolle; soft-delete reicht in DB |
| `BriefingSteps.tsx` | BEHALTEN | Briefing-Visualisierung; kein Umbau |
| `ParallelConfirmBubble.tsx` | VERTIEFUNG NÖTIG | Parallel-Tabs-Feature Priorität für Solo prüfen |
| `GuidedModePicker.tsx` | BEHALTEN | Guided-Modus-Auswahl; niedrige Reibung |
| `SplitArtifactPanel.tsx` | BEHALTEN | Split-View; nützlich für Code-Artefakte |
| `GuidedSummary.tsx` | BEHALTEN | Flow-Zusammenfassung; kein Umbau |
| `ThinkingBlock.tsx` | BEHALTEN | Streaming-Indikator; UX-Qualität |
| `ChatContextStrip.tsx` | BEHALTEN | Kontext-Strip; kein Umbau |
| `ContextBar.tsx` | BEHALTEN | Kontext-Bar; kein Umbau |
| `QuickChips.tsx` | BEHALTEN | Vorschlags-Chips; niedrige Reibung |
| `CodeBlock.tsx` | BEHALTEN | Syntax-Highlighting; kein Umbau |
| `PerspectiveMessage.tsx` | VERTIEFUNG NÖTIG | Folgt Perspectives-Entscheidung |
| `ModelComparePopover.tsx` | VERTIEFUNG NÖTIG | Modell-Vergleich; Priorität für Solo-MVP prüfen |

### /components/ws — Canvas-Ansicht (10 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `ChatPanel.tsx` | BEHALTEN | Chat im Canvas; kein Umbau |
| `Canvas.tsx` | VERTIEFUNG NÖTIG | Knoten-Canvas als Projektboard-Sicht; ob das die richtige Projektboard-UI für Solo ist, prüfen |
| `WorkspaceForm.tsx` | UMWIDMEN | Workspace anlegen → Projekt-Onboarding anpassen für Solo-Kontext |
| `DetailPanel.tsx` | UMWIDMEN | Card-Detail → Projektwissen-Detail; umbenennen |
| `CardForm.tsx` | UMWIDMEN | Card → Projektwissen-Eintrag; nach PW-Konsolidierung überarbeiten |
| `SiloPanel.tsx` | VERTIEFUNG NÖTIG | Filter-Sicht im Canvas; Relevanz für neue Projektboard-UI prüfen |
| `WorkspaceCard.tsx` | UMWIDMEN | Card-Darstellung bleibt; Framing auf PW oder Projektboard anpassen |
| `WorkspaceList.tsx` | UMWIDMEN | Workspace-Liste → Projekt-Übersicht; Semantik anpassen |
| `TopBar.tsx` | BEHALTEN | Layout; kein Umbau |
| `ConnectionLines.tsx` | VERTIEFUNG NÖTIG | SVG-Verbindungen; nur wenn Canvas als Projektboard-UI bestätigt |

### /components/layout — Layout-Shell (5 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `TopBar.tsx` | BEHALTEN | Plattform-Navigation; kein Umbau |
| `Sidebar.tsx` | UMWIDMEN | Schichten-Navigation einbauen; Sidebar sollte die 6 Schichten widerspiegeln |
| `MobileHeader.tsx` | BEHALTEN | Mobile Layout; kein Umbau |
| `BottomNav.tsx` | UMWIDMEN | Mobile Schichten-Navigation; Items auf ADR-020-Schichten ausrichten |
| `AppShell.tsx` | BEHALTEN | Layout-Wrapper; kein Umbau |

### /components/workspaces — Workspace-Liste (10 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `WorkspacesList.tsx` | UMWIDMEN | Wird zu Projektboard-Übersicht; Framing anpassen |
| `MembersList.tsx` | VERTIEFUNG NÖTIG | Team-Feature; Solo-MVP-Priorität prüfen |
| `WorkspaceItemsList.tsx` | UMWIDMEN | Items nach Schichten-Typ filtern/anzeigen |
| `WorkspacePicker.tsx` | UMWIDMEN | Projekt-Picker statt Workspace-Picker |
| `AddItemModal.tsx` | UMWIDMEN | Schichten-bewusst umbauen: Wohin soll das Item? |
| `WorkspaceCard.tsx` | UMWIDMEN | Projekt-Karte; Framing anpassen |
| `CommentThread.tsx` | UMWIDMEN | In Konversations-System integrieren statt eigener Komponente |
| `ShareLinkPanel.tsx` | BEHALTEN | Share-Link; kein Umbau |
| `WorkspaceSettings.tsx` | UMWIDMEN | Projekt-Einstellungen; vereinfachen für Solo |
| `CardTile.tsx` | UMWIDMEN | PW-Fragment-Kachel; nach Konsolidierung in PW-UI integrieren |

### /components/cockpit — Dashboard (13 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `CockpitOnboarding.tsx` | UMWIDMEN | Projektboard-Onboarding; Schichten-Einführung einbauen |
| `WidgetPickerModal.tsx` | UMWIDMEN | Widget-Set auf ADR-020-Schichten ausrichten |
| `CockpitGrid.tsx` | BEHALTEN | Grid-Layout; kein Umbau |
| `widgets/CodeHealthWidget.tsx` | BEHALTEN | Audit-Score; Kern |
| `widgets/BudgetUsageWidget.tsx` | BEHALTEN | Budget-Anzeige; kein Umbau |
| `widgets/RecentActivityWidget.tsx` | BEHALTEN | Aktivitäts-Aggregation; nützlich |
| `widgets/FeedHighlightsWidget.tsx` | UMWIDMEN | "Inbox-Highlights" statt "Feed-Highlights" |
| `widgets/ProjectStatusWidget.tsx` | BEHALTEN | Projekt-Status; kein Umbau |
| `widgets/ArtifactOverviewWidget.tsx` | BEHALTEN | Artefakte-Zähler; kein Umbau |
| `widgets/TeamActivityWidget.tsx` | VERTIEFUNG NÖTIG | Team-Feature; Solo-MVP-Priorität prüfen |
| `widgets/ToroRecommendationWidget.tsx` | BEHALTEN | Regelbasierte Empfehlung; kein Umbau |
| `widgets/QuickActionsWidget.tsx` | UMWIDMEN | Schnell-Links auf ADR-020-Schichten ausrichten |
| `widgets/Shared.tsx` | BEHALTEN | Widget-Helfer; kein Umbau |

### /components/admin — Admin-Panels (6 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `qa/QaShared.tsx` | WEGFALL | QA-System war intern; kein Platz im neuen Produkt |
| `qa/PerformancePanel.tsx` | WEGFALL | Folgt QA-Wegfall |
| `qa/CompliancePanel.tsx` | WEGFALL | Folgt QA-Wegfall |
| `qa/OverviewPanel.tsx` | WEGFALL | Folgt QA-Wegfall |
| `qa/RoutingPanel.tsx` | WEGFALL | Folgt QA-Wegfall |
| `qa/QualityPanel.tsx` | WEGFALL | Folgt QA-Wegfall |

### /components/home — Landing (6 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `OrgOnboardingProgress.tsx` | UMWIDMEN | Onboarding auf Schichten-Einführung ausrichten |
| `ChatCTA.tsx` | BEHALTEN | Chat-Einstieg; kein Umbau |
| `OrgHealthSection.tsx` | UMWIDMEN | "Projekt-Gesundheit" statt Org; Solo-Kontext |
| `FeatureGrid.tsx` | UMWIDMEN | Feature-Grid auf neue Produkt-Positionierung ausrichten |
| `AnnouncementsFeed.tsx` | WEGFALL | Ankündigungs-Feed fällt mit announcements-Tabelle weg |
| `RecentlyUsed.tsx` | BEHALTEN | Zuletzt genutzte Items; Projektboard-Sicht |

### /components/artefakte (1 Datei)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `ArtifactPreviewModal.tsx` | BEHALTEN | Artefakt-Vorschau; kein Umbau |

### /components/ui (1 Datei)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `ToroBird.tsx` | BEHALTEN | Marken-Element; kein Umbau |

### Globale Komponenten (11 Dateien)

| Komponente | Empfehlung | Begründung |
|-----------|-----------|-----------|
| `ToroChatWidget.tsx` | BEHALTEN | Floating Chat; kein Umbau |
| `AccountSwitcher.tsx` | VERTIEFUNG NÖTIG | Multi-Org-Feature; für Solo-MVP vereinfachen oder weglassen |
| `ImpersonationBanner.tsx` | BEHALTEN | Sicherheits-Banner; kein Umbau |
| `MessageActions.tsx` | UMWIDMEN | Merker-Aktion prominenter machen; "Als Merker" als primäre Aktion |
| `CookieBanner.tsx` | BEHALTEN | DSGVO-Pflicht; kein Umbau |
| `NavBarNotifications.tsx` | UMWIDMEN | Inbox-Notifications hervorheben; visuelle Gewichtung der Inbox-Schicht |
| `ParrotIcon.tsx` | VERTIEFUNG NÖTIG | Marken-Element; Toro vs. Parrot Branding-Entscheidung |
| `AppFooter.tsx` | BEHALTEN | Layout; kein Umbau |
| `Parrot.tsx` | VERTIEFUNG NÖTIG | Folgt Branding-Entscheidung |
| `ServiceWorkerRegistrar.tsx` | BEHALTEN | PWA; kein Umbau |
| `AxeHelper.tsx` | BEHALTEN | Dev-Tool; kein Umbau |

---

### Komponenten-Scorecard

| Empfehlung | Anzahl | % |
|-----------|--------|---|
| BEHALTEN | 52 | 48% |
| UMWIDMEN | 29 | 27% |
| WEGFALL | 8 | 7% |
| VERTIEFUNG NÖTIG | 20 | 18% |

---

## Gesamtüberblick

| Bereich | BEHALTEN | UMWIDMEN | WEGFALL | VERTIEFUNG NÖTIG | Gesamt |
|---------|---------|---------|---------|-----------------|--------|
| DB-Tabellen | 28 (37%) | 16 (21%) | 22 (29%) | 10 (13%) | 76 |
| API-Routes | 78 (41%) | 30 (16%) | 36 (19%) | 48 (25%) | 192 |
| Komponenten | 52 (48%) | 29 (27%) | 8 (7%) | 20 (18%) | 109 |

---

## Offene Fragen vor weiterer Implementierung (VERTIEFUNG NÖTIG)

Die folgenden Entscheidungen blockieren mehrere abhängige Einträge:

| # | Frage | Betroffene Einträge |
|---|-------|---------------------|
| F1 | **Perspectives/Avatare:** Passt parallele KI-Ansicht zum Solo-Entrepreneur-MVP, oder ist das Phase-2? | 6 Tabellen/Routes/Komponenten |
| F2 | **Custom Agents:** Vereinfacht als "Toro-Automatisierungen" oder ganz aus dem MVP raus? | 6 Tabellen, 9 Routes |
| F3 | **Library/Roles/Skills:** Überleben als Projekt-Archetypen (SaaS-Template, E-Commerce-Template), oder kompletter Wegfall? | 5 Tabellen, 8 Routes |
| F4 | **Multi-Modell-Review & Consensus:** Kostenmodell klären — zahlt Solo-Entrepreneur das oder ist das ein Premium-Feature? | 2 Routes |
| F5 | **Canvas als Projektboard-UI:** Ist der Knoten-Canvas die richtige Visualisierung für das Projektboard, oder eine einfachere Board-Ansicht? | 5 Komponenten |
| F6 | **Team-Features (members, team-activity):** Vollständig aus MVP raus oder als "Invite a collaborator" vereinfacht behalten? | 4 Tabellen, 7 Routes, 3 Komponenten |
| F7 | **MCP-Integration:** Für Lovable/Cursor-Zielgruppe relevanter als gedacht? Prüfen vor Implementierung | 2 Tabellen, 2 Routes |
