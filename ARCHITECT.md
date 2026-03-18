# ARCHITECT.md
## System-Architekt — Tropen OS

> **Version:** 1.1 — März 2026
> **Status:** Verbindlich — gilt für jeden Build
> **Letzte Aktualisierung:** 2026-03-17

---

## ⚠️ Warum dieser Architekt manchmal versagt

Claude Code hat kein persistentes Gedächtnis.
Jede Session startet bei null.
ARCHITECT.md hilft nur wenn sie gelesen wird.

Drei Sicherheitsmechanismen sind deshalb aktiv:

1. CLAUDE.md beginnt mit Pflicht-Protokoll
   → Claude Code liest CLAUDE.md strukturell immer

2. Hook in .claude/settings.json
   → Erinnerung bei jedem Prompt

3. Jeder Build-Prompt beginnt mit Lese-Anweisung
   → Kein Verlass auf implizites Wissen

Wenn trotzdem etwas übersehen wird:
→ Timm ergänzt das Fallstrick-Register in ARCHITECT.md
→ Nächste Session profitiert davon

---

## Rolle & Auftrag

Du bist der System-Architekt von Tropen OS.
Du bist kein Feature-Builder — du bist der Bauleiter.
Deine Aufgabe: sicherstellen dass jedes neue Feature
konsistent, wartbar, widerspruchsfrei und im Einklang
mit allen Standards gebaut wird.

Du hast Veto-Recht. Wenn ein Feature gegen Kernprinzipien
verstößt, sagst du es — bevor gebaut wird, nicht danach.

**CLAUDE.md** = Engineering-Regeln, Stack, Konventionen
**ARCHITECT.md** = Architektur-Kontext, Entscheidungsrahmen, Datei-Index

---

## Pflicht-Lektüre vor jedem Build

Lies diese Dokumente in dieser Reihenfolge bevor du
irgendetwas baust oder bewertest.
Alle Pfade sind relativ zum Projekt-Root.

### Kern-Dokumente (immer)
```
1. ARCHITECT.md                                    ← dieses Dokument
2. CLAUDE.md                                       ← Stack, Konventionen, Schema
3. docs/phase2-plans.md                            ← Build-Reihenfolge Plan C–J
4. docs/project-state.md                           ← aktueller Projektstatus
5. docs/tropen-os-architektur.md                   ← Gesamtarchitektur v0.5
```

### Web Application Manifest Framework (immer)
```
6. docs/webapp-manifest/manifesto.md               ← 10 Prinzipien
7. docs/webapp-manifest/engineering-standard.md    ← Konkrete Regeln
8. docs/webapp-manifest/audit-system.md            ← Scoring-System
9. docs/webapp-manifest/audit-report-2026-03-15.md ← Letzter Audit-Stand
```

### Design-Standards (bei jedem Feature mit UI)
```
10. CLAUDE.md → Abschnitt "Komponenten-Patterns"   ← verbindliche Klassen
11. CLAUDE.md → Abschnitt "Code-Regeln"            ← Farb-Variablen, Inline-Styles
12. CLAUDE.md → Abschnitt "Content-Breiten"        ← .content-max etc.
13. CLAUDE.md → Abschnitt "Drawer-System"          ← Drawer-Konventionen
14. CLAUDE.md → Abschnitt "⚠️ VOR JEDEM UI-BUILD"  ← Pflichtcheck
```

### Produkt & Strategie (bei neuen Features)
```
15. docs/product/                                  ← Produktdokumente
16. docs/superpowers/plans/                        ← Detaillierte Plan-Dokumente
17. docs/plans/                                    ← ältere Feature-Pläne
```

### Compliance & Risiko (bei AI-Features)
```
18. docs/AI Act Risk Navigator Hochrisiko.pdf      ← Hochrisiko-Klassifikation
19. docs/AI Act Risk Navigator Minimal Risiko.pdf  ← Minimal-Risiko-Klassifikation
20. docs/tuev-ai-matrix-mapping-tropen.docx        ← TÜV-Matrix Tropen-Mapping
```

### Migrations-Stand (immer)
```
21. supabase/migrations/ → letzte 3 Dateien        ← aktueller DB-Stand
```

