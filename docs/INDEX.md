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
- **feature-inventory.md** (`docs/active/feature-inventory.md`) — Feature-Dokumentation mit Status-Markern (LIVE/EINGEFROREN/ABGELÖST) für alle implementierten Features · status: active · review_by: 2026-08-07
- **github-secrets.md** (`docs/active/github-secrets.md`) — GitHub Actions Secrets und Environment Variables Referenz · status: active · review_by: 2026-08-07
- **manifesto.md** (`docs/active/manifesto.md`) — 10 Kernprinzipien (Philosophie) des Webapp-Manifests · status: active · review_by: 2026-08-07
- **manual-checks.md** (`docs/active/manual-checks.md`) — 64 manuelle Checks die statisch nicht prüfbar sind · status: active · review_by: 2026-08-07
- **brand-brief.md** (`docs/active/brand-brief.md`) — Normatives Markendokument: Coach-Position, Schiefer-Limette-Welt, Stimm-Formel, Pflicht-Tags · status: active · review_by: 2026-08-07
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
- **vision.md** (`docs/active/vision.md`) — Zielbild Q3 2026: Produktvision, Zielgruppe, Differenzierung · status: active · review_by: 2026-08-07

---

## Entscheidungen (`docs/decisions/`)

29 ADRs — thematisch gruppiert. Unveränderliche Nummerierung, Lücken erlaubt.

### Strategie & Marke

- **023** — Interface-Strategie (CLI-First + Pull-MCP) · active
- **024** — Marken-Pivot zur Schiefer-Limette-Welt · active
- **028** — Pivot to Companion Platform — neun Achsen, vier Wetten, Foundation/Build/Beta-Sequenzierung · accepted

### Audit-Engine

- **025** — Tab-Architektur für das Audit-System (7 Domain-Tabs) · active
- **026** — Doku-Hygiene-Tab im Audit-System · active
- **027** — Killer-Kriterien und Score-Pivot · active
- **029** — Audit-Kategorie 27: Web Discoverability & AI Readiness · accepted

### Stack & Infrastruktur

- **001** — Next.js App Router als primäres Routing-System · active
- **002** — Vercel als Deployment-Plattform · active
- **003** — Supabase für Auth und Datenbank · active
- **004** — Drizzle nur für Schema-Definition, keine Queries · active
- **005** — Append-Only-Tabellen für unveränderliche Logs · active
- **006** — Vercel AI SDK als LLM-Abstraktionsschicht · active
- **007** — Rollen-Architektur (Superadmin / OrgRole / WorkspaceRole) · active
- **008** — Tremor für App-Charts, ECharts für Artifact-Charts · active
- **009** — Artifact-System mit iFrame und Sucrase-Transform · active
- **010** — Direkter Anthropic-Zugriff statt Dify · active
- **011** — Conversations-Tabelle für Workspace-Chats · active
- **012** — Feeds-Pipeline-Architektur mit Stage-System · active
- **013** — Library-System mit Rolle, Capability und Skill · active
- **014** — Smart Model Router für Multi-Provider-Unterstützung · active
- **015** — Perspectives-System für parallele KI-Antworten · active
- **016** — Web-Search via Anthropic Server Tool · active
- **017** — i18n zurückgestellt, next-intl als zukünftige Lösung · active
- **018** — Windmill statt n8n als Workflow-Engine · active
- **019** — Next.js 16 Downgrade wegen Turbopack NFT-Bug · active

### Wissens- & Doku-Architektur

- **020** — Sechs-Schichten-Wissens-Modell · active
- **021** — Prompt-Veredler-Architektur · active
- **022** — Markdown-Format und Obsidian-Bridge · active

---

## Ausnahmen (nicht unter die Konvention fallend)

Diese Verzeichnisse enthalten Tool-Outputs und keine Doku im engen Sinn. Für sie gilt die Konvention nicht 1:1:

- `docs/audit-reports/` — Audit- und Benchmark-Outputs (generiert)
- `docs/committee-reviews/` — Committee-Review-Outputs (generiert)
- `docs/agents/` — Agent Rule Packs (Tool-Outputs der Komitee-Engine, 29 Packs)
- `docs/repo-map/` — Repo Map Output (generiert von `generate-repo-map.ts`)
- `docs/benchmark-results/` — Benchmark-Ergebnisse (generiert)
- `docs/screenshots/` — UI-Screenshots
