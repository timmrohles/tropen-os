/* eslint-disable unicorn/filename-case */
import type { Todo } from './todo.types'

// Konzepte & Roadmap-Einträge
// SINGLE SOURCE OF TRUTH für docs/product/roadmap.md → "Geplant (später)"
// Neue Roadmap-Einträge hier eintragen → erscheint automatisch in der Todo-Liste

export const TODOS_CONCEPTS: Todo[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // Charts & Visualisierung
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'chart-tremor',
    titel: 'Tremor Migration — App-UI Charts (Dashboard, SessionPanel)',
     
    beschreibung: 'Erledigt: Tremor-Theme auf Tropen-Grün (#2D7A50) aktualisiert (tailwind.config.js). CostChart + RoutingPanel BarList: emerald → green. SessionPanel: AreaChart für per-message Kosten (ab 2 Datenpunkten).',
    status: 'erledigt',
    kategorie: 'Charts & Visualisierung',
    prioritaet: 'mittel',
    referenz: 'docs/plans/tremor-migration.md',
  },
  {
    id: 'chart-echarts',
    titel: 'ECharts Artifact-Renderer — Toro generiert Chart-JSON',
    beschreibung: 'Erledigt: ArtifactType "chart" + parse-artifacts VALID_TYPES. buildChartIframeHtml (ECharts 5 CDN, Tropen-Grün Default-Palette, resize/click). ArtifactRenderer: typeIcon/Label/Preview/iframe (350px, allow-scripts allow-same-origin). System-Prompt in buildWorkspaceContext ergänzt.',
    status: 'erledigt',
    kategorie: 'Charts & Visualisierung',
    prioritaet: 'mittel',
    referenz: 'docs/plans/echarts-artifacts.md',
  },
  {
    id: 'chart-presentations',
    titel: 'Präsentations-System — Toro generiert Reveal.js Slides im Chat',
    beschreibung: 'Vollständig: parse-artifacts + presentation-Type, ArtifactRenderer mit iFrame + Slide-Zähler, Quick-Chips, System-Prompt, pptxgenjs-Export, 3 Library-Skills (pitch, status-update, workshop), buildPresentationContext (Workspace + Projekt-Gedächtnis), stream-Route mode="presentation".',
    status: 'erledigt',
    kategorie: 'Charts & Visualisierung',
    prioritaet: 'mittel',
    referenz: 'docs/plans/presentation-artifacts.md',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Phase 2 — Offen
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'phase2-e',
    titel: 'Plan E — Transformations-Engine',
    beschreibung: 'POST /api/transformations: analyze + suggest + build + link. Projekt → Workspace / Agent / Feed. Immer Vorschau → Bestätigung → Ausführung — nie destruktiv. Transformation-Links (Mig. 090 Tenant-Isolation-Fix).',
    status: 'erledigt',
    kategorie: 'Phase 2',
    prioritaet: 'mittel',
    referenz: 'docs/product/roadmap.md / 2026-03-25',
  },
  {
    id: 'phase2-f',
    titel: 'Plan F — UI (Projekte + Workspaces + Feeds-Settings)',
    beschreibung: 'Projekte-Seite neu: Karten-Grid, Gedächtnis-Zähler, Emoji-Picker, Context-Feld, Archivieren. Workspaces-Seite komplett neu (Grid + Detail-Tabs). Feeds: Run-History, Distributions, Notifications.',
    status: 'erledigt',
    kategorie: 'Phase 2',
    prioritaet: 'mittel',
    referenz: 'Migration 073–079 / 2026-03-25',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Toro Intelligence
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'concept-toro-scan',
    titel: 'Toro als Potenzial-Entdecker — Phase 1: KI-Potenzial-Scan im Onboarding',
    beschreibung: 'Strukturiertes Erstgespräch nach Onboarding-Step 5. 5–7 Fragen als Gespräch (nie Formular). Ergebnis: priorisierte Liste konkreter Automatisierungsmöglichkeiten. Direkt ausprobierbar per Klick. Ergebnis als org_potential_scan gespeichert.',
    status: 'geplant',
    kategorie: 'Toro Intelligence',
    prioritaet: 'hoch',
    referenz: 'docs/product/toro-potential-scan.md',
  },
  {
    id: 'concept-toro-library',
    titel: 'Toro als Potenzial-Entdecker — Phase 2: Automatisierungs-Bibliothek',
    beschreibung: '/library Tab "Für meine Branche". Filterbar: Branche, Teamgröße, Zeitaufwand, Komplexität. Peer-Vergleich ("47 Marketingagenturen nutzen diese Vorlage"). Community-Sharing. Branchen-Tags auf Skills/Rollen.',
    status: 'geplant',
    kategorie: 'Toro Intelligence',
    prioritaet: 'mittel',
    referenz: 'docs/product/toro-potential-scan.md',
  },
  {
    id: 'concept-toro-observer',
    titel: 'Toro als Potenzial-Entdecker — Phase 3: Toro beobachtet und schlägt vor',
    beschreibung: 'Pattern-Erkennung aus project_memory + Chat-Verlauf. Haiku analysiert wöchentlich. toro_suggestions Tabelle (APPEND ONLY). Max. 1 Vorschlag/Woche. Dashboard als Potenzial-Cockpit.',
    status: 'geplant',
    kategorie: 'Toro Intelligence',
    prioritaet: 'mittel',
    referenz: 'docs/product/toro-potential-scan.md',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Meta-Agenten
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'concept-meta-health',
    titel: 'Meta-Agenten — Phase 1: Health-Monitor',
    beschreibung: 'Täglicher Cron-Check aller aktiven Agenten. health_score 0–100, Klassifikation: technisch/qualitativ/extern. Automatische Reparatur bei kleinen Fehlern (Timeout, Parsing). agent_health_log (APPEND ONLY).',
    status: 'geplant',
    kategorie: 'Meta-Agenten',
    prioritaet: 'mittel',
    referenz: 'docs/product/meta-agenten.md',
  },
  {
    id: 'concept-meta-optimizer',
    titel: 'Meta-Agenten — Phase 2: Quality-Optimizer',
    beschreibung: 'Erkennt Qualitäts-Drift über Zeit. Sonnet generiert verbesserten Prompt. A/B-Test (alter vs. neuer Prompt). User bestätigt Übernahme. agent_versions (APPEND ONLY).',
    status: 'geplant',
    kategorie: 'Meta-Agenten',
    prioritaet: 'niedrig',
    referenz: 'docs/product/meta-agenten.md',
  },
  {
    id: 'concept-meta-scout',
    titel: 'Meta-Agenten — Phase 3: Opportunity-Scout',
    beschreibung: 'Erkennt neue Automatisierungsmöglichkeiten aus Chat-History + Community-Patterns. Max. 1 Vorschlag/Woche. Lernt aus Feedback. toro_suggestions APPEND ONLY.',
    status: 'geplant',
    kategorie: 'Meta-Agenten',
    prioritaet: 'niedrig',
    referenz: 'docs/product/meta-agenten.md',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Perspectives — Zweite Meinung im Chat
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'concept-persp-infra',
    titel: 'Perspectives — Migration + API + 5 System-Avatare',
    beschreibung: 'perspective_avatars + perspective_user_settings Tabellen. RLS-Policies. 5 System-Seeds (Kritiker, A.D., Optimist, Stratege, Tabula Rasa). 6 API-Routes inkl. POST /api/perspectives/query (paralleles SSE-Streaming).',
    status: 'erledigt',
    kategorie: 'Perspectives',
    prioritaet: 'hoch',
    referenz: 'docs/plans/perspectives-build.md',
  },
  {
    id: 'concept-persp-strip',
    titel: 'Perspectives — PerspectivesStrip + Bottom-Sheet',
    beschreibung: 'PerspectivesStrip.tsx über ChatInput. PerspectivesInfobox (Popover). PerspectivesBottomSheet.tsx: paralleles Streaming, 1/2/3+ Avatar Layouts, "In Chat posten". Bottom-Sheet Fokus-Trap + Escape.',
    status: 'erledigt',
    kategorie: 'Perspectives',
    prioritaet: 'hoch',
    referenz: 'docs/plans/perspectives-build.md',
  },
  {
    id: 'concept-persp-page',
    titel: 'Perspectives — /perspectives Seite + AvatarFormDrawer',
    beschreibung: '/perspectives mit Tabs System/Organisation/Meine Avatare. Avatar-Cards Grid. Kopieren, Bearbeiten, Löschen. AvatarFormDrawer für eigene Avatare. NavBar-Link "Perspectives" (Eye-Icon).',
    status: 'erledigt',
    kategorie: 'Perspectives',
    prioritaet: 'mittel',
    referenz: 'docs/plans/perspectives-build.md',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Superadmin-Erweiterungen
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'sa-persp-01',
    titel: 'Superadmin: System-Avatare für Perspectives verwalten',
    beschreibung: '/superadmin/perspectives — CRUD für scope=\'system\' Avatare direkt im Superadmin-Panel statt via SQL-Migrations. Emoji, Name, Beschreibung, System-Prompt, Modell, context_default, is_tabula_rasa, sort_order, is_active. Eigene API-Route mit requireSuperadmin()-Guard.',
    status: 'erledigt',
    kategorie: 'Superadmin',
    prioritaet: 'niedrig',
    referenz: 'src/app/superadmin/clients/page.tsx als Muster',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Plan L — MCP-Integrationen
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'plan-l-mcp',
    titel: 'Plan L — MCP-Integrationen (Figma, Slack, Google Drive, Notion, HubSpot…)',
    beschreibung: 'Toro verbindet sich via Model Context Protocol mit externen Apps. Variante A (Start): fremde MCP-Server (Figma, Slack, Google Drive etc.) via OAuth — keine eigene Infrastruktur. Variante B (später): eigene MCP-Server für interne Tools. User autorisiert einmalig, Toro liest/schreibt danach direkt im Chat. Vollständiges Konzept: docs/plans/mcp-integrations-konzept.md',
    status: 'geplant',
    kategorie: 'Integrationen',
    prioritaet: 'hoch',
    referenz: 'docs/plans/mcp-integrations-konzept.md',
  },
  {
    id: 'mcp-01-vorarbeit',
    titel: 'Manuelle Vorarbeit: OAuth-Apps anlegen (Timm)',
    beschreibung: '1. Google Cloud Console: Gmail API + Calendar API + Drive API aktivieren. OAuth 2.0 Client ID erstellen (Typ: Web Application). Redirect URIs: https://app.tropen.io/api/auth/callback/google + http://localhost:3000/api/auth/callback/google. GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.\n\n2. Slack API: Neue App anlegen. Scopes: channels:read, chat:write, users:read. Redirect URI: https://app.tropen.io/api/auth/callback/slack. SLACK_CLIENT_ID + SLACK_CLIENT_SECRET in .env.\n\n3. MCP_ENCRYPTION_KEY generieren: openssl rand -hex 32',
    status: 'offen',
    kategorie: 'Integrationen',
    prioritaet: 'hoch',
    referenz: 'docs/plans/mcp-integrations-konzept.md',
  },
  {
    id: 'mcp-02-build',
    titel: 'MCP-Verbindungen bauen (Settings + OAuth + DB + Widgets)',
    beschreibung: 'DSGVO-Design-Prinzipien (nicht verhandelbar): Tokens → AES-256 verschlüsselt in DB. Rohe Daten (E-Mails, Kalender-Details, Slack-Nachrichten) → NIEMALS in DB. Widget-Cache → nur verarbeitete Ergebnisse. Trennen → alles sofort gelöscht. Scope minimal halten (nur readonly). Aufgaben: Migration mcp_connections + mcp_widget_cache (RLS). crypto.ts (AES-256-GCM). OAuth-Flow /api/auth/mcp/[provider] + /api/auth/callback/[provider] (CSRF via State). MCP-Client (getMCPClient, Token-Refresh). Settings Tab "Verbindungen" (VerbindungenSection). Widget-Integration (CTA wenn nicht verbunden). Trennen-API + Cache-Cleanup.',
    status: 'offen',
    kategorie: 'Integrationen',
    prioritaet: 'hoch',
    referenz: 'docs/plans/mcp-integrations-konzept.md',
  },
  {
    id: 'mcp-03-agenten',
    titel: 'Prioritäts-Agenten: E-Mail, Kalender, Meeting (nach MCP-Build)',
    beschreibung: 'Drei Agenten die MCP-Verbindungen nutzen: 1. E-Mail-Agent (Haiku, tägl. 07:00) — liest Gmail, priorisiert, schreibt in Widget-Cache. 2. Kalender-Agent (Haiku, tägl. + 30min vor Meeting) — liest Calendar, zeigt Tagesüberblick + Meeting-Vorbereitung. 3. Meeting-Scribe (Whisper + Sonnet, on-demand) — transkribiert + fasst Meeting zusammen. Voraussetzung: mcp-02-build erledigt.',
    status: 'offen',
    kategorie: 'Integrationen',
    prioritaet: 'hoch',
    referenz: 'docs/plans/mcp-integrations-konzept.md',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Rollen-System — offene TODOs
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'roles-member-readonly',
    titel: 'Member-Rolle: Modelle-Seite read-only',
    beschreibung: 'NavBar für member zeigt Modelle-Link — aber die Seite soll read-only sein (keine Änderungen). Aktuell: kein Schutz vorhanden. Lösung: OrgRole-Check in /admin/models page.tsx oder API-Route.',
    status: 'offen',
    kategorie: 'Rollen & Berechtigungen',
    prioritaet: 'mittel',
    referenz: 'src/components/NavBar.tsx + memory.md',
  },
  {
    id: 'roles-viewer-readonly',
    titel: 'Viewer-Rolle: alle Admin-Seiten read-only (Edits deaktivieren)',
    beschreibung: 'Viewer sieht dieselben Nav-Links wie Admin, aber alle Seiten sollen read-only sein — Buttons/Formulare deaktiviert. Noch nicht implementiert. Ansatz: useOrgRole() Hook + disabled-State auf allen Edit-Aktionen.',
    status: 'offen',
    kategorie: 'Rollen & Berechtigungen',
    prioritaet: 'mittel',
    referenz: 'memory.md — Role Architecture',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AI FIRST — Abgeleitet aus 18 Newslettern (Nov 2025 – März 2026)
  // ══════════════════════════════════════════════════════════════════════════

  // Toro / KI-Verhalten
  {
    id: 'ai-first-toro-values',
    titel: 'Toro Werte-Hierarchie im Systemprompt (AI FIRST 1.1)',
    beschreibung: 'Explizite Werte-Hierarchie in supabase/functions/ai-chat/index.ts: 1. Ehrlichkeit, 2. Datensparsamkeit, 3. Relevanz, 4. Effizienz. Toro erklärt sich als Entität von [Org-Name] auf Tropen OS — kein generischer Assistent. Reine Prompt-Arbeit, kein Code.',
    status: 'geplant',
    kategorie: 'Toro / KI-Verhalten',
    prioritaet: 'mittel',
    referenz: 'AI FIRST "Werte statt Regeln" (08.02.26)',
  },
  {
    id: 'ai-first-toro-delegate',
    titel: 'Toro "Was du nicht delegieren solltest"-Logik (AI FIRST 1.2)',
    beschreibung: 'Systemprompt ergänzen: Toro unterscheidet implizit ob Wert im Ergebnis oder im Prozess liegt. Bei Letzterem (Kreativarbeit, Beziehungsaufbau, Reflexion) weist Toro hin, ohne zu blockieren. 30 Minuten, reine Prompt-Ergänzung.',
    status: 'geplant',
    kategorie: 'Toro / KI-Verhalten',
    prioritaet: 'niedrig',
    referenz: 'AI FIRST "Was du nicht an KI abgeben solltest" (16.11.25)',
  },

  // Onboarding
  {
    id: 'ai-first-onboarding-texts',
    titel: 'Onboarding-Texte neu schreiben — AI-First Einstiegspfad (AI FIRST 2.1)',
    beschreibung: 'Schlüsselbotschaft: "In 30 Minuten hast du deinen ersten echten Kontext hochgeladen und deinen ersten Agenten aktiv." Step 1: Erwartung setzen. Step 3: erstes Wissen mitbringen statt nur Team einladen. Neuer Step 5: erster Skill als Guided Workflow. Kein Code.',
    status: 'geplant',
    kategorie: 'Onboarding',
    prioritaet: 'hoch',
    referenz: 'AI FIRST "Guide: Richtig mit KI in 2026" (11.01.26)',
  },
  {
    id: 'ai-first-onboarding-workflow',
    titel: '"Erste Stunde"-Guided Workflow anlegen (AI FIRST 2.2)',
    beschreibung: 'System-Guided-Workflow "onboarding-first-skill" (scope=system). Schritte: Scout (welche Aufgabe?), Planer (welche Infos braucht Toro?), Ausführer (Capability aktivieren), Reviewer (erste Antwort bewerten). Als letzter Onboarding-Schritt eingeblendet.',
    status: 'geplant',
    kategorie: 'Onboarding',
    prioritaet: 'mittel',
    referenz: 'AI FIRST SPARK-Methode (07.12.25)',
  },
  {
    id: 'ai-first-onboarding-progress',
    titel: 'Onboarding Progress-Tracker: 3 Meilensteine sichtbar machen (AI FIRST 2.3)',
    beschreibung: 'User gilt als "operativ" wenn: (1) ersten Kontext hochgeladen, (2) ersten Skill aktiviert, (3) erste Chat-Session abgeschlossen. Kleines "Erste Schritte"-Widget im Dashboard, das verschwindet wenn alle 3 erledigt. State in user_metadata oder eigener onboarding_progress-Tabelle.',
    status: 'geplant',
    kategorie: 'Onboarding',
    prioritaet: 'mittel',
    referenz: 'AI FIRST "8 Wochen KI-Betriebssystem" (01.03.26)',
  },

  // Agenten-System (AI FIRST)
  {
    id: 'ai-first-agent-types',
    titel: '3 Agenten-Typen als offizielle Sprache einführen (AI FIRST 3.1)',
    beschreibung: 'OS-Agent (Toro), Pipeline-Agent (Feeds), Standalone-Agent (Marketing-Agenten). feature-registry.md + Agenten-Seite: Badge/Label pro Agent. CLAUDE.md: Typ-Klassifikation bei Agenten-Prompts. Dokumentation + kleiner UI-Prompt.',
    status: 'geplant',
    kategorie: 'Agenten',
    prioritaet: 'mittel',
    referenz: 'AI FIRST "Der Agentic Layer" (22.03.26)',
  },
  {
    id: 'ai-first-governance-badge',
    titel: 'Governance-Badge (🟢🟡🔴) pro Agent/Capability sichtbar (AI FIRST 3.2)',
    beschreibung: 'DB: capabilities + agents um governance_level (enum: green|yellow|red) erweitern (Migration). UI: Badge in Agenten-Liste + Capability-Karte mit Tooltip. Onboarding: Governance-Konzept erklären. Stärkt Vertrauen bei KMU-Admins.',
    status: 'geplant',
    kategorie: 'Agenten',
    prioritaet: 'mittel',
    referenz: 'AI FIRST "Das KI-Skill-Playbook" (15.03.26)',
  },
  {
    id: 'ai-first-skill-anatomy',
    titel: 'Guided Workflow "Skill erstellen" — 5-teilige Skill-Anatomie (AI FIRST 3.3)',
    beschreibung: 'Neuer Guided Workflow für Skill-Anlage: (1) Aufgabe, (2) Ein/Ausgaben, (3) SOP Schritt-für-Schritt, (4) Kontext-Bedarf, (5) Definition of Done, (6) Governance-Stufe. Erscheint beim Anlegen einer neuen Capability/Skill. Kleines Formular-Schritte-UI.',
    status: 'geplant',
    kategorie: 'Agenten',
    prioritaet: 'mittel',
    referenz: 'AI FIRST "Das KI-Skill-Playbook" (15.03.26)',
  },

  // Kontext-System & Wissensbasis
  {
    id: 'ai-first-context-model',
    titel: '3-stufiges Kontext-Modell dokumentieren (AI FIRST 4.1)',
    beschreibung: 'Kern-Kontext (immer geladen), Aufgaben-Kontext (Skill-spezifisch), Hintergrund-Kontext (auf Abruf). In rag-architecture.md und CLAUDE.md dokumentieren. Wissensbasis-Seite optional nach Stufe gruppieren.',
    status: 'geplant',
    kategorie: 'Kontext & Wissensbasis',
    prioritaet: 'niedrig',
    referenz: 'AI FIRST "Die 5 Bausteine" (08.03.26)',
  },
  {
    id: 'ai-first-knowledge-cta',
    titel: '"Wissensbasis aufbauen" als zentralen First Value kommunizieren (AI FIRST 4.2)',
    beschreibung: 'Onboarding + Wissensbasis-Seite: "Toro kennt deinen Kontext — deshalb liefert er bessere Ergebnisse als ein generischer Chatbot". Prominenter CTA "Dein erstes Dokument hochladen". Empty State: nicht "Noch keine Einträge", sondern "Toro braucht Kontext". Nur Texte.',
    status: 'geplant',
    kategorie: 'Kontext & Wissensbasis',
    prioritaet: 'hoch',
    referenz: 'AI FIRST "Unser KI-Tool Stack" (02.11.25)',
  },

  // Feedback-Layer
  {
    id: 'ai-first-feedback-layer',
    titel: 'Feedback-Layer für Skill-Verbesserungen (AI FIRST 5.1)',
    beschreibung: 'Nächster großer Plan nach J2. skill_feedback Tabelle (skill_id, agent_run_id, feedback_type, suggestion, status). Nach jedem Agenten-Run Toro um Feedback bitten. Skill-Owner-View in Library mit offenen Items. Skill-Owner-Rolle definieren.',
    status: 'geplant',
    kategorie: 'Agenten',
    prioritaet: 'hoch',
    referenz: 'AI FIRST "Die 5 Bausteine" (08.03.26) — eigener Plan nach J2',
  },

  // Marketing & Positionierung
  {
    id: 'ai-first-terminology',
    titel: 'Terminologie an AI FIRST angleichen (AI FIRST 6.1)',
    beschreibung: 'UI-Labels und Onboarding-Texte: "Capabilities anlegen" → "Skills dokumentieren", "Agenten konfigurieren" → "Agenten-Team aufbauen", "Workspace erstellen" → "Arbeitsbereich einrichten". "Dein KI-Betriebssystem" auf Login-Screen. Nur Texte, kein Refactoring.',
    status: 'geplant',
    kategorie: 'Marketing & Positionierung',
    prioritaet: 'niedrig',
    referenz: 'AI FIRST alle Artikel',
  },
  {
    id: 'ai-first-player-coach',
    titel: '"Player-AI-Coach" Rollenverschiebung kommunizieren (AI FIRST 6.2)',
    beschreibung: 'Onboarding Step 1: "Du wirst zum Player-AI-Coach deines Teams." Kernbotschaft: nicht "KI ersetzt euch", sondern "ihr führt KI". Landing Page + architecture.md ergänzen. 1 Stunde, Texte + Docs.',
    status: 'geplant',
    kategorie: 'Marketing & Positionierung',
    prioritaet: 'niedrig',
    referenz: 'AI FIRST "AI-First Teamaufbau" (14.12.25)',
  },
  {
    id: 'ai-first-feeds-position',
    titel: 'Feeds als "Automatische Wissensquelle" positionieren (AI FIRST 6.3)',
    beschreibung: 'Feeds-Seite: Tagline "Automatische Wissensquelle — Toro beobachtet das Netz für dich". Onboarding: Feeds als Schritt 3 ("Richte deinen ersten automatischen Feed ein"). Antwortet auf "Wir haben keine Zeit, die Wissensbasis manuell zu pflegen". Nur Texte.',
    status: 'geplant',
    kategorie: 'Marketing & Positionierung',
    prioritaet: 'mittel',
    referenz: 'AI FIRST "Unser KI-Tool Stack" (02.11.25)',
  },

  // GenAI Framework
  {
    id: 'ai-first-genai-framework',
    titel: 'GenAI Framework in Toro-Einstiegsdialog einbauen (AI FIRST 7.1)',
    beschreibung: 'Toro-Begrüßung bei 0 Nachrichten: "Ich kann dir bei zwei Dingen helfen: Analysieren + Erstellen. Je mehr Kontext ich habe, desto besser meine Unterstützung." Als Toro-Nachricht, nicht als Popup. Prompt-Ergänzung in Edge Function, 30 Minuten.',
    status: 'geplant',
    kategorie: 'Toro / KI-Verhalten',
    prioritaet: 'mittel',
    referenz: 'AI FIRST "Das GenAI Framework" (30.11.25)',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Agenten-System (spätere Phasen)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'concept-agents-phase2',
    titel: 'Agenten-System Phase 2: Zuweisung zu Projekten und Chats',
    beschreibung: 'Agenten können direkt einem Projekt oder einer Konversation zugewiesen werden. Kontext-Injection aus Projekt-Gedächtnis + Wissensbasis in Agent-Runs.',
    status: 'geplant',
    kategorie: 'Agenten',
    prioritaet: 'mittel',
    referenz: 'docs/product/roadmap.md',
  },

]
