'use client'

import { useState } from 'react'
import { ListChecks } from '@phosphor-icons/react'

// ── Typen ─────────────────────────────────────────────────────────────────────

type Status = 'offen' | 'in_arbeit' | 'erledigt' | 'blockiert' | 'geplant' | 'teilweise'

interface Todo {
  id: string
  titel: string
  beschreibung?: string
  status: Status
  kategorie: string
  prioritaet: 'hoch' | 'mittel' | 'niedrig'
  referenz?: string   // z.B. 'Art. 50 KI-VO', 'WCAG 2.1 AA'
}

// ── Daten ─────────────────────────────────────────────────────────────────────
// Stand: 2026-03-13 — manuell gepflegt, spiegelt CLAUDE.md + Roadmap wider

const TODOS: Todo[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // Chat & Workspace
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'chat-01',
    titel: 'Workspace-Redesign: Monolithische page.tsx aufgeteilt',
    beschreibung: '2067 Zeilen → 13 Komponenten (useWorkspaceState, WorkspaceLayout, LeftNav, ChatArea, EmptyState, ChatMessage, ChatInput, ProjectSidebar, ConvItem, Papierkorb, JungleModal, MergeModal, ConditionalNavBar).',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'hoch',
    referenz: '2026-03-07',
  },
  {
    id: 'chat-02',
    titel: 'Kimi-Style 3-Column Layout',
    beschreibung: '240px LeftNav, ChatArea flex-grow, ProjectSidebar. Mobile mit Overlay-Nav. Start Screen (EmptyState).',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'hoch',
    referenz: '2026-03-07',
  },
  {
    id: 'chat-03',
    titel: 'Multi-Select mit iOS-"Bearbeiten"-Pattern',
    beschreibung: 'Bearbeiten/Fertig im CHATS-Header, Aktionsleiste: Zusammenführen ≥2, Verschieben ≥1, Löschen ≥1. Lösch-Bestätigung inline.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: '2026-03-08',
  },
  {
    id: 'chat-04',
    titel: 'Jungle Order: Struktur-Vorschlag + Zusammenführen',
    beschreibung: 'Edge Function jungle-order mit action:structure + action:merge. Separater Dify Workflow tropen-os-jungle-order.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: '2026-03-07',
  },
  {
    id: 'chat-05',
    titel: 'Prompt-Bibliothek Phase 1: 5 Core-Vorlagen',
    beschreibung: 'prompt-templates.ts mit FieldDef-Discriminated-Union und assemble(). Vollständig clientseitig.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: '2026-03-07',
  },
  {
    id: 'chat-06',
    titel: 'Prompt-Bibliothek Phase 2: TemplateDrawer',
    beschreibung: 'Slide-down Drawer mit Live-Vorschau. EmptyState Pills → Drawer-Integration.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: '2026-03-08',
  },
  {
    id: 'chat-07',
    titel: 'Artefakte & Merkliste',
    beschreibung: 'artifacts + bookmarks Tabellen (Mig. 022). Chat-Header-Strip, Artefakte-Drawer (oben), Code-Block "Als Artefakt speichern", Bookmark-Icon, /workspace Grid-Seite.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: 'Migration 022',
  },
  {
    id: 'chat-08',
    titel: 'Startseiten-Chat (Toro-Widget)',
    beschreibung: 'Anonym, 5 Nachrichten, localStorage, gpt-4o-mini. Toro kennt Startseiten-Kontext, CTA nach Limit.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: 'public/chat/route.ts',
  },
  {
    id: 'chat-09',
    titel: 'Bug: Erste Nachricht im Toro-Widget leer (wrapOpenAI)',
    beschreibung: 'wrapOpenAI bricht ersten Streaming-Call. Fix: wrapOpenAI entfernt, openai direkt verwendet.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'hoch',
    referenz: '2026-03-11',
  },
  {
    id: 'chat-10',
    titel: 'Bug: Workspace-Chat leerer Bildschirm bei erster Nachricht',
    beschreibung: 'sendingRef Race Condition + newConversation() setzt setMessages([]) bevor Optimistic Messages gesetzt. Fix: initialMessages-Parameter in newConversation().',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'hoch',
    referenz: '2026-03-11',
  },
  {
    id: 'chat-11',
    titel: 'Agenten-System Phase 1: agents-Tabelle',
    beschreibung: 'agents Tabelle (Mig. 025). Marketing-Paket mit 5 Agenten + Schnellstart-Chips im ChatInput.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'hoch',
    referenz: 'Migration 025/026',
  },
  {
    id: 'chat-12',
    titel: 'Agenten-System Phase 2: Agent-Dropdown im Chat-Input',
    beschreibung: 'Vollständig implementiert: Dropdown in ChatInput, agent_id wird in conversations gespeichert, beim Conversation-Wechsel wiederhergestellt. Edge Function lädt agent system_prompt und übergibt ihn an Dify.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'hoch',
    referenz: 'Roadmap — nächster Schritt',
  },
  {
    id: 'chat-13',
    titel: 'Prompt-Bibliothek Phase 3: Eigene Vorlagen + Team-Vorlagen',
    beschreibung: 'TemplateDrawer hat 3 Tabs: Core-Vorlagen (hardcoded), Meine Vorlagen (POST/DELETE/PATCH /api/prompt-templates), Team-Vorlagen (scope=team). Erstellen, Löschen, Teilen vollständig. Pagination-Fix: .data aus Response extrahieren.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: 'Migration 024',
  },
  {
    id: 'chat-14',
    titel: 'Projekt-Gedächtnis Phase 2: Manuelles Kontext-Textfeld',
    beschreibung: 'UI-Textarea in projects/page.tsx (instructions-Feld) war vorhanden. Edge Function ergänzt: lädt project.instructions via project_id der Conversation und übergibt project_context an Dify.',
    status: 'erledigt',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: 'Roadmap',
  },
  {
    id: 'chat-15',
    titel: 'Projekt-Gedächtnis Phase 3: Automatische Extraktion via Dify',
    beschreibung: 'Toro extrahiert Personen, Deadlines, Entscheidungen, offene Fragen aus Chat-Verlauf → projects.memory.',
    status: 'geplant',
    kategorie: 'Chat & Workspace',
    prioritaet: 'niedrig',
    referenz: 'Roadmap',
  },
  {
    id: 'chat-16',
    titel: 'Toro Guard: 4-Schichten Moderations-System',
    beschreibung: 'Automatisch → KI-Review (Risk Score 0–100) → Manuell → Community. Status-System. Aggressivitäts-Slider statt alles/nichts.',
    status: 'geplant',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: 'Roadmap',
  },
  {
    id: 'chat-17',
    titel: 'Real-Time Websuche für Toro',
    beschreibung: 'Toro kann live im Web suchen. V2 Feature.',
    status: 'geplant',
    kategorie: 'Chat & Workspace',
    prioritaet: 'niedrig',
    referenz: 'Roadmap V2',
  },
  {
    id: 'chat-18',
    titel: 'Voice Output',
    beschreibung: 'Text-to-Speech für Toro-Antworten. Dify-Integration vorhanden, UI fehlt.',
    status: 'geplant',
    kategorie: 'Chat & Workspace',
    prioritaet: 'niedrig',
    referenz: 'Roadmap V2',
  },
  {
    id: 'chat-19',
    titel: 'Multimodalität & Datei-Upload im Chat',
    beschreibung: 'Bild- und Dokument-Upload direkt im Chat-Eingabefeld.',
    status: 'geplant',
    kategorie: 'Chat & Workspace',
    prioritaet: 'niedrig',
    referenz: 'Roadmap V2',
  },
  {
    id: 'chat-20',
    titel: 'Skills anlegen',
    beschreibung: 'Nutzer können eigene Prompt-/Agent-Skills erstellen, benennen und teilen. Community-Tab in /projects zeigt öffentliche Skills. Bewertungs- und Fork-System.',
    status: 'offen',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: 'Roadmap',
  },
  {
    id: 'chat-21',
    titel: 'SKILL.md System: Toro-Modellwahl & Zusammenfassungsqualität',
    beschreibung: 'Drei Verbesserungen am SKILL.md/Skills-System: (1) Modellwahl-Optimierung — Toro wählt automatisch das passende Modell je nach Aufgabentyp (Schnelligkeit vs. Qualität vs. Kosten). (2) Zusammenfassungs-Qualität — Zusammenfassungen langer Gespräche verbessern. (3) Workspace-Erstellung verbessern — Onboarding-Flow für neue Workspaces optimieren.',
    status: 'offen',
    kategorie: 'Chat & Workspace',
    prioritaet: 'mittel',
    referenz: 'SKILL.md',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Projekte & Wissensbasis
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'proj-01',
    titel: 'Smarte Projekte Phase 1: /projects Seite',
    beschreibung: '4 Tabs (Meine Projekte, Meine Agenten, Community, Vorlagen). Projekt-Felder: Kontext, Ton, Sprache, Zielgruppe, Gedächtnis.',
    status: 'erledigt',
    kategorie: 'Projekte & Wissensbasis',
    prioritaet: 'hoch',
    referenz: 'Migration 016 / 2026-03-09',
  },
  {
    id: 'proj-02',
    titel: 'Wissensbasis & RAG: Fundament',
    beschreibung: 'pgvector EU, text-embedding-3-small, 3 Ebenen (Org/User/Projekt). Dokument-Upload UI + Edge Functions knowledge-search + knowledge-ingest.',
    status: 'erledigt',
    kategorie: 'Projekte & Wissensbasis',
    prioritaet: 'hoch',
    referenz: 'Migration 017/018',
  },
  {
    id: 'proj-05',
    titel: 'RAG Pipeline: knowledge-search + ai-chat Integration',
    beschreibung: 'knowledge-search Edge Function deployed. ai-chat Step 9c: ruft knowledge-search mit User-Nachricht + org/user/project auf, injiziert Top-5 Chunks als knowledge_context in Dify inputs. Non-blocking.',
    status: 'erledigt',
    kategorie: 'Projekte & Wissensbasis',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'proj-06',
    titel: 'knowledge-ingest: Edge Function Crash-Ursache finden',
    beschreibung: 'Step-Debugging deployed (schreibt aktuellen Step in error_message). User muss fehlgeschlagenes Dokument löschen + neu hochladen. Fehler erscheint dann als "[step] ..." unter dem Dokument. RLS-Policies (Mig. 036) + Bucket sind korrekt.',
    status: 'offen',
    kategorie: 'Projekte & Wissensbasis',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'proj-07',
    titel: 'Dify: knowledge_context Variable in System-Prompt einbauen',
    beschreibung: 'In der tropen-os-chat-v2 Dify-App muss {{knowledge_context}} im System-Prompt Abschnitt ergänzt werden. Beispiel: "## Relevante Wissensbasis-Einträge:\\n{{knowledge_context}}". Manueller Schritt im Dify Dashboard — kein Code.',
    status: 'offen',
    kategorie: 'Projekte & Wissensbasis',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'proj-03',
    titel: 'Wissensbasis Phase 2: Google Drive, Notion, RSS',
    beschreibung: 'Externe Quellen anbinden: Google Drive Sync, Notion, RSS Feeds, Web-Seiten manuell.',
    status: 'geplant',
    kategorie: 'Projekte & Wissensbasis',
    prioritaet: 'niedrig',
    referenz: 'Roadmap Phase 3',
  },
  {
    id: 'proj-04',
    titel: 'n8n/Make Integration',
    beschreibung: 'Trigger aus Tropen OS, n8n als Agent-Tool, Tropen OS als n8n Node. Automationen-Tab in Projekt-Einstellungen.',
    status: 'geplant',
    kategorie: 'Projekte & Wissensbasis',
    prioritaet: 'niedrig',
    referenz: 'Roadmap',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Paket-System
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'paket-01',
    titel: 'Paket-System Phase 1: Marketing-Paket',
    beschreibung: '5 Agenten (Campaign Planner, Brand Voice Writer, Social Adapter, Newsletter Spezialist, Copy Texter). Schnellstart-Chips im ChatInput. Superadmin aktiviert pro Org.',
    status: 'erledigt',
    kategorie: 'Paket-System',
    prioritaet: 'hoch',
    referenz: 'Migration 026 / 2026-03-10',
  },
  {
    id: 'paket-02',
    titel: 'Paket-System Phase 2: Marketing-Paket Vollausbau',
    beschreibung: '10 Agenten, Hootsuite/Buffer/Mailchimp/Canva/HubSpot-Integration.',
    status: 'geplant',
    kategorie: 'Paket-System',
    prioritaet: 'mittel',
    referenz: 'Roadmap',
  },
  {
    id: 'paket-03',
    titel: 'Wissenschafts-Paket',
    beschreibung: '10 Agenten, Zotero-Anbindung, DFG/Horizon-Antragsvorlagen. Risiko: ⚠️ nur mit Partner.',
    status: 'geplant',
    kategorie: 'Paket-System',
    prioritaet: 'niedrig',
    referenz: 'Roadmap',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Design-System & UX
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ds-01',
    titel: 'Design-System: Türkis/Teal vollständig entfernt',
    beschreibung: 'Alle teal/cyan Farben durch var(--accent) var(--accent) ersetzt. Gilt global.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'hoch',
    referenz: '2026-03-07/08',
  },
  {
    id: 'ds-02',
    titel: 'Content-Breiten-System',
    beschreibung: '.content-max 1200px · .content-narrow 720px · .content-wide 1400px · .content-full. Alle Seiten migriert.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'mittel',
    referenz: '2026-03-07',
  },
  {
    id: 'ds-03',
    titel: 'Globale Typografie & Utility-Klassen',
    beschreibung: '.t-primary, .t-secondary, .t-dezent, .chip, .chip--active, .dropdown, .dropdown-item in globals.css.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'mittel',
    referenz: '2026-03-08',
  },
  {
    id: 'ds-04',
    titel: 'Kosten-Forecast im SessionPanel',
    beschreibung: 'Bereits implementiert: forecastCost = (monthlyCost / dayOfMonth) * daysInMonth. Warnungen ab €5 (orange) und €10 (rot). Session-Kosten-Warnung ab €0.10 / €0.50. Zeile "Hochrechnung" in der Session-Panel-Stats-Sektion.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'mittel',
    referenz: 'Roadmap',
  },
  {
    id: 'ds-06',
    titel: 'Layout-Standard-Bereinigung aller Seiten',
    beschreibung: 'hub, department, feeds, workspace, projects, offline, artifacts: Outer-Wrapper entfernt, content-max direkt als Root. body flex-column + main flex:1 für korrektes Footer-Positioning in layout.tsx.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'ds-07',
    titel: 'Artefakte: Eigene Seite /artifacts + NavBar-Link',
    beschreibung: '/artifacts als eigenständige Seite (vorher in /workspace). NavBar: Archive-Icon + Link für Member. /workspace zeigt Phase-2 Placeholder.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'mittel',
    referenz: '2026-03-13',
  },
  {
    id: 'ds-08',
    titel: 'Department aus Member-Nav → Admin-Nav verschoben',
    beschreibung: 'Department-Link nur noch in Admin-Nav sichtbar. Member-Nav zeigt Department nicht mehr.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'mittel',
    referenz: '2026-03-13',
  },
  {
    id: 'ds-09',
    titel: 'Modelle für Members: Toggle in Admin/Models',
    beschreibung: 'members_see_models Boolean in organization_settings (Mig. 035). Toggle in admin/models Seite. NavBar zeigt Modelle-Link für Member nur wenn Toggle aktiv.',
    status: 'erledigt',
    kategorie: 'Design-System & UX',
    prioritaet: 'mittel',
    referenz: '2026-03-13',
  },
  {
    id: 'ds-05',
    titel: 'Proaktive Hilfe: UI für proactive_hints',
    beschreibung: 'Toro schlägt nächste Schritte vor (abschaltbar). proactive_hints Boolean in user_preferences (Mig. 023). Settings-UI fehlt noch.',
    status: 'offen',
    kategorie: 'Design-System & UX',
    prioritaet: 'niedrig',
    referenz: 'Migration 023',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Infrastruktur & Backend
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'infra-01',
    titel: 'Superadmin-Tool: Clients anlegen, bearbeiten, löschen',
    beschreibung: '/superadmin/clients: Org anlegen → Workspace → organization_settings → Owner einladen. Role-Switcher im NavBar. Superadmin-Org unlöschbar.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: 'Migration 011/020',
  },
  {
    id: 'infra-02',
    titel: 'Impersonation (Admin-Ebenen & DSGVO)',
    beschreibung: 'Read-only Banner, Countdown, geloggt in impersonation_sessions. 15/30/60 Min, Ticket-Referenz Pflicht. User sieht Sessions in Settings.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: 'Migration 021',
  },
  {
    id: 'infra-03',
    titel: 'Bug: check_and_reserve_budget RPC (FOR UPDATE + Aggregat)',
    beschreibung: 'FOR UPDATE mit Aggregat-Funktion ist in PostgreSQL ungültig. Fix: Migration 012.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: 'Migration 012 / 2026-03-07',
  },
  {
    id: 'infra-04',
    titel: 'Bug: workspace_members-Eintrag fehlte für neue Org-Owner',
    beschreibung: 'Nach Onboarding war Owner kein workspace_member. Fix: api/onboarding/complete ergänzt.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: '2026-03-07',
  },
  {
    id: 'infra-05',
    titel: 'Bug: Vercel Build-Crash supabaseUrl is required',
    beschreibung: 'supabase-admin.ts rief createClient() auf Modul-Ebene auf → Turbopack-Crash. Fix: Proxy-basierte Lazy-Initialisierung.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: '2026-03-11',
  },
  {
    id: 'infra-06',
    titel: 'Bug: Edge Function workflow_finished-Event',
    beschreibung: 'ai-chat/index.ts behandelt jetzt beide Events: message_end || workflow_finished. dify_conversation_id korrekt aus message_end gespeichert.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: '2026-03-09',
  },
  {
    id: 'infra-07',
    titel: 'Thinking Mode: thinking_mode in user_preferences',
    beschreibung: 'thinking_mode BOOLEAN (Mig. 015) vorhanden. Edge Function ai-chat lädt jetzt thinking_mode aus user_preferences und übergibt es als Input an Dify. Toggle in SessionPanel vorhanden (gespeichert via savePrefs).',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'niedrig',
    referenz: 'Migration 015',
  },
  {
    id: 'infra-08b',
    titel: 'Sentry Error Tracking integriert',
    beschreibung: '@sentry/nextjs integriert. sentry.server.config.ts + sentry.client.config.ts + sentry.edge.config.ts. withSentryConfig() in next.config.ts. Source Maps in Production deaktiviert.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'infra-08c',
    titel: 'Globales Rate Limiting mit Upstash Redis',
    beschreibung: 'proxy.ts: Sliding Window pro IP. Auth-Seiten 10/15min, public API 20/1h, Chat-Stream 30/1min, alle API-Routes 200/1min. In-Memory-Map in public/chat/route.ts entfernt. Supabase Session Refresh in proxy.ts ergänzt.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'infra-08',
    titel: 'PWA: Progressive Web App',
    beschreibung: 'public/manifest.json (name, icons, shortcuts, theme_color var(--accent)). SVG-Icons 192px + 512px in public/icons/. Service Worker public/sw.js: Network-first für Navigation, Cache-first für statische Assets, Offline-Fallback /offline. ServiceWorkerRegistrar Client-Komponente in layout.tsx. metadata.manifest + themeColor + appleWebApp ergänzt.',
    status: 'erledigt',
    kategorie: 'Infrastruktur & Backend',
    prioritaet: 'mittel',
    referenz: 'Roadmap',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Testing
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'test-01',
    titel: 'Playwright E2E: Setup + Login-Tests',
    beschreibung: 'playwright.config.ts erstellt. e2e/login.spec.ts: 5 Tests — Form-Rendering, Validierung, Fehler-Mock (Supabase 400), Erfolgs-Mock (Redirect /chat), Link Passwort vergessen. Chromium in CI installiert.',
    status: 'erledigt',
    kategorie: 'Testing',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'test-02',
    titel: 'Playwright E2E: Toro Chat Widget',
    beschreibung: 'e2e/toro-widget.spec.ts: 4 Tests — Widget sichtbar, Eingabe möglich, Antwort nach Mock-API erscheint, Optimistic UI (Nutzer-Nachricht sofort sichtbar).',
    status: 'erledigt',
    kategorie: 'Testing',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'test-03',
    titel: 'Vitest Coverage: Scope auf src/lib/** + src/app/api/** erweitert',
    beschreibung: 'Coverage-Include von src/lib/qa/** auf src/lib/** + src/app/api/** ausgeweitet. Thresholds bei 50% (branches/functions/lines). Unit Tests für token-counter.ts (7 Tests) und errors.ts (4 Tests) hinzugefügt. 48 Tests gesamt, alle grün.',
    status: 'erledigt',
    kategorie: 'Testing',
    prioritaet: 'hoch',
    referenz: '2026-03-13',
  },
  {
    id: 'test-04',
    titel: 'E2E: Authenticated Chat-Flow (Login → Chat → Antwort)',
    beschreibung: 'E2E-Test der die vollständige User Journey mit echtem Supabase-Test-Account testet. Benötigt E2E_EMAIL und E2E_PASSWORD in Vercel Secrets.',
    status: 'offen',
    kategorie: 'Testing',
    prioritaet: 'mittel',
    referenz: 'nach Test-Account-Setup',
  },
  {
    id: 'test-05',
    titel: 'Vitest Coverage auf 70% erhöhen',
    beschreibung: 'Threshold auf 70% gesetzt und erreicht: 83% Lines, 96% Functions, 70% Branches. Neue Tests: validators (27), logger (8), validateBody (6). Coverage include auf testbare Lib-Dateien fokussiert.',
    status: 'erledigt',
    kategorie: 'Testing',
    prioritaet: 'mittel',
    referenz: 'Roadmap Q2',
  },
  {
    id: 'compliance-01',
    titel: 'Art. 50 KI-VO: Persistente KI-Kennzeichnung auf Assistant-Nachrichten',
    beschreibung: 'Jede abgeschlossene Toro-Antwort trägt das Label "KI-generiert · Toro" (Art. 50 Abs. 1 EU AI Act). Implementiert in ChatMessage.tsx + cmsg-ki-label CSS-Klasse.',
    status: 'erledigt',
    kategorie: 'Compliance',
    prioritaet: 'hoch',
    referenz: 'Art. 50 Abs. 1 KI-VO (EU AI Act)',
  },
  {
    id: 'infra-09',
    titel: 'Uptime Monitoring: /api/health Endpunkt + externe Überwachung',
    beschreibung: '/api/health gibt DB-Ping, App-Version und Timestamp zurück (200 ok / 503 degraded). Externes Monitoring (BetterUptime / UptimeRobot) manuell auf diesen Endpunkt konfigurieren.',
    status: 'teilweise',
    kategorie: 'Infrastruktur',
    prioritaet: 'mittel',
    referenz: 'Audit-Bericht 2026-03-13, Punkt 4',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // QA & Observability
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'qa-00',
    titel: 'QA Infrastruktur Phase 1–4: routing-logger, task-classifier, QA Dashboard',
    beschreibung: 'qa_routing_log, qa_metrics, qa_compliance_checks, qa_test_runs, qa_lighthouse_runs Tabellen. 5 API-Routes. Dashboard mit 5 Tabs. 35 Unit-Tests grün.',
    status: 'erledigt',
    kategorie: 'QA & Observability',
    prioritaet: 'hoch',
    referenz: 'Migration 027 / 2026-03-11',
  },
  {
    id: 'qa-00b',
    titel: 'LangSmith Integration (Phase 5a) mit DSGVO-Compliance',
    beschreibung: 'langsmith/tracer.ts mit hideInputs/hideOutputs. routeRequest als traceable Span. wrapOpenAI entfernt (Streaming-Bug). LangSmith-Panel im Performance-Tab.',
    status: 'erledigt',
    kategorie: 'QA & Observability',
    prioritaet: 'hoch',
    referenz: '2026-03-11',
  },
  {
    id: 'qa-01',
    titel: 'LangSmith: Smoke-Test in Production durchführen',
    beschreibung: '3–5 Nachrichten senden, verifizieren dass route_request Spans in smith.langchain.com erscheinen.',
    status: 'offen',
    kategorie: 'QA & Observability',
    prioritaet: 'hoch',
    referenz: 'LangSmith / Phase 5a',
  },
  {
    id: 'qa-02',
    titel: 'Vercel: LangSmith Env-Vars in Production setzen',
    beschreibung: 'LANGSMITH_API_KEY, LANGSMITH_PROJECT, LANGSMITH_TRACING als Vercel Environment Variables eintragen.',
    status: 'offen',
    kategorie: 'QA & Observability',
    prioritaet: 'hoch',
    referenz: 'Phase 5a',
  },
  {
    id: 'qa-03',
    titel: 'Bias-Evaluierungen: Erste Runs + Metriken in qa_metrics',
    beschreibung: 'scripts/bias-eval.mjs: 5 Prompt-Paare (gender, sprache, alter, herkunft, bildung), Qualitäts-Parität ≥ 95%. Ergebnisse in qa_metrics. .github/workflows/bias-eval.yml: wöchentlich Mo 08:00 UTC + manuell auslösbar. Benötigt DIFY_API_URL, DIFY_API_KEY als GitHub Secrets.',
    status: 'erledigt',
    kategorie: 'QA & Observability',
    prioritaet: 'mittel',
    referenz: 'QA Dashboard / Art. 10',
  },
  {
    id: 'qa-04',
    titel: 'Lighthouse-CI: Automatische Runs bei jedem Deployment',
    beschreibung: '.github/workflows/lighthouse.yml erstellt: läuft nach erfolgreichem CI auf main, testet VERCEL_PRODUCTION_URL, Thresholds: Perf ≥ 80, A11y ≥ 90, Best-Practices ≥ 80, SEO ≥ 80. Ergebnisse in qa_lighthouse_runs via save-lighthouse-results.mjs. Secret VERCEL_PRODUCTION_URL muss in GitHub gesetzt sein.',
    status: 'erledigt',
    kategorie: 'QA & Observability',
    prioritaet: 'mittel',
    referenz: 'CI/CD / Performance Tab',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Compliance & Recht
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'comp-00a',
    titel: 'AI Act Acknowledgement im Onboarding (Schritt 4)',
    beschreibung: 'ai_act_acknowledged + ai_act_acknowledged_at in user_preferences. Pflicht-Checkbox, Weiter-Button gesperrt bis gesetzt.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'Migration 009',
  },
  {
    id: 'comp-00b',
    titel: 'DSGVO: LangSmith hideInputs/hideOutputs',
    beschreibung: 'Kein Chat-Inhalt geht in LangSmith Cloud. hideInputs: true, hideOutputs: true auf Client-Ebene.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'DSGVO Art. 10 / 2026-03-11',
  },
  {
    id: 'comp-00c',
    titel: 'DSGVO: User-ID in qa_routing_log gehasht',
    beschreibung: 'SHA-256 Hash, nur erste 16 Zeichen gespeichert. Nie Klartext.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'routing-logger.ts',
  },
  {
    id: 'comp-01',
    titel: 'Art. 50 KI-VO: Persistente KI-Kennzeichnung im Chat',
    beschreibung: 'Sichtbarer Hinweis unter jeder Toro-Antwort dass KI generiert. Implementiert als "KI-generiert · Toro" Label in ChatMessage.tsx (cmsg-ki-label). Onboarding-Checkbox allein reicht nicht.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'Art. 50 Abs. 1 KI-VO — Pflicht seit Feb 2025',
  },
  {
    id: 'comp-02',
    titel: 'Art. 14: Human Override / Eskalationsmechanismus',
    beschreibung: 'ThumbsDown-Button auf jeder Toro-Antwort. Klick → optionaler Grund → POST /api/messages/[id]/flag → flagged + flagged_at + flag_reason in messages-Tabelle (Migration 034). Admin-Auswertung über Service Role.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'Art. 14 EU AI Act',
  },
  {
    id: 'comp-03',
    titel: 'Art. 12: KI-Logging-Vollständigkeit prüfen',
    beschreibung: 'qa_routing_log jetzt auch für Workspace-Chat: logRouting() Fire-and-forget in Edge Function ai-chat/index.ts, nach commitSave(). User-ID via Web Crypto SHA-256 gehasht. Fehler-Pfad ebenfalls geloggt.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'Art. 12 EU AI Act',
  },
  {
    id: 'comp-04',
    titel: 'Art. 11: Technische Dokumentation vor Launch',
    beschreibung: 'CLAUDE.md vorhanden, formale Doku (System-Architektur, Modell-Auswahl, Trainings-Daten-Policy) fehlt.',
    status: 'offen',
    kategorie: 'Compliance & Recht',
    prioritaet: 'mittel',
    referenz: 'Art. 11 EU AI Act',
  },
  {
    id: 'comp-05',
    titel: 'Art. 10: Bias-Evaluierungen durchführen und dokumentieren',
    beschreibung: 'qa_metrics Tabelle ist bereit. Erste Bias-Runs müssen ausgeführt und Datensätze archiviert werden.',
    status: 'offen',
    kategorie: 'Compliance & Recht',
    prioritaet: 'mittel',
    referenz: 'Art. 10 EU AI Act',
  },
  {
    id: 'comp-06',
    titel: 'Art. 9: Risikoregister anlegen',
    beschreibung: 'Formales Risikoregister mit identifizierten Risiken, Wahrscheinlichkeit, Maßnahmen.',
    status: 'offen',
    kategorie: 'Compliance & Recht',
    prioritaet: 'mittel',
    referenz: 'Art. 9 EU AI Act',
  },
  {
    id: 'comp-07',
    titel: 'DSGVO: Vollständiges Verarbeitungsverzeichnis (VVT)',
    beschreibung: 'AVV-Vorlage vorhanden. Vollständiges Verzeichnis aller Verarbeitungstätigkeiten fehlt noch.',
    status: 'offen',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'DSGVO Art. 30',
  },
  {
    id: 'comp-07b',
    titel: 'Footer erstellen',
    beschreibung: 'AppFooter.tsx erstellt: Impressum, Datenschutz, Barrierefreiheit, Barriere-melden (E-Mail), Schlichtungsstelle-Link. In root layout.tsx eingebunden. Nicht im Chat/Workspace sichtbar.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'BFSG § 14 / EAA',
  },
  {
    id: 'comp-08',
    titel: 'BFSG: Barrierefreiheitserklärung /accessibility erstellen',
    beschreibung: '/accessibility erstellt: WCAG-Konformitätserklärung, bekannte Lücken, implementierte Features, Barriere-Kontakt, Schlichtungsstelle (§ 16 BFSG). Pflicht seit 28.06.2025.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'hoch',
    referenz: 'BFSG / EAA — gilt seit 28.06.2025',
  },
  {
    id: 'comp-09',
    titel: 'BFSG: Feedbackmechanismus für Barrieren im Footer',
    beschreibung: 'accessibility@tropen.de im Footer und auf /accessibility verlinkt.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'mittel',
    referenz: 'BFSG § 14',
  },
  {
    id: 'comp-10',
    titel: 'BFSG: Schlichtungsstelle benennen (Ombudsstelle BMAS)',
    beschreibung: 'schlichtungsstelle-bgg.de im Footer und auf /accessibility (§ 16 BFSG) verlinkt.',
    status: 'erledigt',
    kategorie: 'Compliance & Recht',
    prioritaet: 'mittel',
    referenz: 'BFSG § 16',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Accessibility (WCAG 2.1 AA)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'a11y-01',
    titel: 'Chat-Nachrichten: aria-live="polite" hinzufügen',
    beschreibung: 'Screenreader müssen neue Chat-Antworten ankündigen. ChatArea / ChatMessage Komponente.',
    status: 'erledigt',
    kategorie: 'Accessibility (WCAG 2.1 AA)',
    prioritaet: 'hoch',
    referenz: 'WCAG 4.1.3',
  },
  {
    id: 'a11y-02',
    titel: 'Loading-States: aria-busy="true" auf Container setzen',
    beschreibung: 'aria-busy auf workspace, projects, knowledge, admin/models, admin/users, admin/budget Hauptcontainer. Alle relevanten Seiten mit loading-State abgedeckt.',
    status: 'erledigt',
    kategorie: 'Accessibility (WCAG 2.1 AA)',
    prioritaet: 'mittel',
    referenz: 'WCAG 4.1.3',
  },
  {
    id: 'a11y-03',
    titel: 'Drawer/Modal: Fokus-Trap + Escape + Rückkehr-Fokus',
    beschreibung: 'useFocusTrap Hook erstellt (src/hooks/useFocusTrap.ts). Eingebaut in ArtifactsDrawer, BookmarksDrawer, SearchDrawer, MemorySaveModal, MergeModal. role="dialog" aria-modal="true" auf allen. TemplateDrawer erhielt aria-Attribute.',
    status: 'erledigt',
    kategorie: 'Accessibility (WCAG 2.1 AA)',
    prioritaet: 'hoch',
    referenz: 'WCAG 2.1.2',
  },
  {
    id: 'a11y-04',
    titel: 'prefers-reduced-motion in globals.css ergänzen',
    beschreibung: 'Media Query für reduzierte Bewegung. Bereits implementiert in globals.css (animation-duration + transition-duration auf 0.01ms).',
    status: 'erledigt',
    kategorie: 'Accessibility (WCAG 2.1 AA)',
    prioritaet: 'mittel',
    referenz: 'WCAG 2.3.3',
  },
  {
    id: 'a11y-05',
    titel: 'Icon-Buttons: aria-label Vollständigkeitsprüfung',
    beschreibung: 'ChatInput Send-Button, ChatHeaderStrip Search-Button, ArtifactsDrawer/BookmarksDrawer Close-Buttons ergänzt. Bookmark-Button und ThumbsDown-Button in ChatMessage.tsx ebenfalls mit aria-label versehen. LeftNav hat keine reinen Icon-Buttons (alle mit Text-Label).',
    status: 'erledigt',
    kategorie: 'Accessibility (WCAG 2.1 AA)',
    prioritaet: 'mittel',
    referenz: 'WCAG 1.1.1',
  },
  {
    id: 'a11y-06',
    titel: 'Kontrast-Audit: Alle Farbkombinationen prüfen',
    beschreibung: 'Erledigt 2026-03-16. Admin-Seiten (7) von Dark-Theme auf CSS-Variablen migriert, Modale (Jungle/Merge/Save) auf Light-Theme, Drawers + ChatMessage + ImpersonationBanner Kontrast-Fixes. ~35 deprecated #a3b554-Referenzen durch var(--accent) ersetzt. Alle Kombinationen ≥4.5:1 AA.',
    status: 'erledigt',
    kategorie: 'Accessibility (WCAG 2.1 AA)',
    prioritaet: 'mittel',
    referenz: 'WCAG 1.4.3',
  },
]

