---
status: active
updated: 2026-05-07
review_by: 2026-08-07
supersedes: []
---

# docs/INDEX.md — Aktiver Doku-Bestand

> **Pflicht-Eingang.** Lies diese Datei vor jedem Doku-Schreibvorgang.
> Konvention: `docs/CONVENTIONS.md` · Agent-Eingang: `AGENTS.md`

---

## Aktive Dokumente (`docs/active/`)

- **architect-log.md** (`docs/active/architect-log.md`) — Architektur-Entscheidungslog mit allen Änderungen und Begründungen · status: active · review_by: 2026-08-07
- **audit-domain-mapping.md** (`docs/active/audit-domain-mapping.md`) — Mapping aller Audit-Rules auf die 7 Domain-Tabs · status: active · review_by: 2026-08-07
- **audit-system.md** (`docs/active/audit-system.md`) — Gewichtetes Scoring-System (0–5 pro Regel, Gewichte 1–3) für das interne Audit-Dashboard · status: active · review_by: 2026-08-07
- **audit-tier-distribution.md** (`docs/active/audit-tier-distribution.md`) — Verteilung der Audit-Rules auf Starter/Production/Enterprise-Tiers · status: active · review_by: 2026-08-07
- **checker-design-patterns.md** (`docs/active/checker-design-patterns.md`) — 10 strukturelle Checker-Fehlertypen (P1–P10) mit Praxis-Belegen — Pflichtlektüre vor neuem Checker · status: active · review_by: 2026-08-07
- **checker-feedback.md** (`docs/active/checker-feedback.md`) — Dogfooding-Feedback-Log: False Positives, bekannte FP-Regeln, Prozess · status: active · review_by: 2026-08-07
- **checker-test-repos.md** (`docs/active/checker-test-repos.md`) — Benchmark-Repos für Checker-Qualitätssicherung (5 Open-Source-Projekte) · status: active · review_by: 2026-08-07
- **conference-intelligence.md** (`docs/active/conference-intelligence.md`) — Strategische Entscheidungen und Wettbewerbs-Monitoring 2026 · status: active · review_by: 2026-08-07
- **email-setup.md** (`docs/active/email-setup.md`) — E-Mail-Setup-Anleitung für Resend und SMTP-Adapter · status: active · review_by: 2026-08-07
- **engineering-standard.md** (`docs/active/engineering-standard.md`) — 25 Kategorien mit konkreten Regeln und Warnsignalen pro Kategorie · status: active · review_by: 2026-08-07
- **feature-bestand.md** (`docs/active/feature-bestand.md`) — Feature-Dokumentation mit Status-Markern (LIVE/EINGEFROREN/ABGELÖST) für alle implementierten Features · status: active · review_by: 2026-08-07
- **github-secrets.md** (`docs/active/github-secrets.md`) — GitHub Actions Secrets und Environment Variables Referenz · status: active · review_by: 2026-08-07
- **manifesto.md** (`docs/active/manifesto.md`) — 10 Kernprinzipien (Philosophie) des Webapp-Manifests · status: active · review_by: 2026-08-07
- **manual-checks.md** (`docs/active/manual-checks.md`) — 64 manuelle Checks die statisch nicht prüfbar sind · status: active · review_by: 2026-08-07
- **marken-brief.md** (`docs/active/marken-brief.md`) — Normatives Markendokument: Coach-Position, Schiefer-Limette-Welt, Stimm-Formel, Pflicht-Tags · status: active · review_by: 2026-08-07
- **migrations.md** (`docs/active/migrations.md`) — Vollständige Migrations-Übersicht 001 bis aktuell · status: active · review_by: 2026-08-07
- **onboarding.md** (`docs/active/onboarding.md`) — Onboarding-Schritte, AI Act, E-Mail-Templates · status: active · review_by: 2026-08-07
- **open-todos.md** (`docs/active/open-todos.md`) — Offene manuelle TODOs (PITR Restore-Test, rechtliche Pflichten etc.) · status: active · review_by: 2026-08-07
- **phase-2-vision.md** (`docs/active/phase-2-vision.md`) — Phase-2-Backup-Konzept: 5 Pfeiler (Drei-Ebenen, Kontroll-Spektrum, Karten-Aggregatzustände etc.) · status: active · review_by: 2026-08-07
- **rag-architecture.md** (`docs/active/rag-architecture.md`) — RAG-Architektur, pgvector, Wissensbasis-Schema · status: active · review_by: 2026-08-07
- **roadmap.md** (`docs/active/roadmap.md`) — Normative Roadmap Q2/Q3 2026 — Single Source of Truth für Bauphasen, Sprint-Status, GTM · status: active · review_by: 2026-08-07
- **runbook-disaster-recovery.md** (`docs/active/runbook-disaster-recovery.md`) — Runbook: Disaster Recovery Prozeduren · status: active · review_by: 2026-08-07
- **runbook-incident-response.md** (`docs/active/runbook-incident-response.md`) — Runbook: Incident Response Prozeduren · status: active · review_by: 2026-08-07
- **runbook-rollback.md** (`docs/active/runbook-rollback.md`) — Runbook: Rollback-Prozeduren für Deployments · status: active · review_by: 2026-08-07
- **security-tenant-isolation.md** (`docs/active/security-tenant-isolation.md`) — Tenant Isolation Audit 2026-03-25: RLS-Überprüfung aller Tabellen · status: active · review_by: 2026-08-07
- **tech-debt.md** (`docs/active/tech-debt.md`) — Technische Schulden: Known Debt, Priorisierung, Frozen-Code-Phase · status: active · review_by: 2026-08-07
- **zielbild.md** (`docs/active/zielbild.md`) — Zielbild Q3 2026: Produktvision, Zielgruppe, Differenzierung · status: active · review_by: 2026-08-07

