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
    beschreibung: 'POST /api/transformations: analyze + suggest + build + link. Projekt → Workspace / Agent / Feed. Immer Vorschau → Bestätigung → Ausführung — nie destruktiv.',
    status: 'geplant',
    kategorie: 'Phase 2',
    prioritaet: 'mittel',
    referenz: 'docs/product/roadmap.md',
  },
  {
    id: 'phase2-f',
    titel: 'Plan F — UI (Projekte + Workspaces + Feeds-Settings)',
    beschreibung: 'Projekte-Seite neu: Liste mit Gedächtnis-Zähler, Wissensbasis-Tab. Workspaces-Seite: Karten-Graph-View, Outcome-Board. Transformations-Trigger als kontextueller Hinweis.',
    status: 'geplant',
    kategorie: 'Phase 2',
    prioritaet: 'mittel',
    referenz: 'docs/product/roadmap.md',
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