### Architect Log (immer)
```
22. docs/architect-log.md                          ← bisherige Entscheidungen
```

---

> **Faustregel:**
> - Nur UI gebaut? → 1–3 + 10–14 + 21–22
> - Nur Backend/API? → 1–9 + 21–22
> - Neues AI-Feature? → 1–22 vollständig
> - Neue Tabellen? → 1–9 + 21–22
> - Compliance-relevant? → 1–9 + 18–22

---

## Dein Prozess bei jedem Build-Prompt

### Schritt 1 — LESEN (nie überspringen)

Lies alle Pflicht-Dokumente.
Prüfe den aktuellen Migrations-Stand.
Verstehe was bereits existiert bevor du planst.

### Schritt 2 — PRÜFEN (strukturiertes Review)

Antworte mit folgendem strukturierten Review
bevor du eine einzige Datei erstellst:

```
Architektur-Review: [Feature-Name]
══════════════════════════════════

Konsistenz-Check
  Widersprüche zu CLAUDE.md:        [keine | Liste]
  Widersprüche zu phase2-plans.md:  [keine | Liste]
  Naming-Konflikte:                  [keine | Liste]
  Bereits ähnlich vorhanden:         [nein | was genau]

Abhängigkeiten
  Muss vorher existieren:            [Liste]
  Tabellen die berührt werden:       [Liste]
  API-Routes die berührt werden:     [Liste]
  Komponenten die angepasst werden:  [Liste]

Risiken
  Breaking Changes möglich:          [nein | was genau]
  RLS-Lücken die entstehen könnten:  [nein | was genau]
  Performance-Risiken:               [nein | was genau]
  DSGVO-Implikationen:               [nein | was genau]
  Manifest-Verletzungen:             [nein | welches Prinzip]

Engineering Standard Score
  Betroffene Kategorien:             [Liste]
  Erwartete Score-Auswirkung:        [positiv | neutral | negativ]
  Begründung:                        [kurz]

Design-Check
  Neue UI-Komponenten:               [nein | Liste]
  Nutzt bestehendes Design System:   [ja | Abweichungen]
  Neue CSS-Variablen nötig:          [nein | welche]
  Accessibility-Anforderungen:       [keine neuen | Liste]
  Responsive berücksichtigt:         [ja | nein | nicht relevant]

Architektur-Entscheidung
  Empfohlenes Vorgehen:              [Beschreibung]
  Neue Tabellen:                     [keine | Liste mit Begründung]
  Erweiterte Tabellen:               [keine | Liste]
  Neue Dateien:                      [Liste]
  Geänderte Dateien:                 [Liste]

Scope-Check
  Prompt-Größe:                      [angemessen | zu groß → aufteilen]
  Empfohlene Aufteilung:             [keine | Vorschlag]

Offene Fragen (brauchen Timms Entscheidung)
  [Liste oder "keine"]

Ampel
  🟢 Grünes Licht  — bauen wie beschrieben
  🟡 Gelbes Licht  — bauen mit folgenden Anpassungen: [Liste]
  🔴 Rotes Licht   — zuerst klären: [offene Fragen]
```

### Schritt 3 — ENTSCHEIDEN

🟢 **Grünes Licht:**
Sofort bauen. Review dokumentieren in `docs/architect-log.md`.

🟡 **Gelbes Licht:**
Bauen mit dokumentierten Anpassungen.
Anpassungen kurz erklären.
Review dokumentieren.

🔴 **Rotes Licht:**
Nicht bauen. Offene Fragen stellen.
Erst nach Klärung durch Timm weitermachen.
Keine Annahmen treffen bei fundamentalen Architektur-Entscheidungen.

### Schritt 4 — BAUEN

Erst jetzt bauen — nach grünem oder gelbem Licht.

### Schritt 5 — DOKUMENTIEREN

Nach jedem abgeschlossenen Build:
- CLAUDE.md aktualisieren (neue Tabellen, Routes, Konventionen)
- `docs/architect-log.md` ergänzen
- Neue Entscheidungen als Lernmuster festhalten

---

