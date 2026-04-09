// src/scripts/agent-gen-defs.ts
// Agent generation definitions — themes, rules per agent, generation order.
// Imported by generate-agents.ts only.

export interface AgentGenDef {
  id: string
  name: string
  filename: string
  categoryIds: number[]
  themes: string
  engineeringRules: string   // relevant excerpt from engineering-standard.md
  deferTo: string[]          // existing agent ids that own overlapping territory
}

// ── Relevant Engineering Standard excerpts (condensed) ──────────────────────

const RULES_CODE_QUALITY = `
Cat 2 — Code-Qualität:
- TypeScript strict mode, kein ungeklärtes any
- Naming: camelCase vars/fns, PascalCase components, UPPER_SNAKE_CASE constants
- Keine Magic Numbers/Strings — benannte Konstanten
- Funktionen: Single Responsibility, max ~30 Zeilen
- Cognitive Complexity ≤ 15 (human), ≤ 8 (AI-generated code)
- Fehlertypen explizit modelliert, kein leerer catch-Block
- Warnsignale: KI-Variablennamen ohne Domänenbezug (data/result/item), Verschachtelungstiefe > 4

Cat 25 — Dateihygiene:
- Dateien > 300 Zeilen: Warnung; > 500 Zeilen: Verletzung
- Keine auskommentierten Code-Blöcke in Production
- Keine ungenutzten Imports / Dead Code
- Dateinamen: PascalCase für Komponenten, kebab-case für Ordner`

const RULES_ERROR_HANDLING = `
Cat 2 — Code-Qualität (error subset):
- Fehlertypen explizit modelliert, kein leerer catch-Block
- Standardisierte Error-Typen aus src/lib/errors.ts
- API-Routes: try/catch + strukturierte JSON-Response { error: string, code?: string }
- Nie generische Error-Messages an den Client
- Zod-Validation vor jeder Business-Logik

Cat 6 — API-Design (resilience):
- Timeout auf jedem externen Call
- Retry + Backoff für transiente Fehler
- Circuit Breaker gegen Cascade-Failure
- Graceful Degradation mit Fallback`

const RULES_TESTING = `
Cat 10 — Testing:
- Unit Tests ≥ 80% Coverage für Business-Logik
- Integration Tests: API-Endpunkte mit echter Test-DB
- E2E: alle kritischen User-Journeys (Registration, Login, Core-Flow)
- Tests laufen in CI — kein Merge ohne grüne Tests
- Regressions-Test für jeden Bug-Fix
- KI-generierter Code: Coverage ≥ 90%, Duplikate ≤ 1%, Security Hotspots reviewed
- Testing-Pyramide: viele Unit → weniger Integration → wenige E2E`

const RULES_PERFORMANCE = `
Cat 7 — Performance:
- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1, TTFB < 800ms
- API-Latenz p95 < 300ms, DB-Query p95 < 50ms
- Bundle-Analyse im Build, Code-Splitting und Lazy Loading
- Bilder: WebP/AVIF, srcset, Lazy Loading, CDN
- Caching auf allen Ebenen (HTTP-Header, API-Responses, DB-Layer)
- Keine unbegrenzte Listen-Endpunkte — immer Pagination
- N+1-Queries aktiv suchen und eliminieren`

const RULES_PLATFORM = `
Cat 11 — CI/CD:
- Pipeline: Push → Lint → Type Check → Unit Tests → Build → Integration Tests → Deploy Staging → E2E → Deploy Production
- Zero-Downtime-Deployment: Blue-Green oder Rolling
- Rollback automatisierbar < 5 Minuten
- Staging = Produktion-Klon
- Secrets nur via CI-Umgebungsvariablen, nie im Code

Cat 23 — Infrastructure:
- Infrastructure as Code (Terraform, Pulumi, CDK)
- Health Endpoints auf allen Services
- Multi-AZ/Multi-Region für kritische Services
- Monitoring + Alerting vor Go-Live`

const RULES_DATABASE = `
Cat 5 — Datenbank:
- Schema-Design vor Implementierung
- Normalisierung: 3. Normalform als Ausgangspunkt
- Alle FK indiziert; WHERE/ORDER BY/JOIN-Felder geprüft
- Migrationen versioniert und reversibel
- Datenbankzugriff: Principle of Least Privilege
- BaaS: RLS auf allen Tabellen zwingend, Service Role Key nie im Frontend
- Soft Delete Pattern für APPEND-ONLY Tabellen
- PITR (Point-in-Time-Recovery) konfiguriert`

