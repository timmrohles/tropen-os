# Tropen OS — ARCHITECT.md
> System-Architekt-Referenz. Ergänzt CLAUDE.md (Engineering Guidelines).
> Stand: 2026-03-17

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

## Zweck dieses Dokuments

ARCHITECT.md ist die Referenz für Architektur-Entscheidungen, Build-Reihenfolge
und den Kontext den Claude Code braucht um konsistente Entscheidungen zu treffen.

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
9. docs/webapp-manifest/audit-report-2026-03-13.md ← Letzter Audit-Stand
```

### Design-Standards (bei jedem Feature mit UI)
```
10. CLAUDE.md → Abschnitt "Komponenten-Patterns"   ← verbindliche Klassen
11. CLAUDE.md → Abschnitt "Code-Regeln"            ← Farb-Variablen, Inline-Styles
12. CLAUDE.md → Abschnitt "Content-Breiten"        ← .content-max etc.
13. CLAUDE.md → Abschnitt "Drawer-System"          ← Drawer-Konventionen
14. CLAUDE.md → Abschnitt "Webstandards & Barrierefreiheit"
```

### Produkt & Strategie (bei neuen Features)
```
15. docs/product/                                  ← Produktdokumente
16. docs/superpowers/                              ← Feature-Konzepte
17. docs/plans/                                    ← detaillierte Pläne
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

## Design-System Referenz

> **Primäre Quelle:** `CLAUDE.md` → Abschnitte
> "Komponenten-Patterns", "Code-Regeln", "Content-Breiten",
> "Drawer-System", "Webstandards & Barrierefreiheit"
>
> **Sekundäre Quelle:** `docs/webapp-manifest/engineering-standard.md`
> → Kategorie 15 (Design System) + Kategorie 16 (Accessibility)
>
> **Audit-Referenz:** `docs/webapp-manifest/audit-report-2026-03-13.md`
> → Aktuelle Scores für Design System (4/5) und Accessibility (2/5)
> → Accessibility ist kritisch: BFSG gilt seit 28.06.2025

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

---

## Architektur-Übersicht

### System-Ebenen

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js App Router)              │
│  /app → Pages only                          │
│  /components → UI-Komponenten               │
│  /lib → Business-Logik, Resolver            │
├─────────────────────────────────────────────┤
│  API Routes (/app/api/**)                   │
│  Zod-Validierung → supabaseAdmin → DB       │
├─────────────────────────────────────────────┤
│  Supabase (Postgres + RLS + Auth)           │
│  Migrations: supabase/migrations/           │
├─────────────────────────────────────────────┤
│  Anthropic API (direkt, kein Dify)          │
│  Capability Resolver → Modell-Auswahl       │
└─────────────────────────────────────────────┘
```

### Rollen-Hierarchie

```
Superadmin (Timm)
└── Organizations
    ├── OrgRole: owner | admin | member | viewer
    └── Departments (ex-Workspaces)
        └── WorkspaceRole: admin | member | viewer
```

### Capability + Outcome System

```
User wählt Capability + Outcome
       ↓
capability-resolver.ts → resolveWorkflow()
       ↓
WorkflowPlan: { model_id, system_prompt, tools, card_type }
       ↓
LLM-Call (Anthropic / OpenAI)
       ↓
Artefakt / Workspace-Karte / Feed-Output
```

---

## Governance-Entscheidungen

| Entscheidung | Begründung | Stand |
|-------------|-----------|-------|
| Kein Dify für neue Features | Anthropic API direkt, mehr Kontrolle | 2026-03-16 |
| supabaseAdmin für alle API-Queries | Drizzle funktioniert nicht für Queries | Permanent |
| Capability + Outcome als Routing-Layer | Ersetzt Dify Workflows | 2026-03-17 |
| Guided Workflows max. 3 Ebenen | Kein Labyrinth, immer Escape-Option | 2026-03-17 |
| Claude.ai Feature-Parität via API | Modell-Features kommen automatisch | 2026-03-17 |

---

## Datei-Index (Stand März 2026)

Vollständiger Index aller relevanten Projektdateien:

### Root
```
ARCHITECT.md          ← System-Architekt (dieses Dokument)
CLAUDE.md             ← Hauptreferenz für Claude Code
```

### docs/
```
architect-log.md           ← Entscheidungsprotokoll
phase2-plans.md            ← Build-Reihenfolge Plan C–J
project-state.md           ← Projektstatus
tropen-os-architektur.md   ← Gesamtarchitektur
email-setup.md             ← E-Mail / Resend Setup
dify-jungle-order-setup.md ← Dify Jungle Order
github-secrets.md          ← GitHub Secrets Dokumentation
```

### docs/webapp-manifest/
```
manifesto.md               ← 10 Prinzipien
engineering-standard.md    ← 25 Kategorien mit Regeln
audit-system.md            ← Scoring-Modell
audit-report-2026-03-13.md ← Letzter Audit (45.7% → Prototype)
audit-report-template.md   ← Template für nächsten Audit
```

### docs/plans/
```
← Detaillierte Feature-Pläne (siehe Ordner)
```

### docs/product/
```
← Produktdokumente (siehe Ordner)
```

### docs/superpowers/
```
← Feature-Konzepte inkl. Perspectives-Konzept
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
001–033  ← deployed und live
034+     ← pending oder in Planung
Vollständige Übersicht: CLAUDE.md → Migrations-Übersicht
```