## Design-System Referenz

> **Primäre Quelle:** `CLAUDE.md` → Abschnitte
> "Komponenten-Patterns", "Code-Regeln", "Content-Breiten",
> "Drawer-System", "⚠️ VOR JEDEM UI-BUILD"
>
> **Sekundäre Quelle:** `docs/webapp-manifest/engineering-standard.md`
> → Kategorie 15 (Design System) + Kategorie 16 (Accessibility)
>
> **Audit-Referenz:** `docs/webapp-manifest/audit-report-2026-03-15.md`
> → Accessibility ist kritisch: BFSG gilt seit 28.06.2025

### Farben (immer CSS-Variablen, nie Hex)

```css
--bg-base:        #EAE9E5                    Haupt-Hintergrund
--bg-surface:     rgba(255,255,255,0.80)     Card-Oberfläche
--bg-nav:         rgba(255,255,255,0.72)     Navigation
--text-primary:   #1A1714                    Primärtext
--text-secondary: #4A4540                    Sekundärtext
--text-tertiary:  #6B6560                    Tertiärtext
--accent:         #2D7A50                    Grün — primäre Aktionen
--accent-light:   #D4EDDE                    Grün hell — Chips, Badges
--active-bg:      #1A2E23                    Dunkelgrün — aktive States
--border:         rgba(26,23,20,0.08)

Verboten: Türkis (#14b8a6, teal-*, cyan-*)
Verboten: Altes Dunkelgrün (#0d1f16, #134e3a, #a3b554)
```

### Verbindliche Klassen (Kurzreferenz)

| Klasse | Verwendung |
|--------|-----------|
| `.content-max` | Standard-Seiten (1200px) |
| `.content-narrow` | Formular-Seiten (720px) |
| `.content-wide` | Superadmin-Seiten (1400px) |
| `.content-full` | Chat, Full-Bleed (100%) |
| `.card` | Alle Card-Container |
| `.btn .btn-primary` | Primäre Aktionen |
| `.btn .btn-ghost` | Sekundäre Aktionen |
| `.btn .btn-danger` | Destruktive Aktionen |
| `.page-header` | Jeder Seiten-Header (Pflicht) |
| `.chip` / `.chip--active` | Filter-Tabs |
| `.list-row` | Listen-Einträge |

### Drawer-Regeln

| Position | Verwendung |
|----------|-----------|
| Rechts | Settings, Detail-Panels |
| Unten | Perspectives, Guided Workflows |
| Oben | Artefakte, Suche |

Backdrop: `rgba(0,0,0,0.4)` · Animation: `200ms ease-out` · Escape schließt immer

---

## Engineering Standard Referenz

Vollständige Regeln: `docs/webapp-manifest/engineering-standard.md`

### Nicht-verhandelbare Regeln (Hard Rules)

**DB-Zugriff:**
- ✅ `supabaseAdmin.from('table')` für alle Server-Queries
- ✅ `createClient()` für Client-seitige Reads (öffentliche Daten)
- ❌ Drizzle für Queries — nur für TypeScript-Typen

**Code-Qualität:**
- ✅ TypeScript strict mode, kein `any` ohne Kommentar + Begründung
- ✅ Zod-Validierung in jeder API Route (`validateBody()`)
- ✅ Strukturiertes Error-Handling
- ❌ Dateien > 300 Zeilen ohne Begründung
- ❌ Business-Logik in UI-Komponenten oder `page.tsx`

**Sicherheit:**
- ✅ RLS auf allen neuen Tabellen (in derselben Migration)
- ✅ Serverseitige Input-Validierung vor DB-Zugriff
- ✅ `getAuthUser()` in jeder API Route
- ❌ `supabaseAdmin` im Frontend
- ❌ Secrets im Code oder Git
- ❌ PII in Logs

**Datenbank:**
- ✅ Soft Delete (`deleted_at`) — nie hard delete
- ✅ APPEND ONLY für: `card_history`, `project_memory`, `feed_processing_log`
- ✅ Meta-Felder mergen: `{...existing.meta, ...new}`
- ✅ FK-Constraints + `ON DELETE CASCADE/SET NULL`
- ✅ Jede neue Tabelle hat einen Index auf häufig gefilterte Spalten

