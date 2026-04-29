# ADR-Index — Architecture Decision Records

> **Single Source of Truth für ADR-Nummerierung.**
> Dateiname = Wahrheit. Interne Nummern (H1-Header) wurden auf Stand 2026-04-29 mit Dateinamen synchronisiert.
> Bei neuen ADRs: nächste freie Nummer = 027.

| Nummer | Datei | Titel | Status |
|--------|-------|-------|--------|
| ADR-001 | `001-nextjs-app-router.md` | Next.js 16 mit App Router als Web-Framework | Accepted |
| ADR-002 | `002-vercel-deployment-plattform.md` | Vercel als Deployment-Plattform | Accepted |
| ADR-003 | `003-supabase-als-auth-und-db.md` | Supabase als Auth- und Datenbank-Plattform | Accepted |
| ADR-004 | `004-drizzle-schema-only.md` | Drizzle ORM nur für Schema-Definition, nicht für Queries | Accepted |
| ADR-005 | `005-append-only-tables.md` | APPEND ONLY Tabellen für Audit-Trail und Historisierung | Accepted |
| ADR-006 | `006-ai-sdk-als-llm-layer.md` | Vercel AI SDK als LLM-Abstraktionsschicht | Accepted |
| ADR-007 | `007-rollen-architektur.md` | Rollen-Architektur — Superadmin, OrgRole, WorkspaceRole | Accepted |
| ADR-008 | `008-chart-bibliotheken.md` | Chart-Bibliotheken (Tremor + ECharts CDN) | Accepted |
| ADR-009 | `009-artifact-system-iframe-sucrase.md` | Artifact-System — iFrame-Sandbox mit Sucrase-Transformation | Accepted |
| ADR-010 | `010-anthropic-direct-no-dify.md` | Anthropic SDK direkt statt Dify | Accepted |
| ADR-011 | `011-conversations-fuer-workspace-chats.md` | Conversations-Tabelle für Workspace-Chats | Accepted |
| ADR-012 | `012-feeds-pipeline-architektur.md` | Feeds-Pipeline-Architektur — Sources, Items, Runs, Distributions | Accepted |
| ADR-013 | `013-library-system-rolle-capability-skill.md` | Library-System — Rolle, Capability, Skill, Outcome | Accepted |
| ADR-014 | `014-smart-model-router-multi-provider.md` | Smart Model Router — Multi-Provider mit Kundenhoheit | Proposed |
| ADR-015 | `015-perspectives-parallele-ki-antworten.md` | Perspectives — Parallele KI-Antworten mit Perspektiven-Avataren | Accepted |
| ADR-016 | `016-web-search-anthropic-server-tool.md` | Web Search via Anthropic Server Tool | Accepted |
| ADR-017 | `017-i18n-deferred.md` | Internationalisierung aufgeschoben, Grundstruktur vorbereitet | Accepted |
| ADR-018 | `018-windmill-statt-n8n.md` | Windmill statt n8n als Workflow-Execution-Engine | Accepted (Phase 2) |
| ADR-019 | `019-nextjs-16-downgrade-turbopack-nft-bug.md` | Next.js 16 → 15 Downgrade (Turbopack Middleware NFT Bug) | Accepted |
| ADR-020 | `020-six-layer-knowledge-architecture.md` | Sechs-Schichten-Wissens-Architektur | Proposed |
| ADR-021 | `021-prompt-veredler-architecture.md` | Prompt-Veredler-Architektur | Proposed |
| ADR-022 | `022-markdown-format-obsidian-bridge.md` | Markdown-Format für Projektwissen mit Obsidian-Brücke | Proposed |
| ADR-023 | `023-interface-strategy.md` | Schnittstellen-Strategie zwischen Tropen OS und Bau-Tools | Proposed |
| ADR-024 | `024-marken-pivot.md` | Marken-Pivot: Coach-Position + Schiefer-Limette-Welt | Accepted |
| ADR-025 | `ADR-025-tab-architektur.md` | Strategische Tab-Architektur und Compliance-Strategie | Accepted |
| ADR-026 | `ADR-026-doku-hygiene-tab.md` | Doku-Hygiene als siebter Domain-Tab | Draft (24h-Wartezeit) |

## Konventionen

- **Dateiname ist die Wahrheit.** Bei Widerspruch zwischen Dateiname und H1-Header gilt der Dateiname.
- **Neue ADRs:** Format `NNN-kebab-case-titel.md`, interne H1 = `# ADR-NNN: Titel`.
- **Nächste freie Nummer:** 027
- **Status-Werte:** `Proposed` → `Accepted` | `Superseded` | `Deprecated` | `Draft`