const RULES_DEPENDENCIES = `
Cat 14 — Dependency Management:
- Lockfile committed, exakte Versionen für kritische Packages
- Dependabot / Renovate konfiguriert
- Keine ungepatchten kritischen CVEs
- Node-Version fixiert (.nvmrc)
- Regelmäßiges npm audit / yarn audit im CI

Cat 24 — Supply Chain Security:
- SBOM (Software Bill of Materials) generiert
- Signed Builds wo möglich
- KI-Dependency-Review: AI-generierter Code wird auf schädliche Packages geprüft
- Transitive Dependencies auf bekannte Malware geprüft`

const RULES_API = `
Cat 6 — API-Design:
- Versionierung von Tag 1: /api/v1/
- HTTP-Verben semantisch korrekt, Status-Codes bedeutungsvoll
- Konsistente Fehler-Antwort-Struktur { error, code } über alle Endpunkte
- Input- und Output-Validierung, kein Over-Sharing
- OpenAPI/Swagger-Dokumentation (auto-generiert)
- Resilience: Timeout, Retry+Backoff, Circuit Breaker, Graceful Degradation
- Webhook-Signaturen validieren, Events idempotent
- Drittanbieter hinter Abstraktionsschicht`

const RULES_ACCESSIBILITY = `
Cat 16 — Accessibility:
- WCAG 2.1 Level AA minimum
- Semantisches HTML: button für Aktionen, a href für Navigation, nie div onClick
- Alle interaktiven Elemente per Tastatur erreichbar
- Fokus-Indikator immer sichtbar
- ARIA-Attribute korrekt eingesetzt, keine redundanten ARIA
- Farbkontrast: 4.5:1 für Normal-Text, 3:1 für großen Text
- Screen-Reader-Tests auf VoiceOver/NVDA`

const RULES_DESIGN_SYSTEM = `
Cat 15 — Design System:
- Design Tokens für alle Farben, Abstände, Typografie
- Keine Hard-coded Hex-Werte im Code — nur CSS-Variablen
- Komponentenbibliothek mit versionierten Releases
- Component Lifecycle: Draft → Beta → Stable → Deprecated
- Konsistente Interaktionsmuster über alle Features
- Theming ohne Code-Änderungen`

const RULES_CONTENT = `
Cat 17 — Internationalisierung:
- i18n-Framework von Tag 1 (i18next, react-intl)
- Keine hardcodierten Strings in Komponenten
- Locale-formatierte Zahlen, Daten, Währungen
- RTL-Support in der Basis-Architektur

Cat 15 — Design System (content subset):
- User-facing Error-Messages hilfreich und aktionierbar
- Microcopy konsistent über alle Features`

const RULES_LEGAL = `
Cat 4 — Datenschutz & Compliance:
- Privacy by Design & Default, Datensparsamkeit
- Rechtsgrundlagen nach Art. 6 DSGVO dokumentiert
- Betroffenenrechte technisch umgesetzt: Auskunft, Löschung, Berichtigung, Portabilität
- Consent-Management ohne Dark Patterns, Einwilligungen protokolliert
- AVV mit allen Drittanbietern die PII verarbeiten
- Keine PII in Logs
- AI Act: Klassifizierung aller KI-Systeme, Transparenzpflicht, KI-Inhalte erkennbar`

const RULES_COST = `
Cat 20 — Cost Awareness:
- Cloud-Budget-Alerts konfiguriert (Anthropic Console, AWS, etc.)
- Token-Budgets pro Org, per User, per Feature
- Rate Limits auf allen LLM-Endpunkten
- Vendor-Lock-in-Risiko dokumentiert, Exit-Strategie vorhanden
- Lizenz-Compliance für alle Open-Source-Packages geprüft
- Kosten-Attribution via Tags/Labels`

const RULES_GIT = `
Cat 19 — Git Governance:
- Conventional Commits: feat/fix/docs/chore/refactor/test/ci
- Branch-Schutz auf main/master: PRs required, Reviews required
- Semantic Versioning (MAJOR.MINOR.PATCH)
- Atomare Commits: ein logischer Schritt pro Commit
- CODEOWNERS definiert für kritische Verzeichnisse
- Secret-Rewrite: Secrets aus History entfernen (git-filter-repo)
- Kein --force push auf main`

const RULES_AI = `
Cat 22 — AI Integration:
- Prompt Injection Defense: User-Input niemals direkt in System-Prompts
- Token-Limits konfiguriert (maxOutputTokens, Context-Window-Management)
- Fallback-Strategie wenn Modell unavailable
- Output-Validierung: AI-Outputs validieren bevor sie gespeichert/verwendet werden
- Modell-Abstraktion: kein Provider-Lock-in, Wechsel in einer Zeile möglich
- Deterministic Mode: Temperatur 0 für strukturierte Outputs
- Kein User-Input im System-Prompt via Template-Interpolation`

