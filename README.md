# Tropen OS

Code Quality Platform für Vibe-Coded Apps. Automatisiertes Audit-System mit Multi-Model-Review, Fix-Engine und Cockpit-Dashboard.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Supabase** — Auth, Postgres, Edge Functions, Storage
- **Anthropic SDK** — Chat, Audit-Review, Fix-Engine (claude-sonnet-4)
- **Vercel AI Gateway** — Multi-Model-Review Pipeline (Claude, GPT-5.4, Gemini, DeepSeek)
- **pnpm** — Package Manager

## Setup

```bash
pnpm install

# .env.local konfigurieren (Vorlage: .env.example)
cp .env.example .env.local

# Supabase-Schema anwenden
supabase db push

# Dev-Server starten
pnpm dev
```

Pflicht-Env-Variablen: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`

## Audit

```bash
# Standard-Audit (schnell, ohne externe Tools)
pnpm exec tsx src/scripts/run-audit.ts

# Mit externen Tools (depcruise, ESLint, optional Lighthouse)
pnpm exec tsx src/scripts/run-audit.ts --with-tools

# Audit-Dashboard
# → /audit (requires org admin)
```

Audit-Architektur: 25 Kategorien, ~160 Regeln (90 automatisiert / 70 manuell), gewichtetes Scoring 0–100%.

| Score | Status |
|-------|--------|
| 85–100% | Production Grade |
| 70–84% | Stable |
| 50–69% | Risky |
| < 50% | Prototype |

## Edge Functions

```bash
# Nach Änderungen an supabase/functions/ai-chat/index.ts:
supabase functions deploy ai-chat
```

## Deployment

Vercel — automatisch bei Push auf `main`. Kein manueller Build-Step.

```bash
# Env-Variablen lokal holen
vercel env pull .env.local
```

## Docs

| Datei | Inhalt |
|-------|--------|
| `CLAUDE.md` | Vollständige Codebase-Referenz für Claude Code |
| `ARCHITECT.md` | System-Architekt-Review-Protokoll |
| `docs/webapp-manifest/engineering-standard.md` | 25 Audit-Kategorien mit Regeln |
| `docs/webapp-manifest/audit-system.md` | Scoring-System |
| `docs/product/migrations.md` | Vollständige DB-Migrations-Übersicht |
| `docs/runbooks/` | Incident Response, Rollback, Disaster Recovery |
| `docs/agents/` | 21 Agent Rule Packs (Multi-Model-Komitee) |
