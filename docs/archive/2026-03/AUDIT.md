# Tropen AI — Projekt-Audit
Datum: 2026-03-11

## Status-Übersicht

| Bereich | Status | Details |
|---------|--------|---------|
| Testing | ❌ Nicht vorhanden | Kein vitest, jest, @testing-library, playwright installiert |
| Observability | ❌ Nicht vorhanden | Kein OpenTelemetry, Helicone, Sentry |
| LLM SDKs | ⚠️ Partial | Nur `openai ^6.27.0` — kein Anthropic, Gemini, Mistral SDK |
| Auth | ✅ Supabase Auth | `@supabase/ssr ^0.9.0` + `@supabase/supabase-js ^2.49.0` — kein NextAuth/Clerk |
| DB | ✅ Supabase | Supabase (Postgres) mit 26 Migrationen — kein Drizzle, kein Neon |
| CI/CD | ❌ Nicht vorhanden | Kein `.github/workflows/` Verzeichnis |

---

## 1. Installierte Pakete (`package.json`)

### Dependencies
```
@phosphor-icons/react    ^2.1.10
@supabase/ssr            ^0.9.0
@supabase/supabase-js    ^2.49.0
@tremor/react            ^3.18.7   ← Dashboard-Charts
@types/react-syntax-highlighter ^15.5.13
next                     ^16.1.6
openai                   ^6.27.0   ← einziger LLM SDK
react                    ^19.0.0
react-dom                ^19.0.0
react-markdown           ^10.1.0
react-syntax-highlighter ^16.1.1
recharts                 ^3.8.0
remark-gfm               ^4.0.1
```

### DevDependencies
```
eslint, eslint-config-next, eslint-config-prettier, eslint-plugin-prettier
@typescript-eslint/eslint-plugin, @typescript-eslint/parser
autoprefixer, postcss, tailwindcss ^3.4.19
prettier ^3.8.1
typescript ^5
```

### Fehlende Pakete (für QA-Architektur relevant)
| Paket | Zweck | Prio |
|-------|-------|------|
| vitest | Unit-Tests | 🔴 Hoch |
| @testing-library/react | Komponenten-Tests | 🔴 Hoch |
| @playwright/test | E2E-Tests | 🟡 Mittel |
| @sentry/nextjs | Error Monitoring | 🔴 Hoch |
| @anthropic-ai/sdk | Claude direkt (statt Dify) | 🟡 Mittel |
| @google/generative-ai | Gemini direkt | 🟡 Mittel |
| @mistralai/mistralai | Mistral direkt | 🟡 Mittel |

---

## 2. Projektstruktur (`src/`)

```
src/
├── app/
│   ├── admin/
│   │   ├── branding/page.tsx
│   │   ├── budget/page.tsx
│   │   ├── logs/page.tsx
│   │   ├── models/page.tsx
│   │   ├── qa/page.tsx          ← QA Dashboard (Tremor, Mock-Daten)
│   │   └── users/page.tsx
│   ├── api/
│   │   ├── admin/
│   │   │   ├── branding/route.ts
│   │   │   ├── budget/route.ts
│   │   │   ├── logs/route.ts
│   │   │   ├── models/route.ts + [id]/route.ts
│   │   │   └── users/route.ts
│   │   ├── agents/route.ts + [id]/route.ts
│   │   ├── artifacts/route.ts + [id]/route.ts
│   │   ├── bookmarks/route.ts
│   │   ├── knowledge/route.ts
│   │   ├── onboarding/complete/route.ts
│   │   ├── packages/agents/route.ts
│   │   ├── projects/route.ts
│   │   ├── prompt-templates/route.ts + [id]/route.ts
│   │   ├── public/chat/route.ts  ← OpenAI direkt
│   │   ├── search/route.ts
│   │   ├── superadmin/           ← 6 routes
│   │   └── user/impersonation-sessions/route.ts
│   ├── auth/callback/route.ts
│   ├── dashboard/page.tsx
│   ├── knowledge/page.tsx
│   ├── login/, onboarding/, projects/, settings/
│   ├── superadmin/clients/
│   ├── workspace/page.tsx
│   └── workspaces/[id]/page.tsx
├── components/
│   ├── ConditionalNavBar.tsx
│   ├── ImpersonationBanner.tsx
│   ├── NavBar.tsx
│   └── workspace/ (14 Komponenten)
├── hooks/
│   └── useWorkspaceState.ts     ← 1060 Zeilen
├── lib/
│   ├── prompt-templates.ts
│   ├── supabase-admin.ts        ← Service Role Client
│   ├── supabase.ts
│   └── types.ts
├── utils/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── proxy.ts                     ← Auth-Middleware (ehem. middleware.ts)
```

**Nicht vorhanden:** `src/db/`, `src/types/`, `src/scripts/`, `src/test/`

---

## 3. LLM-Integration

### Aktueller Stand

**OpenAI (direkt):**
- Datei: `src/app/api/public/chat/route.ts`
- Setup: `const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })` (Zeile 53)
- Verwendung: `openai.chat.completions.create(...)` mit Streaming (Zeile 102)
- Scope: **nur Startseiten-Chat (anonym, 5 Nachrichten, gpt-4o-mini)**
- Enthält: Rate-Limiting (in-memory, per IP), Prompt-Injection-Detection

**Dify Cloud (primäre Chat-Integration):**
- Alle authentifizierten Chats laufen über Dify Chatflow (`tropen-os-chat-v2`)
- Endpoint: `DIFY_API_URL` + `/v1/chat-messages`
- Zweite App: `tropen-os-jungle-order` für Struktur-/Merge-Features
- **Kein direkter Zugriff auf Anthropic/Gemini/Mistral APIs**

