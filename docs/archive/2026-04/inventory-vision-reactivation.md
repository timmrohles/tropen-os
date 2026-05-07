# Vision-Reactivation-Inventur — Tropen OS

**Datum:** 23. April 2026  
**Zweck:** Strukturierte Bestandsaufnahme gegen neue Produktvision (Vibe-Coding-Begleiter). Keine Code-Änderungen, keine Architektur-Entscheidungen — reine Inventur als Entscheidungsgrundlage.

## Schritt 1: Architektur-Reality-Check

**Ampel: 🟡 Gelb — Substanz vorhanden, Transformation nötig**

Tropen OS hat auf Komponenten-Ebene fast alle Stücke für die neue Vision. Reaktivierung = Umklassifizierung + Logik-Anpassungen, nicht komplette Neubau.

## Übersicht: Die 10 Vision-Komponenten — Status

| # | Komponente | Vorhanden | Status | Aufwand | Kritischer Pfad |
|---|-----------|-----------|--------|---------|-----------------|
| 1 | Projektwissen | ✅ DB | B | Klein | 🔴 JA |
| 2 | Chat | ✅ Produktiv | A | Klein | 🟢 Läuft |
| 3 | Inbox | ⚠️ Teilweise | C | Mittel | ⚠️ Später |
| 4 | Repo-Integration | ✅ Produktiv | A | Klein | 🟢 Läuft |
| 5 | Agenten | ✅ DB | B | Klein | ⚠️ Optional |
| 6 | Workflows | ✅ DB | B | Mittel | ⚠️ Später |
| 7 | Prompt-Bibliothek | ⚠️ DB | C | Groß | ⚠️ Community |
| 8 | Integrationen | ⚠️ Prompt-Export | B | Groß | 🔴 JA |
| 9 | Prompt-Veredler | ❌ Nicht vorhanden | D | Groß | 🔴 JA |
| 10 | Scanner | ✅ Produktiv | A | 0 | 🟢 Läuft |

## Komponenten im Detail

### 1. Projektwissen — strukturierte Wissensbasis mit Konsequenz-Mechanismus

**Status:** B — Fertig, ungenutzt (eingefroren seit April-Pivot, aber strukturell vollständig)