// ── Konstanten & Helpers ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  offen:     { label: 'Offen',     bg: 'var(--accent-subtle)',  color: 'var(--accent)' },
  in_arbeit: { label: 'In Arbeit', bg: 'var(--accent-subtle)',  color: 'var(--accent)' },
  erledigt:  { label: 'Erledigt',  bg: 'var(--success-bg)',     color: 'var(--success)' },
  blockiert: { label: 'Blockiert', bg: 'var(--error-bg)',       color: 'var(--error)' },
  geplant:   { label: 'Geplant',   bg: 'var(--info-bg)',        color: 'var(--info)' },
  teilweise: { label: 'Teilweise', bg: 'var(--warning-bg)',     color: 'var(--warning)' },
}

const PRIO_CONFIG: Record<string, { label: string; color: string }> = {
  hoch:     { label: 'Hoch',     color: 'var(--error)' },
  mittel:   { label: 'Mittel',   color: 'var(--warning)' },
  niedrig:  { label: 'Niedrig',  color: 'var(--text-tertiary)' },
}

const KATEGORIEN = [...new Set(TODOS.map(t => t.kategorie))]

// ── Styles ─────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  controls:    { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' },
  stats:       { display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' },
  statCard:    { padding: '12px 20px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' },
  statValue:   { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 },
  statLabel:   { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  section:     { marginBottom: 36 },
  sectionTitle:{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 12 },
  card:        { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', marginBottom: 8 },
  cardHeader:  { display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' },
  cardTitle:   { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', flex: 1 },
  cardDesc:    { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 5, lineHeight: 1.5 },
  cardMeta:    { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' },
  ref:         { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' },
  badgeRow:    { display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 },
  empty:       { padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 },
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return { fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: bg, color, whiteSpace: 'nowrap' }
}

// ── Komponente ────────────────────────────────────────────────────────────────

export default function TodoPage() {
  const [filterStatus, setFilterStatus] = useState<Status | 'alle'>('alle')
  const [filterKat, setFilterKat] = useState<string>('alle')
  const [hideErledigt, setHideErledigt] = useState(true)

  const filtered = TODOS.filter(t => {
    if (hideErledigt && t.status === 'erledigt') return false
    if (filterStatus !== 'alle' && t.status !== filterStatus) return false
    if (filterKat !== 'alle' && t.kategorie !== filterKat) return false
    return true
  })

  const grouped = KATEGORIEN.reduce<Record<string, Todo[]>>((acc, kat) => {
    const items = filtered.filter(t => t.kategorie === kat)
    if (items.length) acc[kat] = items
    return acc
  }, {})

  const total   = TODOS.length
  const offen   = TODOS.filter(t => t.status === 'offen').length
  const arbeit  = TODOS.filter(t => t.status === 'in_arbeit').length
  const erled   = TODOS.filter(t => t.status === 'erledigt').length
  const hoch    = TODOS.filter(t => t.prioritaet === 'hoch' && t.status !== 'erledigt').length

  return (
    <div className="content-wide">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ListChecks size={22} color="var(--text-primary)" weight="bold" />
            To-Do & Compliance Tracker
          </h1>
          <p className="page-header-sub">Alle Tasks aus CLAUDE.md + Roadmap · {total} Einträge gesamt · {erled} erledigt</p>
        </div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        {[
          { value: offen,  label: 'Offen',     color: 'var(--text-secondary)' },
          { value: arbeit, label: 'In Arbeit',  color: 'var(--accent)' },
          { value: erled,  label: 'Erledigt',   color: 'var(--success)' },
          { value: hoch,   label: 'Hohe Prio',  color: 'var(--error)' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter: Status */}
      <div style={s.controls}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</span>
        {(['alle', 'offen', 'in_arbeit', 'erledigt', 'blockiert', 'geplant'] as const).map(s_ => (
          <button key={s_} className={filterStatus === s_ ? 'chip chip--active' : 'chip'} onClick={() => { setFilterStatus(s_); if (s_ === 'erledigt') setHideErledigt(false) }}>
            {s_ === 'alle' ? 'Alle' : STATUS_CONFIG[s_ as Status]?.label ?? s_}
          </button>
        ))}
        <button
          className={hideErledigt ? 'chip chip--active' : 'chip'}
          style={{ marginLeft: 8 }}
          onClick={() => setHideErledigt(v => !v)}
        >
          {hideErledigt ? '✓ Erledigte ausgeblendet' : '○ Erledigte sichtbar'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginLeft: 8 }}>Kategorie</span>
        <button className={filterKat === 'alle' ? 'chip chip--active' : 'chip'} onClick={() => setFilterKat('alle')}>Alle</button>
        {KATEGORIEN.map(k => (
          <button key={k} className={filterKat === k ? 'chip chip--active' : 'chip'} onClick={() => setFilterKat(k)}>{k}</button>
        ))}
      </div>

      {/* Liste */}
      {Object.keys(grouped).length === 0 ? (
        <div style={s.empty}>Keine Einträge für diese Filterauswahl.</div>
      ) : (
        Object.entries(grouped).map(([kat, items]) => (
          <div key={kat} style={s.section}>
            <div style={s.sectionTitle}>{kat} · {items.length}</div>
            {items.map(todo => {
              const st = STATUS_CONFIG[todo.status]
              const pr = PRIO_CONFIG[todo.prioritaet]
              return (
                <div key={todo.id} style={s.card}>
                  <div style={s.cardHeader}>
                    <div style={s.cardTitle}>{todo.titel}</div>
                    <div style={s.badgeRow}>
                      <span style={badgeStyle(st.bg, st.color)}>{st.label}</span>
                      <span style={{ fontSize: 11, color: pr.color, fontWeight: 500 }}>{pr.label}</span>
                    </div>
                  </div>
                  {todo.beschreibung && (
                    <div style={s.cardDesc}>{todo.beschreibung}</div>
                  )}
                  <div style={s.cardMeta}>
                    {todo.referenz && (
                      <span style={s.ref}>{todo.referenz}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