### Bewertung
| Aspekt | Befund |
|--------|--------|
| Router/Adapter-Schicht | ❌ Nicht vorhanden — OpenAI direkt aufgerufen |
| Modell-Abstraktion | ❌ Fehlt — Modell ist hardcoded (`gpt-4o-mini`) |
| Anthropic SDK | ❌ Nicht installiert — Claude läuft nur über Dify |
| Observability | ❌ Kein Logging von Token-Usage, Latenz, Errors |
| Fallback/Retry | ❌ Nicht implementiert |

---

## 4. Environment Variables (`.env.local`)

```
DIFY_API_KEY                    ← Dify Chatflow App Key
DIFY_API_URL                    ← https://api.dify.ai/v1
DIFY_JUNGLE_ORDER_KEY           ← Dify Workflow App Key
NEXT_PUBLIC_SITE_URL            ← http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY   ← Supabase public key
NEXT_PUBLIC_SUPABASE_URL        ← https://vlwivsjfmcejhiqluaav.supabase.co
OPENAI_API_KEY                  ← OpenAI Key (nur für Startseiten-Chat)
SUPABASE_SERVICE_ROLE_KEY       ← Service Role (server-only)
```

**Fehlende Variables (für QA-Architektur):**
```
ANTHROPIC_API_KEY               ← für direkte Claude-Integration
SENTRY_DSN                      ← für Error Monitoring
LIGHTHOUSE_CI_TOKEN             ← für Lighthouse CI
```

---

## 5. GitHub Actions

**Kein `.github/workflows/` Verzeichnis vorhanden.**

Keinerlei CI/CD-Pipeline implementiert.

---

## 6. Datenbankschema

**Kein Drizzle** — Supabase mit Raw SQL Migrations.

### Migrationen (26 Dateien, `supabase/migrations/`)

| Datei | Inhalt |
|-------|--------|
| 001_initial.sql | Basis-Schema (users, organizations, workspaces, etc.) |
| 002_rls.sql | Row Level Security |
| 003_seed.sql | Seed-Daten |
| 004–006 | Policies, Budget-RPC, task_type |
| 007–009 | Onboarding, Projekte, AI Act |
| 010–012 | Jungle Order, Superadmin, Budget-Fix |
| 013–016 | Memory Window, RLS Audit, Thinking Mode, Smart Projects |
| 017–018 | **RAG: pgvector**, knowledge_sources/documents/chunks/citations |
| 019–020 | RLS-Fixes, Superadmin-Memberships |
| 021 | Impersonation Sessions |
| 022 | Artifacts + Bookmarks |
| 023–026 | Proactive Hints, Prompt Templates, Agents, Packages |
| **027** | ← **Nächste: QA-Tabellen** |

### Relevante Tabellen (für QA-Architektur)
- `messages` — hat `model_used`, `cost_eur`, `tokens_input`, `tokens_output` (via `usage_logs`)
- `usage_logs` — vollständiges Token/Cost-Logging pro Request
- `model_catalog` — Modell-Definitionen mit Kosten
- **Noch nicht vorhanden:** `qa_metrics`, `qa_routing_log`, `qa_compliance_checks`, `qa_test_runs`, `qa_lighthouse_runs`

---

## Offene Gaps für QA-Architektur

### 🔴 Kritisch (blockiert echte QA-Daten)

1. **Kein Test-Framework** — Vitest + Testing Library installieren und erste Tests schreiben
2. **Kein Error Monitoring** — Sentry fehlt; Produktionsfehler sind unsichtbar
3. **QA-Tabellen fehlen** — Migration 027 muss erstellt und gepusht werden
4. **Keine CI/CD-Pipeline** — GitHub Actions für Lint + Test + Lighthouse fehlen

### 🟡 Wichtig (für vollständige QA-Daten)

5. **Dify-Calls nicht erfasst (Phase 2b-Gap)** — Alle authentifizierten Chats (Claude/Gemini/Mistral) laufen direkt über Dify Cloud ohne Next.js-Proxy. Die Calls sind für `qa_routing_log` unsichtbar. Lösung in Phase 5: Dify-Calls über einen Next.js-Proxy-Layer leiten, der vor und nach dem Dify-Request loggt. Betrifft: `useWorkspaceState.ts` → Edge Function `ai-chat` → Dify direkt.
6. **Keine direkte Multi-Provider-Integration** — nur OpenAI SDK + Dify; Anthropic/Gemini/Mistral haben keine direkten SDKs
7. **Lighthouse-Daten** — kein CI-Token, keine automatischen Runs

### 🟢 Nice-to-Have

8. **OpenTelemetry** — für detailliertes Performance-Tracing
9. **Helicone** — als Drop-in für OpenAI-Observability

### Empfohlene Implementierungsreihenfolge

```
Phase 1 — Fundament (diese Session):
  ├── 027_qa_tables.sql (Supabase Migration)
  ├── src/types/qa.ts
  ├── src/app/api/admin/qa/* (7 Routes)
  └── Dashboard mit echten DB-Daten

Phase 2 — Testing:
  ├── vitest + @testing-library/react installieren
  ├── Erste Unit-Tests für API-Routes
  └── GitHub Actions: lint + test workflow

Phase 3 — Observability:
  ├── @sentry/nextjs installieren + konfigurieren
  ├── Error-Boundaries in Dashboard
  └── Token/Cost-Tracking aus usage_logs in QA-Dashboard

Phase 4 — CI/CD:
  ├── GitHub Actions: Lighthouse CI bei jedem Deploy
  ├── Playwright E2E-Tests für kritische Flows
  └── Automatische QA-Run-Trigger via Webhook
```