---

## Entscheidungen (`docs/decisions/`)

- **001-nextjs-app-router.md** (`docs/decisions/001-nextjs-app-router.md`) — ADR: Next.js App Router als primäres Routing-System · status: active
- **002-vercel-deployment-platform.md** (`docs/decisions/002-vercel-deployment-platform.md`) — ADR: Vercel als Deployment-Plattform · status: active
- **003-supabase-as-auth-and-db.md** (`docs/decisions/003-supabase-as-auth-and-db.md`) — ADR: Supabase für Auth und Datenbank · status: active
- **004-drizzle-schema-only.md** (`docs/decisions/004-drizzle-schema-only.md`) — ADR: Drizzle nur für Schema-Definition, keine Queries · status: active
- **005-append-only-tables.md** (`docs/decisions/005-append-only-tables.md`) — ADR: Append-Only-Tabellen für unveränderliche Logs · status: active
- **006-ai-sdk-as-llm-layer.md** (`docs/decisions/006-ai-sdk-as-llm-layer.md`) — ADR: Vercel AI SDK als LLM-Abstraktionsschicht · status: active
- **007-role-architecture.md** (`docs/decisions/007-role-architecture.md`) — ADR: Rollen-Architektur (Superadmin / OrgRole / WorkspaceRole) · status: active
- **008-chart-libraries.md** (`docs/decisions/008-chart-libraries.md`) — ADR: Tremor für App-Charts, ECharts für Artifact-Charts · status: active
- **009-artifact-system-iframe-sucrase.md** (`docs/decisions/009-artifact-system-iframe-sucrase.md`) — ADR: Artifact-System mit iFrame und Sucrase-Transform · status: active
- **010-anthropic-direct-no-dify.md** (`docs/decisions/010-anthropic-direct-no-dify.md`) — ADR: Direkter Anthropic-Zugriff statt Dify · status: active
- **011-conversations-for-workspace-chats.md** (`docs/decisions/011-conversations-for-workspace-chats.md`) — ADR: Conversations-Tabelle für Workspace-Chats · status: active
- **012-feeds-pipeline-architecture.md** (`docs/decisions/012-feeds-pipeline-architecture.md`) — ADR: Feeds-Pipeline-Architektur mit Stage-System · status: active
- **013-library-system-role-capability-skill.md** (`docs/decisions/013-library-system-role-capability-skill.md`) — ADR: Library-System mit Rolle, Capability und Skill · status: active
- **014-smart-model-router-multi-provider.md** (`docs/decisions/014-smart-model-router-multi-provider.md`) — ADR: Smart Model Router für Multi-Provider-Unterstützung · status: active
- **015-perspectives-parallel-ai-responses.md** (`docs/decisions/015-perspectives-parallel-ai-responses.md`) — ADR: Perspectives-System für parallele KI-Antworten · status: active
- **016-web-search-anthropic-server-tool.md** (`docs/decisions/016-web-search-anthropic-server-tool.md`) — ADR: Web-Search via Anthropic Server Tool · status: active
- **017-i18n-deferred.md** (`docs/decisions/017-i18n-deferred.md`) — ADR: i18n zurückgestellt, next-intl als zukünftige Lösung · status: active
- **018-windmill-instead-of-n8n.md** (`docs/decisions/018-windmill-instead-of-n8n.md`) — ADR: Windmill statt n8n als Workflow-Engine · status: active
- **019-nextjs-16-downgrade.md** (`docs/decisions/019-nextjs-16-downgrade.md`) — ADR: Next.js 16 Downgrade wegen Turbopack NFT-Bug · status: active
- **020-six-layer-knowledge-architecture.md** (`docs/decisions/020-six-layer-knowledge-architecture.md`) — ADR: Sechs-Schichten-Wissens-Modell · status: active
- **021-prompt-enricher-architecture.md** (`docs/decisions/021-prompt-enricher-architecture.md`) — ADR: Prompt-Veredler-Architektur · status: active
- **022-markdown-format.md** (`docs/decisions/022-markdown-format.md`) — ADR: Markdown-Format und Obsidian-Bridge · status: active
- **023-interface-strategy.md** (`docs/decisions/023-interface-strategy.md`) — ADR: Interface-Strategie (CLI-First + Pull-MCP) · status: active
- **024-brand-pivot.md** (`docs/decisions/024-brand-pivot.md`) — ADR: Marken-Pivot zur Schiefer-Limette-Welt · status: active
- **025-tab-architecture.md** (`docs/decisions/025-tab-architecture.md`) — ADR: Tab-Architektur für das Audit-System (7 Domain-Tabs) · status: active
- **026-docs-hygiene-tab.md** (`docs/decisions/026-docs-hygiene-tab.md`) — ADR: Doku-Hygiene-Tab im Audit-System · status: active
- **027-killer-criteria-score-pivot.md** (`docs/decisions/027-killer-criteria-score-pivot.md`) — ADR: Killer-Kriterien und Score-Pivot (ADR-027) · status: active

---

## Ausnahmen (nicht unter die Konvention fallend)

Diese Verzeichnisse enthalten Tool-Outputs und keine Doku im engen Sinn. Für sie gilt die Konvention nicht 1:1:

- `docs/audit-reports/` — Audit- und Benchmark-Outputs (generiert)
- `docs/committee-reviews/` — Committee-Review-Outputs (generiert)
- `docs/agents/` — Agent Rule Packs (Tool-Outputs der Komitee-Engine, 29 Packs)
- `docs/repo-map/` — Repo Map Output (generiert von `generate-repo-map.ts`)
- `docs/benchmark-results/` — Benchmark-Ergebnisse (generiert)
- `docs/screenshots/` — UI-Screenshots
