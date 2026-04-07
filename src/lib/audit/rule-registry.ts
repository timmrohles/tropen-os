// src/lib/audit/rule-registry.ts
import type { AuditRule, AuditContext } from './types'
import {
  checkTypeScriptStrictMode, checkEsLintConfigured, checkPrettierConfigured,
  checkLockfileCommitted, checkNodeVersionFixed, checkMigrationsTool,
  checkCIPipelinePresent, checkDependabotConfigured, checkPWAManifest,
  checkServiceWorker, checkHealthEndpoint, checkApiVersioning, checkOpenApiSpec,
  checkErrorTrackingSentry, checkDistributedTracing, checkI18nFramework,
  checkVulnerabilityScanInCI, checkInfrastructureAsCode, checkJobQueuePresent,
  checkE2ETestsPresent, checkIntegrationTests, checkTestsInCIPipeline,
  checkKiCodeGate, checkSBOMGenerated, checkSemanticVersioning,
  checkBundleAnalyzer, checkProjectStructure,
} from './checkers/file-system-checker'
import {
  checkCircularDependencies, checkFileSizes, checkInputValidationCoverage,
  checkLoggerAbstraction, checkVendorAbstraction, checkServiceKeyInFrontend,
  checkBudgetEnforcement, checkBusinessLogicSeparation, checkNamingConventions,
  checkAriaAttributes, checkTokenLimitsConfigured,
} from './checkers/repo-map-checker'
import {
  checkADRsPresent, checkReadmePresent, checkRunbooksPresent,
  checkConventionalCommits, checkFKConstraintsInMigrations,
  checkIndexStrategyInMigrations, checkAiActDocumentation,
} from './checkers/documentation-checker'
import { cliChecks } from './checkers/cli-checker'

function manual(id: string, categoryId: number, name: string, weight: 1 | 2 | 3): AuditRule {
  return { id, categoryId, name, weight, checkMode: 'manual', automatable: false }
}