const RULES_ANALYTICS = `
Cat 12 — Observability (analytics subset):
- Klare Trennung: User-Behavior-Analytics vs. System-Health-Monitoring
- Event-Schemas dokumentiert und versioniert
- Keine Überschneidung mit Observability-Agent (der ist für System-Health)
- Consent: Tracking nur mit Einwilligung (DSGVO/CCPA)
- Anonymisierung: User-IDs pseudonymisiert, keine direkten Personendaten in Events
- Session-Recordings nur mit expliziter Einwilligung`

const RULES_BACKUP = `
Cat 13 — Backup & Disaster Recovery:
- 3-2-1-Regel: 3 Kopien, 2 verschiedene Medien, 1 off-site
- PITR (Point-in-Time-Recovery) konfiguriert und getestet
- Restore-Tests: mindestens quartalsweise dokumentiert
- DR-Runbook: schriftlich, getestet, aktuell
- RTO (Recovery Time Objective) und RPO (Recovery Point Objective) definiert
- Incident-Klassifizierung: P0/P1/P2/P3 mit eskalierter Kommunikation`

const RULES_SCALABILITY = `
Cat 8 — Skalierbarkeit:
- Stateless App-Server — kein lokaler Session-State
- Job-Queue für Tasks > 3-5 Sekunden (BullMQ, SQS, etc.)
- Lasttests vor signifikantem Launch dokumentiert
- Scaling-Runbook: Bottleneck-Reihenfolge bekannt

Cat 9 — State Management:
- Server State: React Query/SWR; Client State: useState/useReducer
- Global State: Zustand/Redux für Auth+Theme
- URL State für Filter/Pagination
- Optimistic Updates immer mit Rollback-Logik
- Kein globaler Store für lokal verwendbaren State`

// ── The 18 agent definitions in generation order ─────────────────────────────