**Heutiger Zustand:** Tabellen projects, project_memory (APPEND ONLY), project_documents. Routen /api/projects/*. Komponenten projects/page.tsx, ProjectMemoryTab.tsx. **Konsequenz-Mechanismus: nicht implementiert.**

**Zielgruppen-Passung:** Gebaut für KMU. Für Vibe-Coder passt es, wenn Strukturierung (Business-Konzept, Zielgruppe, Monetarisierung) ausgebaut wird.

**Aufwand:** Klein (Tage) — Daten existieren, nur UI und Konsequenz-Trigger.

**Transformation nötig:** Nur Logik — Typ-Klassifikation verfeinern, Konsequenz-Webhook bauen.

**Offene Fragen:** 1. JSON in memory_type oder separate Spalten? 2. Welche Features müssen benachrichtigt werden?

### 2. Chat — Denkraum mit Zugriff auf verschiedene Modelle, optional Komitee

**Status:** A — Produktiv genutzt (eingefroren in Nav, aber Chat-Route aktiv)

**Heutiger Zustand:** Tabelle conversations. Edge Function supabase/functions/ai-chat/index.ts mit Projekt-Kontext-Injection. Routen POST /api/chat/stream. Komponenten ChatArea.tsx, ChatInput.tsx. **Komitee: 4 Modelle + Opus Judge für Audit-Findings, noch nicht in Chat.**

**Zielgruppen-Passung:** Nativ für Vibe-Coder (Developer-Kontext, Artifact-Fokus).

**Aufwand:** Klein (Tage) — Multi-Model-Selector UI + Komitee-Option integrieren.

**Transformation nötig:** Nur UI + optionale Logik — Model-Picker, Komitee-Toggle, Parallel-Tabs.

**Offene Fragen:** 1. Komitee-Modus: User-selectable? 2. Parallel-Tabs? 3. Default-Modelle?

### 3. Inbox — Eingangsbereich für Deep Research, API-Ergebnisse, Agenten-Output

**Status:** C — Teilweise implementiert (Bookmarks ja, dedizierte Inbox nein)

**Heutiger Zustand:** Tabelle bookmarks (ab Migration 092). Feed-Distributions mit target_type=notification. UI /lesezeichen. **Dedizierte Inbox-Seite mit Agenten-Ergebnissen, API-Webhooks: fehlt.**

**Zielgruppen-Passung:** Vibe-Coding-Begleiter-spezifisch: Inbox als Hub für alle externen Inputs.

**Aufwand:** Mittel (Wochen) — Bookmarks ja, aber konsolidierter Hub fehlt.

**Transformation nötig:** Auch Datenmodell — inbox_items Tabelle für Agenten/API-Ergebnisse + RLS.

### 4. Repo-Integration — tatsächliche Codebase als Teil der Plattform

**Status:** A — Produktiv genutzt (Audit-System ist Kern-Feature nach Pivot)

**Heutiger Zustand:** File System Access API in src/lib/file-access/. Repo-Map in src/lib/repo-map/. Audit-Engine mit 29 Checker-Dateien, 242 Regeln. Tabelle scan_projects. Routen POST /api/projects/scan, POST /api/audit/trigger. Benchmark: 49 externe Repos.

**Zielgruppen-Passung:** Nativ für Production Readiness Scanner (Pivot-Feature).

**Aufwand:** Klein (Tage) — Alles aktiv. Nur GitHub-Integration noch nicht vorhanden.

**Transformation nötig:** Ggfs. Logik — GitHub-OAuth, Cursor/Claude Code-Integration.

### 5. Agenten-Orchestrierung — Führungsebene und Fachagenten, Parent-Subagent-Struktur

**Status:** B — Fertig, ungenutzt (eingefroren nach April-Pivot)

**Heutiger Zustand:** Tabellen agents, agent_runs (APPEND ONLY), agent_skills, skills. Agent-Engine in src/lib/agent-engine.ts. 29 Agent Rule Packs. Routen GET/POST /api/agents/*. **Parent-Subagent: nicht implementiert — flache Agent-Struktur mit capability_steps.**

**Zielgruppen-Passung:** Ursprünglich KMU. Für Vibe-Coder: Fachagenten für Code-Review, Architecture-Check, Compliance.

**Aufwand:** Klein (Tage) — Kern-Logik existiert. Optional: Parent-Subagent + UI.

**Transformation nötig:** Nur Logik.

**Offene Fragen:** 1. Parent-Subagent nötig, oder reichen Capability-Steps? 2. Welche 5-10 Agenten in MVP?

### 6. Workflows — automatisierte Agenten-Abfolgen basierend auf Phasenplan

**Status:** B — Fertig, ungenutzt (gebaut Plan 1, nicht aktiviert nach Pivot)

**Heutiger Zustand:** Tabellen guided_workflows (7 System-Workflows geseedet), capabilities, outcomes, capability_org_settings. Engine src/lib/guided-workflow-engine.ts (regelbasiert). Routen GET /api/guided/workflows. **Phasenplan-Logik: nicht vorhanden.**

**Zielgruppen-Passung:** Für Vibe-Coder: Workflow = Abfolge von Audit-Checks, Code-Review, Refactoring.

**Aufwand:** Mittel (Wochen) — Kern-Engine läuft. Phasenplan-Logik + Workflows neu.

**Transformation nötig:** Auch Datenmodell + Logik — Phasenplan-Konzept in projects + Trigger-Logik.

**Offene Fragen:** 1. Wie viele Phasen? (Discovery → Architecture → Implementation → Production → Hardening) 2. Auto-Trigger oder User-initiated?

### 7. Prompt-Bibliothek & Skills — teilbar, Community-Marktplatz-Potenzial

**Status:** C — Teilweise implementiert (Skill-DB vorhanden, Library-UI fehlt)

**Heutiger Zustand:** Tabelle skills (name, description, system_prompt, scope, icon). 6 System-Skills geseedet. Prompt-Export in src/lib/audit/prompt-export/ (regelbasiert). **Prompt-Bibliotheks-UI, Community-Sharing, Marktplatz: fehlt.**

**Zielgruppen-Passung:** Vibe-Coder-spezifisch: Prompts für Code-Review, Architecture-Checks. Community = Kern.

**Aufwand:** Groß (Monate) — Skill-DB ja, Library-UI und Community komplett Neubau.

**Transformation nötig:** Komplette Neukonzeption — Library-Seite, Bewertungssystem, Community-Fork/Share, Versionierung.

**Offene Fragen:** 1. MVP: nur org-intern, oder global? 2. Versionierung? 3. Licensing/Attribution-Modell?

### 8. Integrationen — zu Coding-Tools (Cursor, Claude Code, GitHub, Vercel, Supabase)

**Status:** B — Fertig, ungenutzt (Prompt-Export ja, API-Integrationen nein)

**Heutiger Zustand:** Prompt-Export src/lib/audit/prompt-export/ mit 3 Tool-Varianten (Cursor, Claude Code, Generic). Routen GET /api/audit/fix/[mode]/generate. **Live-API-Integrationen, OAuth: fehlt.**

**Zielgruppen-Passung:** Kern für Vibe-Coder-Vision: "Kein Copy-Paste, nur Integrations".

**Aufwand:** Groß (Monate) — Prompt-Format existiert, OAuth/API/Workspace-Linking fehlt.

**Transformation nötig:** Komplette Neukonzeption für API-Layer — OAuth, Token-Verschlüsselung, bidirektionale Sync.

**Offene Fragen:** 1. MVP: nur Cursor + Claude Code? 2. Bidirektional? 3. MCP-Strategy?

### 9. Prompt-Veredler — Hintergrund-Agent, der Prompts vor dem Senden anreichert

**Status:** D — Nur Stub (keine Komponente vorhanden)

**Heutiger Zustand:** Noch nicht implementiert. Architektur-Platz vorhanden (Hook vor Chat-LLM-Call). Komponenten der Voraussetzung: project-context.ts, prompt-templates.ts, capability-resolver.ts.

**Zielgruppen-Passung:** Vibe-Coding-Begleiter-spezifisch: macht Prompts automatisch contextual.

**Aufwand:** Groß (Monate) — Konzept → Design → Engine-Build → Integration → Testing.

**Transformation nötig:** Komplette Neukonzeption — neue Middleware-Komponente in Chat-Architektur.

**Offene Fragen:** 1. Regelbasiert oder LLM-gesteuert? 2. Welche Kontexte: project_memory, Audit-Findings, Agenten-Output? 3. Performance: Pre-Processing oder Real-Time?

### 10. Scanner — das heutige Tropen OS als Feature (bleibt erhalten)

**Status:** A — Produktiv genutzt (Kern-Feature, täglich im Einsatz)

**Heutiger Zustand:** 242 Regeln, 29 Agent Packs, Multi-Model Review, Consensus Fix Engine, Score 95.2% Production Grade. Tabellen audit_runs, audit_findings, audit_category_scores, scan_projects, audit_fixes, audit_tasks. 40+ API-Routes. Dogfooding aktiv.

**Aufwand:** Schon aktiv — 0 Aufwand. Nur laufende Kalibrierung + neue Checker-Regeln.

**Transformation nötig:** Nein — läuft.

---

## Neu zu bauen (nicht vorhanden, aber nötig)

- Dedizierte Inbox-UI + Aggregation (Wochen)
- Prompt-Bibliotheks-UI + Sharing (Monate)
- API-Integrationen: Cursor, Vercel, GitHub (Monate)
- Prompt-Veredler-Engine (Monate)
- Phasenplan-System für Workflows (Wochen)
- Parent-Subagent-Struktur (optional) (Wochen)
- Community/Marketplace-Features (Monate)
- GitHub-OAuth + Private-Repo-Support (Wochen)
- MCP-Integration (Monate+)
- Live-Projekt-Profile mit Geschäftskonzept-Feldern (Wochen)

## 5 nüchterne Beobachtungen (ohne Wertung)

1. **Substanz ist da, Aktivierung ist die Arbeit** — Alle 10 Komponenten haben existierenden Code (>80%). Keine ist Neuconzeption. Reaktivierung = UI + neue Features, nicht Backend-Neubau.

2. **Chat und Audit sind die beiden Säulen** — alles andere hängt dran. Wenn diese stabil sind, können andere in Serie aktiviert werden.

3. **Projektwissen-Struktur ist das Bottleneck** — viele Features hängen von strukturiertem Wissen ab. Heute ist es Freitext. Strukturierung = eintägiger Task, aber kritisch für alles Folgende.

4. **Prompt-Veredler ist konzeptionell klar, aber nicht begonnen** — alle anderen Features können vorlaufen. Er ist die Middleware, die das System intelligent macht. Technisch komplex, strategisch zentral, nicht im MVP-kritischen Pfad.

5. **Community-Features sind Langfristgedanken** — Skill-Tabelle existiert. Community-UI nicht. Das ist Year 2 Growth-Feature, nicht MVP.