export const AUDIT_RULES: AuditRule[] = [
  // ── Category 1: Architektur (weights: 3, 3, 2, 1, 2) ──────────────────────
  manual('cat-1-rule-1', 1, 'Klare Schichtenarchitektur erkennbar', 3),
  { id: 'cat-1-rule-2', categoryId: 1, name: 'Business-Logik nicht in UI/Routes', weight: 3, checkMode: 'repo-map', automatable: true, check: checkBusinessLogicSeparation },
  { id: 'cat-1-rule-3', categoryId: 1, name: 'Keine zirkulaeren Abhaengigkeiten', weight: 2, checkMode: 'repo-map', automatable: true, check: checkCircularDependencies },
  { id: 'cat-1-rule-4', categoryId: 1, name: 'Dateien < 300 Zeilen (Ausnahmen dokumentiert)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkFileSizes },
  { id: 'cat-1-rule-5', categoryId: 1, name: 'ADRs vorhanden fuer Kerntechnologieentscheidungen', weight: 2, checkMode: 'documentation', automatable: true, check: checkADRsPresent },

  // ── Category 2: Code-Qualitaet (weights: 3, 2, 1, 1, 2, 2) ────────────────
  { id: 'cat-2-rule-1', categoryId: 2, name: 'TypeScript Strict Mode aktiv', weight: 3, checkMode: 'file-system', automatable: true, check: checkTypeScriptStrictMode },
  { id: 'cat-2-rule-2', categoryId: 2, name: 'ESLint konfiguriert und aktiv', weight: 2, checkMode: 'file-system', automatable: true, check: checkEsLintConfigured },
  { id: 'cat-2-rule-3', categoryId: 2, name: 'Prettier konfiguriert', weight: 1, checkMode: 'file-system', automatable: true, check: checkPrettierConfigured },
  manual('cat-2-rule-4', 2, 'Magic Numbers/Strings minimiert', 1),
  manual('cat-2-rule-5', 2, 'Explizites Error Handling durchgaengig', 2),
  manual('cat-2-rule-6', 2, 'Cognitive Complexity <= 15', 2),

  // ── Category 3: Sicherheit (weights: 3,3,3,2,2,3,2,3,2,2,2,3,2,3) ────────
  manual('cat-3-rule-1',  3, 'OWASP Top 10 beruecksichtigt', 3),
  { id: 'cat-3-rule-2',  categoryId: 3, name: 'Serverseitige Input-Validierung', weight: 3, checkMode: 'repo-map', automatable: true, check: checkInputValidationCoverage },
  { id: 'cat-3-rule-3',  categoryId: 3, name: 'Keine Secrets im Repo / History', weight: 3, checkMode: 'cli', automatable: true, check: cliChecks.checkNoSecretsInRepo },
  manual('cat-3-rule-4',  3, 'HTTP Sicherheitsheader gesetzt', 2),
  manual('cat-3-rule-5',  3, 'Rate Limiting implementiert', 2),
  manual('cat-3-rule-6',  3, 'Auth und Authz klar getrennt', 3),
  { id: 'cat-3-rule-7',  categoryId: 3, name: 'Dependency-Vulnerabilities geprueft', weight: 2, checkMode: 'cli', automatable: true, check: cliChecks.checkDependencyVulnerabilities },
  manual('cat-3-rule-8',  3, 'Auth-Haertung (Token-Expiry, Rotation, Logout)', 3),
  manual('cat-3-rule-9',  3, 'Boilerplate-Hygiene (keine Default-Credentials)', 2),
  manual('cat-3-rule-10', 3, 'E-Mail-Sicherheit (SPF, DKIM, DMARC)', 2),
  manual('cat-3-rule-11', 3, 'Patch-Management + Disclosure Policy', 2),
  manual('cat-3-rule-12', 3, 'SSRF-Schutz (URL-Validierung, Allowlist)', 3),
  manual('cat-3-rule-13', 3, 'CSRF-Schutz (SameSite Cookies, CSRF-Tokens)', 2),
  manual('cat-3-rule-14', 3, 'Object-Level Authorization (Ownership-Check)', 3),

  // ── Category 4: Datenschutz & Compliance (weights: 3,2,2,2,2,2) ──────────
  manual('cat-4-rule-1', 4, 'Kein PII in Logs', 3),
  manual('cat-4-rule-2', 4, 'Consent-System DSGVO-konform', 2),
  manual('cat-4-rule-3', 4, 'Datenloeschung technisch moeglich', 2),
  manual('cat-4-rule-4', 4, 'Rechtsgrundlagen dokumentiert', 2),
  manual('cat-4-rule-5', 4, 'AVV mit Drittanbietern vorhanden', 2),
  { id: 'cat-4-rule-6', categoryId: 4, name: 'AI Act Klassifizierung durchgefuehrt', weight: 2, checkMode: 'documentation', automatable: true, check: checkAiActDocumentation },

  // ── Category 5: Datenbank (weights: 3,2,2,1,3,3) ─────────────────────────
  { id: 'cat-5-rule-1', categoryId: 5, name: 'FK-Constraints vorhanden', weight: 3, checkMode: 'documentation', automatable: true, check: checkFKConstraintsInMigrations },
  { id: 'cat-5-rule-2', categoryId: 5, name: 'Index-Strategie vorhanden', weight: 2, checkMode: 'documentation', automatable: true, check: checkIndexStrategyInMigrations },
  { id: 'cat-5-rule-3', categoryId: 5, name: 'Migrations-Tool im Einsatz', weight: 2, checkMode: 'file-system', automatable: true, check: checkMigrationsTool },
  manual('cat-5-rule-4', 5, 'JSON-Blobs vermieden fuer filterbare Daten', 1),
  manual('cat-5-rule-5', 5, 'Principle of Least Privilege fuer DB-User', 3),
  { id: 'cat-5-rule-6', categoryId: 5, name: 'BaaS: RLS aktiv + kein Service Key im Frontend', weight: 3, checkMode: 'repo-map', automatable: true, check: checkServiceKeyInFrontend },

  // ── Category 6: API-Design (weights: 2,2,2,3,2) ───────────────────────────
  { id: 'cat-6-rule-1', categoryId: 6, name: 'API-Versionierung vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkApiVersioning },
  { id: 'cat-6-rule-2', categoryId: 6, name: 'OpenAPI/Swagger-Spec vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkOpenApiSpec },
  { id: 'cat-6-rule-3', categoryId: 6, name: 'Vendor-Abstraktionsschicht', weight: 2, checkMode: 'repo-map', automatable: true, check: checkVendorAbstraction },
  manual('cat-6-rule-4', 6, 'Webhook-Signaturvalidierung', 3),
  manual('cat-6-rule-5', 6, 'Resilience-Patterns (Timeout, Retry, CB)', 2),

  // ── Category 7: Performance (weights: 3,2,2,2,2) ─────────────────────────
  manual('cat-7-rule-1', 7, 'Core Web Vitals im Zielbereich', 3),
  { id: 'cat-7-rule-2', categoryId: 7, name: 'Bundle-Groesse analysiert und optimiert', weight: 2, checkMode: 'file-system', automatable: true, check: checkBundleAnalyzer },
  manual('cat-7-rule-3', 7, 'Pagination fuer alle Listen-Endpunkte', 2),
  manual('cat-7-rule-4', 7, 'Caching-Strategie definiert und aktiv', 2),
  manual('cat-7-rule-5', 7, 'CDN fuer statische Assets', 2),

  // ── Category 8: Skalierbarkeit (weights: 3,2,2,2) ────────────────────────
  manual('cat-8-rule-1', 8, 'Stateless App-Server', 3),
  { id: 'cat-8-rule-2', categoryId: 8, name: 'Job-Queue fuer Background-Tasks', weight: 2, checkMode: 'file-system', automatable: true, check: checkJobQueuePresent },
  manual('cat-8-rule-3', 8, 'Lasttests durchgefuehrt + dokumentiert', 2),
  manual('cat-8-rule-4', 8, 'DB-Scaling-Plan vorhanden', 2),

  // ── Category 9: State Management (weights: 2,2,1) ────────────────────────
  manual('cat-9-rule-1', 9, 'State-Kategorien klar getrennt', 2),
  manual('cat-9-rule-2', 9, 'Kein Server-State im globalen Store', 2),
  manual('cat-9-rule-3', 9, 'Optimistic Updates mit Rollback', 1),

  // ── Category 10: Testing (weights: 3,2,2,3,2) ────────────────────────────
  { id: 'cat-10-rule-1', categoryId: 10, name: 'Unit-Test-Coverage >= 80%', weight: 3, checkMode: 'cli', automatable: true, check: cliChecks.checkUnitTestCoverage },
  { id: 'cat-10-rule-2', categoryId: 10, name: 'Integration Tests fuer API-Endpunkte', weight: 2, checkMode: 'file-system', automatable: true, check: checkIntegrationTests },
  { id: 'cat-10-rule-3', categoryId: 10, name: 'E2E Tests fuer kritische User-Journeys', weight: 2, checkMode: 'file-system', automatable: true, check: checkE2ETestsPresent },
  { id: 'cat-10-rule-4', categoryId: 10, name: 'Tests laufen in CI-Pipeline', weight: 3, checkMode: 'file-system', automatable: true, check: checkTestsInCIPipeline },
  { id: 'cat-10-rule-5', categoryId: 10, name: 'KI-Code-Gate: Coverage >= 90%', weight: 2, checkMode: 'file-system', automatable: true, check: checkKiCodeGate },

  // ── Category 11: CI/CD (weights: 3,2,3,2,2) ──────────────────────────────
  { id: 'cat-11-rule-1', categoryId: 11, name: 'CI-Pipeline vorhanden', weight: 3, checkMode: 'file-system', automatable: true, check: checkCIPipelinePresent },
  manual('cat-11-rule-2', 11, 'Staging-Umgebung vorhanden', 2),
  { id: 'cat-11-rule-3', categoryId: 11, name: 'Rollback-Plan definiert und getestet', weight: 3, checkMode: 'documentation', automatable: true, check: checkRunbooksPresent },
  { id: 'cat-11-rule-4', categoryId: 11, name: 'Infrastructure as Code', weight: 2, checkMode: 'file-system', automatable: true, check: checkInfrastructureAsCode },
  manual('cat-11-rule-5', 11, 'Zero-Downtime Deployments', 2),

  // ── Category 12: Observability (weights: 3,3,2,2,2) ─────────────────────
  { id: 'cat-12-rule-1', categoryId: 12, name: 'Structured Logging (JSON, kein PII)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkLoggerAbstraction },
  { id: 'cat-12-rule-2', categoryId: 12, name: 'Error-Tracking-Tool aktiv', weight: 3, checkMode: 'file-system', automatable: true, check: checkErrorTrackingSentry },
  manual('cat-12-rule-3', 12, 'Metrics gesammelt (APM)', 2),
  { id: 'cat-12-rule-4', categoryId: 12, name: 'Distributed Tracing (OpenTelemetry)', weight: 2, checkMode: 'file-system', automatable: true, check: checkDistributedTracing },
  manual('cat-12-rule-5', 12, 'Uptime-Monitoring + Alerting', 2),

  // ── Category 13: Backup & DR (weights: 3,3,3,2,2) ────────────────────────
  manual('cat-13-rule-1', 13, '3-2-1-Backup-Regel umgesetzt', 3),
  manual('cat-13-rule-2', 13, 'PITR fuer Produktionsdatenbank', 3),
  manual('cat-13-rule-3', 13, 'Restore regelmaessig getestet', 3),
  {
    id: 'cat-13-rule-4', categoryId: 13, name: 'DR-Runbook vorhanden und aktuell', weight: 2, checkMode: 'documentation', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkRunbooksPresent(ctx); return { ...r, ruleId: 'cat-13-rule-4' } },
  },
  {
    id: 'cat-13-rule-5', categoryId: 13, name: 'RTO/RPO definiert', weight: 2, checkMode: 'documentation', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkRunbooksPresent(ctx); return { ...r, ruleId: 'cat-13-rule-5' } },
  },

  // ── Category 14: Dependency Management (weights: 3,3,2,1) ────────────────
  { id: 'cat-14-rule-1', categoryId: 14, name: 'Lockfiles committed', weight: 3, checkMode: 'file-system', automatable: true, check: checkLockfileCommitted },
  { id: 'cat-14-rule-2', categoryId: 14, name: 'Vulnerability-Scans in CI', weight: 3, checkMode: 'file-system', automatable: true, check: checkVulnerabilityScanInCI },
  { id: 'cat-14-rule-3', categoryId: 14, name: 'Renovate / Dependabot konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkDependabotConfigured },
  { id: 'cat-14-rule-4', categoryId: 14, name: 'Node-Version fixiert', weight: 1, checkMode: 'file-system', automatable: true, check: checkNodeVersionFixed },

  // ── Category 15: Design System (weights: 2,2,2,1) ────────────────────────
  manual('cat-15-rule-1', 15, 'Design-Tokens definiert', 2),
  manual('cat-15-rule-2', 15, 'Komponentenbibliothek dokumentiert', 2),
  manual('cat-15-rule-3', 15, 'Kein Hard-Coding von Designwerten', 2),
  manual('cat-15-rule-4', 15, 'Component Lifecycle definiert', 1),

  // ── Category 16: Accessibility (weights: 3,2,1) ───────────────────────────
  manual('cat-16-rule-1', 16, 'WCAG 2.1 AA Konformitaet', 3),
  manual('cat-16-rule-2', 16, 'Tastaturnavigation funktioniert', 2),
  { id: 'cat-16-rule-3', categoryId: 16, name: 'Korrekte ARIA-Nutzung', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAriaAttributes },

  // ── Category 17: Internationalisierung (weights: 2,2,2) ──────────────────
  { id: 'cat-17-rule-1', categoryId: 17, name: 'i18n-Framework im Einsatz', weight: 2, checkMode: 'file-system', automatable: true, check: checkI18nFramework },
  manual('cat-17-rule-2', 17, 'Keine hardcodierten Strings', 2),
  manual('cat-17-rule-3', 17, 'Locale-sensitive Formatierung', 2),

  // ── Category 18: Dokumentation (weights: 2,2,2,1) ────────────────────────
  { id: 'cat-18-rule-1', categoryId: 18, name: 'README vollstaendig und aktuell', weight: 2, checkMode: 'documentation', automatable: true, check: checkReadmePresent },
  {
    id: 'cat-18-rule-2', categoryId: 18, name: 'ADRs vorhanden', weight: 2, checkMode: 'documentation', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkADRsPresent(ctx); return { ...r, ruleId: 'cat-18-rule-2' } },
  },
  manual('cat-18-rule-3', 18, 'API-Dokumentation generiert', 2),
  manual('cat-18-rule-4', 18, 'Onboarding < 30 Minuten erreichbar', 1),

  // ── Category 19: Git Governance (weights: 3,1,2) ──────────────────────────
  manual('cat-19-rule-1', 19, 'Branch-Schutz fuer main aktiv', 3),
  { id: 'cat-19-rule-2', categoryId: 19, name: 'Conventional Commits eingehalten', weight: 1, checkMode: 'documentation', automatable: true, check: checkConventionalCommits },
  { id: 'cat-19-rule-3', categoryId: 19, name: 'Semantic Versioning fuer Releases', weight: 2, checkMode: 'file-system', automatable: true, check: checkSemanticVersioning },

  // ── Category 20: Cost Awareness (weights: 3,2,2,1) ────────────────────────
  manual('cat-20-rule-1', 20, 'Cloud-Budget-Alerts konfiguriert', 3),
  { id: 'cat-20-rule-2', categoryId: 20, name: 'API Rate Limits / Token Budgets', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBudgetEnforcement },
  manual('cat-20-rule-3', 20, 'Vendor-Abstraktionsschicht', 2),
  manual('cat-20-rule-4', 20, 'Lizenz-Compliance geprueft', 1),

  // ── Category 21: PWA & Resilience (weights: 2,2,2) ───────────────────────
  { id: 'cat-21-rule-1', categoryId: 21, name: 'manifest.json valide', weight: 2, checkMode: 'file-system', automatable: true, check: checkPWAManifest },
  { id: 'cat-21-rule-2', categoryId: 21, name: 'Service Worker vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkServiceWorker },
  manual('cat-21-rule-3', 21, 'Offline-Fallback implementiert', 2),

  // ── Category 22: AI Integration (weights: 3,2,2,2) ───────────────────────
  manual('cat-22-rule-1', 22, 'Prompt Injection Defense', 3),
  { id: 'cat-22-rule-2', categoryId: 22, name: 'Token-Limits definiert und aktiv', weight: 2, checkMode: 'repo-map', automatable: true, check: checkTokenLimitsConfigured },
  manual('cat-22-rule-3', 22, 'Fallback-Strategie bei Modellausfall', 2),
  manual('cat-22-rule-4', 22, 'LLM-Output-Validierung vorhanden', 2),

  // ── Category 23: Infrastructure (weights: 3,2,2,2) ───────────────────────
  manual('cat-23-rule-1', 23, 'Multi-AZ Deployment', 3),
  { id: 'cat-23-rule-2', categoryId: 23, name: 'Health Checks konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkHealthEndpoint },
  manual('cat-23-rule-3', 23, 'Autoscaling konfiguriert', 2),
  manual('cat-23-rule-4', 23, 'Netzwerk-Segmentierung', 2),

  // ── Category 24: Supply Chain Security (weights: 3,2,2,2) ────────────────
  { id: 'cat-24-rule-1', categoryId: 24, name: 'SBOM generiert und gepflegt', weight: 3, checkMode: 'file-system', automatable: true, check: checkSBOMGenerated },
  manual('cat-24-rule-2', 24, 'Signed Builds', 2),
  {
    id: 'cat-24-rule-3', categoryId: 24, name: 'Dependency Provenance geprueft', weight: 2, checkMode: 'file-system', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkLockfileCommitted(ctx); return { ...r, ruleId: 'cat-24-rule-3' } },
  },
  manual('cat-24-rule-4', 24, 'KI-Dependency-Review', 2),

  // ── Category 25: Namenskonventionen (weights: 2,2,2,1,2,1) ───────────────
  { id: 'cat-25-rule-1', categoryId: 25, name: 'Datei-Namenskonventionen eingehalten', weight: 2, checkMode: 'repo-map', automatable: true, check: checkNamingConventions },
  {
    id: 'cat-25-rule-2', categoryId: 25, name: 'Keine Dateien > 300 Zeilen (Komponenten)', weight: 2, checkMode: 'repo-map', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkFileSizes(ctx); return { ...r, ruleId: 'cat-25-rule-2' } },
  },
  manual('cat-25-rule-3', 25, 'Keine unused imports', 2),
  manual('cat-25-rule-4', 25, 'Kein auskommentierter Code committed', 1),
  { id: 'cat-25-rule-5', categoryId: 25, name: 'Projektstruktur folgt Standard', weight: 2, checkMode: 'file-system', automatable: true, check: checkProjectStructure },
  manual('cat-25-rule-6', 25, 'Keine duplizierten Utility-Funktionen', 1),
]

export function getRulesForCategory(categoryId: number): AuditRule[] {
  return AUDIT_RULES.filter((r) => r.categoryId === categoryId)
}

export function getRuleById(id: string): AuditRule | undefined {
  return AUDIT_RULES.find((r) => r.id === id)
}