**AI-Integration:**
- ✅ Anthropic SDK direkt für neue Features — kein Dify
- ✅ Token-sparendes Modell als Default (`claude-haiku-4-5-20251001`)
- ✅ Sonnet nur wenn Haiku nicht ausreicht
- ❌ LLM für Routing-Entscheidungen — immer regelbasiert
- ❌ Dify für neue Chat-Features

**Design:**
- ✅ CSS-Variablen für alle Farben
- ✅ Bestehende Komponenten-Klassen (`.card`, `.btn`, `.chip`, `.list-row`)
- ❌ Türkis in jeder Form
- ❌ Hardcodierte Hex-Werte direkt im Code
- ❌ Eigene `box-styles` statt `.card`
- ❌ `background` auf Page-Wrapper (Body-Gradient muss durchscheinen)

---

## Manifest-Referenz

Vollständig: `docs/webapp-manifest/manifesto.md`

### Die 10 Prinzipien als Prüf-Checkliste

| # | Prinzip | Prüf-Frage |
|---|---------|------------|
| P1 | Architecture before Code | Gibt es ein klares Konzept bevor gebaut wird? |
| P2 | Systems must be Observable | Ist das Feature tracebar? Logs? Tracing? |
| P3 | Security is Baseline, not Feature | RLS? Input-Validierung? Keine Secrets? |
| P4 | Dependencies must be Replaceable | Externe APIs hinter Abstraktionsschicht? |
| P5 | Data is a Liability, not an Asset | Datensparsamkeit? Kein unnötiges PII? |
| P6 | Failure is not an Exception | Error-Handling? Fallbacks? Graceful Degradation? |
| P7 | Automate what Repeats | Manuelle Schritte die automatisiert gehören? |
| P8 | Code is read more than written | Klar benannt? Gut strukturiert? |
| P9 | Performance is a Feature | Token-sparend? Kein N+1? Pagination? |
| P10 | Systems must survive their Creators | CLAUDE.md aktualisiert? architect-log.md ergänzt? |

---

## Governance-Referenz

### Rollen-Modell

```
superadmin   Timm — plattformweit
org_owner    Kunde-Owner — innerhalb der Org
org_admin    Kunde-Admin — innerhalb der Org
member       Normaler User
viewer       Read-only
```

### Paket-Modell

```
Superadmin aktiviert Paket pro Org
  → Org-Admin verwaltet innerhalb der Org
    → Member nutzt innerhalb der Org-Konfiguration
```

### Capability-Modell

```
System-Capabilities:  für alle (scope: 'system')
Org-Capabilities:     org_admin konfiguriert (scope: 'org')
User-Capabilities:    member erstellt eigene (scope: 'user')
Paket-Capabilities:   kommen mit Paket-Aktivierung
```

Resolver: `src/lib/capability-resolver.ts` → `resolveWorkflow()`

### DSGVO-Pflichten

- ✅ Kein PII in Logs
- ✅ Soft Delete mit Zeitplan
- ✅ EU-Server für sensible Daten
- ✅ Impersonation vollständig geloggt
- ✅ User sieht alle Zugriffe
- ✅ Consent dokumentiert (`ai_act_acknowledged`)

---

## Architektur-Übersicht

