---
status: active
updated: 2026-05-07
review_by: 2026-08-07
supersedes: []
---

# Tropen OS

Production Readiness Platform für Vibe-Coded Apps. Automatisiertes Audit-System mit umfangreichem Regelwerk (Kategorie-Details: `CLAUDE.md`), Multi-Model-Komitee-Agenten (Details: `docs/agents/`), Fix-Engine und interaktivem Dashboard — gebaut für Teams die schnell bauen und trotzdem production-grade bleiben wollen.

## Was es tut

1. **Audit** — scannt dein Repo gegen mehrere Kategorien (Architektur, Sicherheit, Testing, DSGVO, KI-Compliance …) und gibt einen gewichteten Score zurück
2. **Fix-Engine** — generiert Cursor-/Claude-Prompts pro Finding zum manuellen Einsetzen in der IDE. Konsens-Fix-Engine (4-Modell-Komitee mit automatischer Code-Anwendung) wurde 2026-04-25 deaktiviert (siehe Tag-4-Pivot). Aktiv ist: Prompt-Export. Geplant ist: Re-Aktivierung mit Approval-Flow (Roadmap Q3+).
3. **Cockpit** — interaktives Dashboard mit Score-Trend, Quick-Wins und Task-Tracking
4. **Externes Projekt scannen** — verbindet jeden lokalen Ordner via File System Access API und scannt ihn in-memory (kein Upload)
5. **Benchmark** — vergleicht gegen öffentliche Repos aus verschiedenen Kategorien (Lovable, Bolt, Cursor, Manuals)

## Stack

| Schicht | Technologie |
|---------|-------------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript strict |
| Auth & DB | Supabase (Postgres, RLS, Edge Functions, Storage) |
| KI | Anthropic SDK — Chat, Review, Fix (claude-sonnet-4) |
| Multi-Model | Vercel AI Gateway — Claude, GPT-5.4, Gemini 2.5 Pro, DeepSeek |
| Styling | Tailwind 3 + CSS Custom Properties (Design System) |
| Package Manager | pnpm |
| Deployment | Vercel (automatisch bei Push auf `main`) |

## Setup

```bash
pnpm install

# Env-Vorlage kopieren und ausfüllen
cp .env.example .env.local

# Pflicht-Variablen:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# ANTHROPIC_API_KEY
# AI_GATEWAY_API_KEY (Vercel AI Gateway)

# Supabase-Schema anwenden
supabase db push

# Dev-Server starten
pnpm dev
```

## Audit

```bash
# Standard-Audit (schnell, ohne externe Tools)
pnpm exec tsx src/scripts/run-audit.ts

# Mit externen Tools (depcruise, ESLint, Bundle-Analyse, optional Lighthouse)
pnpm exec tsx src/scripts/run-audit.ts --with-tools --lighthouse-url http://localhost:3000

# Lint-Suite (Design System, Feature Guards, Rule-ID-Konsistenz)
pnpm lint:all
```

Audit-Architektur: gewichtetes Scoring über mehrere Kategorien, automatisierte und manuelle Prüfungen.
Scoring-Logik und Bewertungsstufen: `docs/active/audit-system.md`

Tropen OS läuft kontinuierlich gegen den eigenen Audit (Dogfooding).

## Backup & Disaster Recovery

Backup: Supabase PITR aktiv (Pro-Plan), tägliche Snapshots, 30-Tage-Retention.
Restore-Test: offen (Backlog).

## Deployment

Vercel — automatisch bei Push auf `main`.

```bash
# Env-Variablen lokal synchronisieren
vercel env pull .env.local

# Edge Function deployen (nach Änderungen an supabase/functions/ai-chat/index.ts)
supabase functions deploy ai-chat
```

## CI / Linting

```bash
pnpm lint             # ESLint
pnpm lint:design      # Design-System-Regeln (Hex-Farben, Icons, Button-Klassen)
pnpm lint:deps        # Dependency-Cruiser (zirkuläre Abhängigkeiten)
pnpm lint:features    # Feature-Guard-Checks
pnpm lint:rule-ids    # Audit Rule-ID-Konsistenz (verhindert copy-paste Bugs)
pnpm lint:all         # Alle oben zusammen
tsc --noEmit          # TypeScript strict check
```

## Projektstruktur

```
src/
  app/          Routing (Next.js App Router) — kein Business-Code
  components/   Shared UI-Komponenten
  lib/          Business-Logik, LLM-Layer, Audit-Engine, Fix-Engine
  scripts/      CLI-Scripts (Audit, Benchmark, Agenten-Generierung)
supabase/
  functions/    Edge Functions (ai-chat)
  migrations/   DB-Schema (001–113+)
docs/
  active/       Normative Dokumente (Zielbild, Roadmap, Marken-Brief …)
  decisions/    Architecture Decision Records (ADR-001–027)
  archive/      Archivierte Snapshots und veraltete Pläne
  agents/       Agent Rule Packs (Multi-Model-Komitee)
  audit-reports/ Audit-Reports + Benchmark-Ergebnisse
```

## Docs

| Datei | Inhalt |
|-------|--------|
| `CLAUDE.md` | Vollständige Codebase-Referenz für Claude Code (Regelwerk, Kategorien, Scoring) |
| `ARCHITECT.md` | System-Architekt-Review-Protokoll |
| `docs/active/engineering-standard.md` | Audit-Kategorien mit Regeln |
| `docs/active/audit-system.md` | Scoring-System + Gewichtung + Bewertungsstufen |
| `docs/active/migrations.md` | Vollständige DB-Migrations-Übersicht |
| `docs/active/runbook-*.md` | Incident Response, Rollback, Disaster Recovery |
| `docs/agents/` | Agent Rule Packs |
| `docs/active/checker-design-patterns.md` | Strukturelle Checker-Fehlertypen |
| `docs/INDEX.md` | Vollständiger Aktiv-Bestand (Doku-Konvention) |