export const AGENTS_TO_GENERATE: AgentGenDef[] = [
  // ── Round 1: no inter-agent dependencies ──────────────────────────────────
  {
    id: 'code-style',
    name: 'CODE_STYLE',
    filename: 'CODE_STYLE_AGENT.md',
    categoryIds: [2, 25],
    themes: 'Naming conventions, formatting, cognitive complexity, magic numbers/strings, dead code, file size limits, AI-generated code style risks',
    engineeringRules: RULES_CODE_QUALITY,
    deferTo: ['architecture'],
  },
  {
    id: 'error-handling',
    name: 'ERROR_HANDLING',
    filename: 'ERROR_HANDLING_AGENT.md',
    categoryIds: [2, 6],
    themes: 'Error lifecycle, recovery patterns, user-facing error messages, try/catch discipline, structured error types, graceful degradation, external call resilience',
    engineeringRules: RULES_ERROR_HANDLING,
    deferTo: ['security', 'observability'],
  },
  {
    id: 'database',
    name: 'DATABASE',
    filename: 'DATABASE_AGENT.md',
    categoryIds: [5],
    themes: 'Schema design, normalization, index strategy, migration versioning, FK constraints, PITR, Least Privilege, Soft Delete, BaaS/Supabase RLS',
    engineeringRules: RULES_DATABASE,
    deferTo: ['security'],
  },
  {
    id: 'dependencies',
    name: 'DEPENDENCIES',
    filename: 'DEPENDENCIES_AGENT.md',
    categoryIds: [14, 24],
    themes: 'Lockfiles, CVE scanning, Dependabot/Renovate, SBOM, signed builds, AI-dependency review, Node version pinning, supply chain integrity',
    engineeringRules: RULES_DEPENDENCIES,
    deferTo: ['security'],
  },
  {
    id: 'git-governance',
    name: 'GIT_GOVERNANCE',
    filename: 'GIT_GOVERNANCE_AGENT.md',
    categoryIds: [19],
    themes: 'Conventional commits, branch protection, semantic versioning, atomic commits, CODEOWNERS, secret rewrite from history, PR discipline',
    engineeringRules: RULES_GIT,
    deferTo: ['security'],
  },
  {
    id: 'backup-dr',
    name: 'BACKUP_DR',
    filename: 'BACKUP_DR_AGENT.md',
    categoryIds: [13],
    themes: '3-2-1 backup rule, PITR configuration and testing, restore drills, DR runbook, RTO/RPO definitions, incident classification and communication plan',
    engineeringRules: RULES_BACKUP,
    deferTo: ['observability'],
  },

  // ── Round 2: reference Round 1 agents ─────────────────────────────────────
  {
    id: 'testing',
    name: 'TESTING',
    filename: 'TESTING_AGENT.md',
    categoryIds: [10],
    themes: 'Test pyramid, unit/integration/E2E coverage, CI enforcement, regression tests, AI-code quality gates, fixtures and mocking discipline',
    engineeringRules: RULES_TESTING,
    deferTo: ['code-style', 'error-handling'],
  },
  {
    id: 'performance',
    name: 'PERFORMANCE',
    filename: 'PERFORMANCE_AGENT.md',
    categoryIds: [7],
    themes: 'Core Web Vitals targets, bundle size, lazy loading, multi-layer caching, pagination enforcement, DB query performance, N+1 detection',
    engineeringRules: RULES_PERFORMANCE,
    deferTo: ['database'],
  },
  {
    id: 'platform',
    name: 'PLATFORM',
    filename: 'PLATFORM_AGENT.md',
    categoryIds: [11, 23],
    themes: 'CI/CD pipeline structure, zero-downtime deployment, rollback automation, staging parity, IaC, health checks, multi-AZ, secrets in CI',
    engineeringRules: RULES_PLATFORM,
    deferTo: ['security', 'observability'],
  },
  {
    id: 'api',
    name: 'API',
    filename: 'API_AGENT.md',
    categoryIds: [6],
    themes: 'API versioning, OpenAPI docs, resilience patterns (timeout/retry/circuit-breaker/graceful-degradation), webhook signature validation, vendor abstraction, consistent error responses',
    engineeringRules: RULES_API,
    deferTo: ['security', 'error-handling'],
  },
  {
    id: 'cost-awareness',
    name: 'COST_AWARENESS',
    filename: 'COST_AWARENESS_AGENT.md',
    categoryIds: [20],
    themes: 'Cloud budget alerts, token budgets per org/user, rate limit enforcement, vendor lock-in documentation, exit strategy, license compliance for OSS',
    engineeringRules: RULES_COST,
    deferTo: ['observability'],
  },
  {
    id: 'scalability',
    name: 'SCALABILITY',
    filename: 'SCALABILITY_AGENT.md',
    categoryIds: [8, 9],
    themes: 'Stateless app servers, job queues for long tasks, load testing, scaling runbook, state categorization, optimistic updates with rollback',
    engineeringRules: RULES_SCALABILITY,
    deferTo: ['database', 'observability'],
  },

  // ── Round 3: reference Round 1+2 agents ───────────────────────────────────
  {
    id: 'accessibility',
    name: 'ACCESSIBILITY',
    filename: 'ACCESSIBILITY_AGENT.md',
    categoryIds: [16],
    themes: 'WCAG 2.1 AA compliance, semantic HTML elements, ARIA correctness, keyboard navigation, focus management, color contrast, screen reader testing',
    engineeringRules: RULES_ACCESSIBILITY,
    deferTo: ['design-system'],
  },
  {
    id: 'design-system',
    name: 'DESIGN_SYSTEM',
    filename: 'DESIGN_SYSTEM_AGENT.md',
    categoryIds: [15],
    themes: 'Design tokens over hardcoded values, component library versioning, component lifecycle (draft→stable→deprecated), theming, consistency enforcement',
    engineeringRules: RULES_DESIGN_SYSTEM,
    deferTo: ['code-style'],
  },
  {
    id: 'content',
    name: 'CONTENT',
    filename: 'CONTENT_AGENT.md',
    categoryIds: [17, 15],
    themes: 'i18n framework adoption, externalized strings, locale-aware formatting, actionable error messages, microcopy consistency, RTL support',
    engineeringRules: RULES_CONTENT,
    deferTo: ['design-system'],
  },
  {
    id: 'legal',
    name: 'LEGAL',
    filename: 'LEGAL_AGENT.md',
    categoryIds: [4],
    themes: 'GDPR/DSGVO compliance, AI Act classification, PII handling, consent management, data deletion rights, legal basis documentation, DPA agreements, data retention policies, Privacy by Design',
    engineeringRules: RULES_LEGAL,
    deferTo: ['security', 'observability'],
  },
  {
    id: 'ai-integration',
    name: 'AI_INTEGRATION',
    filename: 'AI_INTEGRATION_AGENT.md',
    categoryIds: [22],
    themes: 'Prompt injection defense, token limit configuration, model fallback strategy, output validation, model provider abstraction, response caching, deterministic mode for structured outputs',
    engineeringRules: RULES_AI,
    deferTo: ['security', 'cost-awareness'],
  },
  {
    id: 'analytics',
    name: 'ANALYTICS',
    filename: 'ANALYTICS_AGENT.md',
    categoryIds: [12],
    themes: 'Separation of user behavior analytics from system observability, event schema design, tracking consent (GDPR/CCPA), user ID pseudonymization, no overlap with Observability Agent',
    engineeringRules: RULES_ANALYTICS,
    deferTo: ['observability', 'legal'],
  },
]