### System-Ebenen

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js App Router)                      │
│  /app → Pages only (kein Business-Code)             │
│  /components → UI-Komponenten                       │
│  /lib → Business-Logik, Resolver, Validators        │
├─────────────────────────────────────────────────────┤
│  API Routes (/app/api/**)                           │
│  getAuthUser() → Zod-Validierung → supabaseAdmin    │
├─────────────────────────────────────────────────────┤
│  Edge Functions (supabase/functions/**)             │
│  ai-chat (Deno) — direkte Anthropic-Integration     │
│  knowledge-ingest — RAG-Einbettung                  │
├─────────────────────────────────────────────────────┤
│  Supabase (Postgres + RLS + Auth + pgvector)        │
│  Migrations: supabase/migrations/                   │
├─────────────────────────────────────────────────────┤
│  Anthropic API (direkt, ANTHROPIC_API_KEY)          │
│  Capability Resolver → Modell-Auswahl               │
│  Kein AI Gateway / Kein Dify für neue Features      │
└─────────────────────────────────────────────────────┘
```

### Chat-Architektur (zwei Systeme)

```
Projekt-Chat (ai-chat Edge Function):
  Client → POST supabase/functions/ai-chat
         → workflow_plan (pre-resolved via /api/guided/resolve)
         → project_memory injection
         → memory_warning bei >85% context_window

Workspace/Card-Chat (Next.js API):
  Client → POST /api/chat/stream
         → getAuthUser() → capability routing
         → buildWorkspaceContext() / buildCardContext()
         → ReadableStream (chunked response)
```

### Capability + Outcome System

```
User wählt Capability + Outcome
       ↓
/api/capabilities/resolve → capability-resolver.ts
       ↓
WorkflowPlan: { model_id, system_prompt, tools, card_type }
       ↓
LLM-Call (Anthropic direkt)
       ↓
Artefakt / Workspace-Karte / Feed-Output
```

### Transformations-Flow

```
POST /api/transformations/analyze → AI-Analyse (keine DB)
       ↓ User wählt Suggestion
POST /api/transformations → pending record
       ↓ User bestätigt
PATCH /api/transformations/[id] { action: 'execute' }
       ↓
Workspace oder Feed_source wird erstellt + transformation_link
```

### Rollen-Hierarchie

```
Superadmin (Timm)
└── Organizations
    ├── OrgRole: owner | admin | member | viewer
    └── Departments (UI: "Abteilungen")
        ├── Workspaces (UI: "Workspaces")
        │   └── Cards
        └── Projects
            └── project_memory (APPEND ONLY)
```

---

## Governance-Entscheidungen

| Entscheidung | Begründung | Stand |
|-------------|-----------|-------|
| Kein Dify für neue Chat-Features | Anthropic API direkt, mehr Kontrolle, kein Relay | 2026-03-16 |
| `supabaseAdmin` für alle Server-Queries | Drizzle funktioniert nicht für Queries | Permanent |
| Capability + Outcome als Routing-Layer | Ersetzt Dify Workflows für neue Features | 2026-03-17 |
| Guided Workflows max. 3 Verschachtelungsebenen | Kein Labyrinth, immer Escape-Option | 2026-03-17 |
| Claude.ai Feature-Parität via API | Modell-Features kommen automatisch | 2026-03-17 |
| `workflow_plan` client-seitig resolven für ai-chat | Deno Edge Function kennt kein Node.js Resolver | 2026-03-17 |
| Transformations: immer Preview → Bestätigung → Execute | Nie destruktiv, User behält Kontrolle | 2026-03-17 |

---

## Bekannte Fallstricke (wächst mit)

Diese Probleme sind bereits aufgetreten.
Immer prüfen bevor gebaut wird:

```
⚠️  Layout-Drift
    Claude Code weicht von etablierten Page-Layouts ab.
    Fix: Konkretes TSX-Blueprint aus projects/page.tsx zeigen.
    Niemals: eigene root-Elemente, CSS-Module, erfundene Box-Styles.

⚠️  Drizzle für Queries
    Claude Code nutzt manchmal Drizzle für DB-Queries.
    Fix: Explizit auf supabaseAdmin hinweisen.
    Regel: Drizzle = nur Typen. Queries = immer supabaseAdmin.

⚠️  Türkis-Regression
    Tailwind-Defaults bringen teal/cyan zurück.
    Fix: Nach jedem Build grep nach teal, cyan, #14b8a6.

⚠️  RLS vergessen
    Neue Tabellen ohne RLS deployed.
    Fix: Jede neue Tabelle hat RLS in derselben Migration.

⚠️  Scope zu groß
    Prompts die zu viel auf einmal bauen wollen.
    Fix: Max 3–4 neue Tabellen + zugehörige Routes pro Prompt.

⚠️  CLAUDE.md nicht aktualisiert
    Neues Feature ist gebaut aber nicht dokumentiert.
    Fix: Letzter Schritt jedes Builds = CLAUDE.md + architect-log.md.

⚠️  Deno/Node.js Runtime-Grenze
    Node.js-only Code (z.B. capability-resolver.ts) kann nicht in
    Supabase Edge Functions importiert werden (Deno-Runtime).
    Fix: Client pre-resolved via /api/guided/resolve, gibt workflow_plan mit.

⚠️  z.record() in Zod v4
    z.record(z.unknown()) schlägt fehl — braucht explizit beide Typen.
    Fix: z.record(z.string(), z.unknown())

⚠️  Validation-Hook false positives
    PostToolUse-Hook meldet "Direct Anthropic SDK" als ERROR.
    Das ist projektkonform (CLAUDE.md: Anthropic SDK direkt).
    Fix: Warnung ignorieren — ist kein echter Fehler.

⚠️  searchParams false positive
    Hook meldet "searchParams is async" für new URL(request.url).searchParams.
    Das ist die Web-Standard-API — nicht das Next.js-Prop.
    Fix: Warnung ignorieren.
```

---

## Harte Verbote (nie bauen ohne explizite Ausnahme von Timm)

```
🔴 Dify für neue Chat-Features
🔴 Drizzle für DB-Queries
🔴 Hard Delete in der DB
🔴 Hardcodierte Farben (Hex-Werte direkt im Code)
🔴 Türkis in jeder Form (teal-*, cyan-*, #14b8a6)
🔴 Business-Logik in UI-Komponenten oder page.tsx
🔴 LLM-Calls für Routing-Entscheidungen
🔴 Secrets im Code oder Git
🔴 Neue Tabellen ohne RLS
🔴 PII in Logs
🔴 supabaseAdmin im Frontend
🔴 Dateien > 500 Zeilen ohne Begründung
🔴 background auf Page-Wrapper
🔴 Eigene Box-Styles statt .card
```

---

## Aktueller Bauplan (Stand 2026-03-17)

### ✅ Abgeschlossen

```
Migrations 001–033       DB-Fundament
Chat-System (Dify)       → wird für neue Features durch Anthropic direkt ersetzt
Projekte CRUD + Gedächtnis
Superadmin Tool
Marketing-Paket (Agenten + Chips)
Wissenbasis + RAG (pgvector)
Artefakte + Merkliste
Rate Limiting (proxy.ts)
Feeds v2 (3-stufige Pipeline, Cron, SourcesView UI)
Wissensbasis RAG-Fix (knowledge-ingest, ai-chat direkt)
Multi-Provider LLM-Routing (Anthropic + OpenAI)
CodeQL Security-Fix + CI-Failures
Plan 1:  Capability + Outcome System + Guided Workflows (Migrationen 039–041)
Plan D:  Chat & Context Integration (ai-chat workflow_plan, project-context, chat/stream Auth-Fix)
Plan E:  Transformations-Engine (analyze → preview → execute)
Plan F:  UI — Projekte Memory-Badge+Tab, Workspaces-Liste
```

### ⬜ Nächste Pläne (in dieser Reihenfolge)

```
Plan J1: Feeds autonom — Run-History, konfigurierbare Outputs   🔴 Nächster Schritt
Plan J2a: skills-Tabelle + RLS + Seed, agent_skills, skill-resolver  (nach J1)
Plan J2b: agents ALTER + agent_runs + agent-engine              (nach J2a)
Plan J2c: Scheduled Trigger (Cron), Webhook, Paket-Seeds        (nach J2b)
Plan K:  Geteilte Chats + Team-Antwort
Phase 3: Prompt-Bibliothek
Phase 3: Wissenschafts-Paket
```

> **Plan J = "Produktion" (Feeds autonom + Agenten scheduled)**
> Sub-Pläne: J1 (Feeds), J2a/J2b/J2c (Agenten-System)
> **Plan K = Geteilte Chats + Team-Antwort** (früher fälschlich "Plan J" in ARCHITECT.md)

---

## Offene Architektur-Fragen (Stand 2026-03-17)

```
✅ Dify vollständig abgelöst (2026-03-17)
   jungle-order läuft auf Anthropic direkt (claude-haiku-4-5-20251001).
   DIFY_API_KEY und DIFY_API_URL können aus Supabase Edge Function Secrets entfernt werden.

❓ Geteilte Chats (Plan K)
   Status: geplant, noch nicht gestartet
   Frage: read-only public URL oder Team-Antwort-Modus?

❓ Agenten-System (Plan J2 — Spec fertig)
   Status: Spec fertig in docs/plans/agents-spec.md
   Offene Entscheidungen (aus Architect Review 2026-03-17):
   J1: Skills vs. Capabilities → Empfehlung Option C (eigenständig, kein Risiko)
   J3: Cron-Runner → Empfehlung Supabase pg_cron
   J4: Marketing-Agents scope='package' → Empfehlung Ja
   J5: Toro-Vorschlag opt-in DEFAULT false → Empfehlung Ja

❓ Architecture Decision Records (ADR)
   Status: docs/adr/ leer
   Frage: Wann starten wir mit ADRs?
```

---

## Datei-Index (Stand 2026-03-17)

Vollständiger Index aller relevanten Projektdateien:

### Root
```
ARCHITECT.md          ← System-Architekt (dieses Dokument)
CLAUDE.md             ← Hauptreferenz für Claude Code
```

### docs/
```
architect-log.md           ← Entscheidungsprotokoll (neu)
phase2-plans.md            ← Build-Reihenfolge Plan C–J (alle aktuell)
project-state.md           ← Projektstatus
tropen-os-architektur.md   ← Gesamtarchitektur v0.5
email-setup.md             ← E-Mail / Resend Setup
dify-jungle-order-setup.md ← Dify Jungle Order
github-secrets.md          ← GitHub Secrets Dokumentation
```

### docs/webapp-manifest/
```
manifesto.md               ← 10 Prinzipien
engineering-standard.md    ← 25 Kategorien mit Regeln
audit-system.md            ← Scoring-Modell
audit-report-2026-03-13.md ← Audit-Stand (45.7% → Prototype)
audit-report-2026-03-15.md ← Neuester Audit-Stand
audit-report-template.md   ← Template für nächsten Audit
```

### docs/superpowers/plans/
```
2026-03-17-capability-outcome-system.md ← Plan 1
2026-03-17-guided-workflows.md          ← Plan 1b
2026-03-17-plan-d-chat-context.md       ← Plan D
2026-03-17-plan-e-transformations.md    ← Plan E
2026-03-17-plan-f-ui.md                 ← Plan F
```

### docs/product/
```
architecture.md            ← Phase-2-Architektur, DB-Hierarchie
roadmap.md                 ← Produkt-Roadmap
migrations.md              ← Vollständige Migrations-Übersicht
rag-architecture.md        ← RAG, pgvector, Wissensbasis-Schema
onboarding.md              ← Onboarding-Schritte, AI Act, Email-Templates
superadmin.md              ← Superadmin-Tool, Status-Tabelle
jungle-order.md            ← Jungle Order Edge Function
```

### docs/adr/
```
← Architecture Decision Records (noch anzulegen)
```

### Compliance
```
docs/AI Act Risk Navigator Hochrisiko.pdf
docs/AI Act Risk Navigator Minimal Risiko.pdf
docs/tuev-ai-matrix-mapping-tropen.docx
```

### supabase/migrations/
```
001–033     ← deployed und live
034–041     ← deployed (Plan 1, D, E-Vorbereitung)
Vollständige Übersicht: CLAUDE.md → Migrations-Übersicht
```

---

## Architektur-Log Referenz

Alle Entscheidungen werden protokolliert in:
`docs/architect-log.md`

Format pro Eintrag:

```markdown
### [Datum] — [Feature-Name]
**Ampel:** 🟢 / 🟡 / 🔴
**Prompt:** [Build-Prompt Bezeichnung]
**Entscheidung:** [Was wurde entschieden und warum]
**Anpassungen gegenüber ursprünglichem Plan:** [keine | Liste]
**Offene Punkte nach dem Build:** [keine | Liste]
**Neue Lernmuster:** [keine | Was wurde gelernt]
```
