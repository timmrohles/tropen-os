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
  checkProjectStructure,
} from './checkers/file-system-checker'
import {
  checkFileSizes, checkInputValidationCoverage,
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
import {
  checkDepCruiserCycles, checkLighthousePerf, checkLighthouseA11y,
  checkLighthouseBestPractices, checkLighthouseSeo,
  checkBundleSizes, checkEslintDetailed,
} from './checkers/external-tools-checker'
import {
  checkDependencyModel, checkForbiddenFolderNames, checkUnexpectedNamespaces,
} from './checkers/agent-architecture-checker'
import {
  checkAuthGuardConsistency, checkRlsCoverage, checkRateLimiting,
  checkCorsConfig, checkErrorLeakage, checkLlmInputSeparation,
  checkFileUploadValidation,
} from './checkers/agent-security-checker'
import {
  checkInjectionPatterns, checkAuthPatterns, checkDataExposurePatterns,
  checkClientSidePatterns, checkCryptoPatterns, checkBusinessLogicPatterns,
  checkAiSecurityPatterns, checkSupplyChainPatterns,
} from './checkers/security-scan-checker'
import {
  checkConsoleLogs, checkTraceIds, checkPiiInLogs, checkIncidentDocs,
} from './checkers/agent-observability-checker'
import {
  checkEmptyCatchBlocks, checkCommentedOutCode,
  checkLegalPages, checkVVTPresent, checkCookieConsent, checkAnalyticsPiiSeparation,
  checkSoftDeletePattern, checkMigrationNaming,
  checkWebhookSignatureValidation, checkTimeoutRetryPatterns,
  checkGlobalMutableState,
  checkVitestCoverageThresholds,
  checkStagingEnvironment,
  checkRestoreTestDocumented,
  checkCodeownersPresent, checkKiDependencyReviewDocs,
  checkHardcodedColors, checkCssVariablesFile,
  checkAxeCoreInstalled,
  checkCodeownersForGitGovernance,
  checkBudgetAlertsDocumented,
  checkLlmOutputValidation, checkAiProviderAbstraction,
  checkSignedBuilds,
  checkPaginationOnListEndpoints,
  checkAnalyticsEventSchema,
  checkErrorPages,
  checkStrictEquality,
  checkImageAltText,
} from './checkers/agent-committee-checker'
import {
  checkDsgvoPrivacyPage, checkDsgvoCookieConsentLibrary, checkDsgvoNoTrackingBeforeConsent,
  checkDsgvoPasswordHashing, checkDsgvoHstsHeader, checkDsgvoCspHeader,
  checkDsgvoDataExportEndpoint, checkDsgvoAccountDeletion,
  checkBfsgAccessibilityStatement, checkBfsgFeedbackMechanism,
  checkBfsgHtmlLang, checkBfsgSkipNavLink, checkBfsgAriaLiveRegions,
  checkAiActRiskClassification, checkAiActDisclosure,
  checkAiActDecisionLogging, checkAiActPurposeDocs, checkAiActProhibitedPractices,
} from './checkers/agent-regulatory-checker'

function manual(id: string, categoryId: number, name: string, weight: 1 | 2 | 3): AuditRule {
  return { id, categoryId, name, weight, checkMode: 'manual', automatable: false }
}

export const AUDIT_RULES: AuditRule[] = [
  // ── Category 1: Architektur (weights: 3, 3, 2, 1, 2) ──────────────────────
  manual('cat-1-rule-1', 1, 'Klare Schichtenarchitektur erkennbar', 3),
  { id: 'cat-1-rule-2', categoryId: 1, name: 'Business-Logik nicht in UI/Routes', weight: 3, checkMode: 'repo-map', automatable: true, check: checkBusinessLogicSeparation },
  { id: 'cat-1-rule-3', categoryId: 1, name: 'Keine zirkulaeren Abhaengigkeiten', weight: 2, checkMode: 'external-tool', automatable: true, check: checkDepCruiserCycles, agentSource: 'architecture', agentRuleId: 'R1' },
  { id: 'cat-1-rule-4', categoryId: 1, name: 'Dateien < 300 Zeilen (Ausnahmen dokumentiert)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkFileSizes, agentSource: 'architecture', agentRuleId: 'R3', enforcement: 'blocked' },
  { id: 'cat-1-rule-5', categoryId: 1, name: 'ADRs vorhanden fuer Kerntechnologieentscheidungen', weight: 2, checkMode: 'documentation', automatable: true, check: checkADRsPresent, agentSource: 'architecture', agentRuleId: 'R8' },
  // Architecture Agent: R1 (dependency model), R2 (folder names), R7 (namespaces)
  { id: 'cat-1-rule-6', categoryId: 1, name: 'Dependency-Modell durch Tooling erzwungen', weight: 2, checkMode: 'file-system', automatable: true, check: checkDependencyModel, agentSource: 'architecture', agentRuleId: 'R1', enforcement: 'blocked' },
  { id: 'cat-1-rule-7', categoryId: 1, name: 'Keine verbotenen Ordnernamen', weight: 1, checkMode: 'repo-map', automatable: true, check: checkForbiddenFolderNames, agentSource: 'architecture', agentRuleId: 'R2', enforcement: 'reviewed' },
  { id: 'cat-1-rule-8', categoryId: 1, name: 'Keine unerwarteten Top-Level-Verzeichnisse', weight: 1, checkMode: 'repo-map', automatable: true, check: checkUnexpectedNamespaces, agentSource: 'architecture', agentRuleId: 'R7', enforcement: 'reviewed' },

  // ── Category 2: Code-Qualitaet (weights: 3, 2, 1, 1, 2, 2) ────────────────
  { id: 'cat-2-rule-1', categoryId: 2, name: 'TypeScript Strict Mode aktiv', weight: 3, checkMode: 'file-system', automatable: true, check: checkTypeScriptStrictMode },
  { id: 'cat-2-rule-2', categoryId: 2, name: 'ESLint konfiguriert und aktiv', weight: 2, checkMode: 'file-system', automatable: true, check: checkEsLintConfigured },
  { id: 'cat-2-rule-3', categoryId: 2, name: 'Prettier konfiguriert', weight: 1, checkMode: 'file-system', automatable: true, check: checkPrettierConfigured },
  manual('cat-2-rule-4', 2, 'Magic Numbers/Strings minimiert', 1),
  manual('cat-2-rule-5', 2, 'Explizites Error Handling durchgaengig', 2),
  manual('cat-2-rule-6', 2, 'Cognitive Complexity <= 15', 2),
  { id: 'cat-2-rule-9', categoryId: 2, name: 'ESLint: keine Violations (detailliert)', weight: 2, checkMode: 'external-tool', automatable: true, check: checkEslintDetailed, agentSource: 'code-style' },
  // Code Style Agent R2, R9, R10
  { id: 'cat-2-rule-7', categoryId: 2, name: 'Keine leeren catch-Bloecke', weight: 2, checkMode: 'repo-map', automatable: true, check: checkEmptyCatchBlocks, agentSource: 'code-style', agentRuleId: 'R2', enforcement: 'blocked' },
  { id: 'cat-2-rule-8', categoryId: 2, name: 'Kein auskommentierter Code-Block > 2 Zeilen', weight: 1, checkMode: 'repo-map', automatable: true, check: checkCommentedOutCode, agentSource: 'code-style', agentRuleId: 'R9', enforcement: 'reviewed' },
  { id: 'cat-2-rule-10', categoryId: 2, name: 'Strikte Gleichheitsoperatoren (=== statt ==)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkStrictEquality, agentSource: 'code-style', agentRuleId: 'R10', enforcement: 'blocked' },
  { id: 'cat-2-rule-11', categoryId: 2, name: 'Lighthouse Best Practices', weight: 2, checkMode: 'external-tool', automatable: true, check: checkLighthouseBestPractices, agentSource: 'lighthouse-best-practices' },

  // ── Category 3: Sicherheit (weights: 3,3,3,2,2,3,2,3,2,2,2,3,2,3) ────────
  manual('cat-3-rule-1',  3, 'OWASP Top 10 beruecksichtigt', 3),
  { id: 'cat-3-rule-2',  categoryId: 3, name: 'Serverseitige Input-Validierung', weight: 3, checkMode: 'repo-map', automatable: true, check: checkInputValidationCoverage, agentSource: 'security', agentRuleId: 'R2', enforcement: 'blocked' },
  { id: 'cat-3-rule-3',  categoryId: 3, name: 'Keine Secrets im Repo / History', weight: 3, checkMode: 'cli', automatable: true, check: cliChecks.checkNoSecretsInRepo, agentSource: 'security', agentRuleId: 'R1', enforcement: 'blocked' },
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
  // Security Agent: R3 (auth guard), R4 (RLS), R6 (rate limit), R7 (CORS), R8 (error leak), R9 (LLM)
  { id: 'cat-3-rule-15', categoryId: 3, name: 'Auth-Check in allen API-Routes', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAuthGuardConsistency, agentSource: 'security', agentRuleId: 'R3', enforcement: 'blocked' },
  { id: 'cat-3-rule-16', categoryId: 3, name: 'RLS-Coverage in Migrations', weight: 3, checkMode: 'documentation', automatable: true, check: checkRlsCoverage, agentSource: 'security', agentRuleId: 'R4', enforcement: 'blocked' },
  { id: 'cat-3-rule-17', categoryId: 3, name: 'Rate Limiting konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkRateLimiting, agentSource: 'security', agentRuleId: 'R6', enforcement: 'reviewed' },
  { id: 'cat-3-rule-18', categoryId: 3, name: 'CORS: keine Wildcard-Origin', weight: 2, checkMode: 'file-system', automatable: true, check: checkCorsConfig, agentSource: 'security', agentRuleId: 'R7', enforcement: 'blocked' },
  { id: 'cat-3-rule-19', categoryId: 3, name: 'Keine Error-Internals in API-Responses', weight: 2, checkMode: 'repo-map', automatable: true, check: checkErrorLeakage, agentSource: 'security', agentRuleId: 'R8', enforcement: 'blocked' },
  // Security Agent R10 (file upload validation)
  { id: 'cat-3-rule-26', categoryId: 3, name: 'File-Upload-Validierung (Typ, Groesse, Pfad)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkFileUploadValidation, agentSource: 'security', agentRuleId: 'R10', enforcement: 'reviewed' },
  // Security Scan Agent: R1–R6
  { id: 'cat-3-rule-20', categoryId: 3, name: 'Keine Injection-Pattern (SQL/Cmd/Path/SSRF/XSS)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkInjectionPatterns, agentSource: 'security-scan', agentRuleId: 'R1', enforcement: 'blocked' },
  { id: 'cat-3-rule-21', categoryId: 3, name: 'Keine unsicheren Auth-Pattern (Secrets/Tokens)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAuthPatterns, agentSource: 'security-scan', agentRuleId: 'R2', enforcement: 'blocked' },
  { id: 'cat-3-rule-22', categoryId: 3, name: 'Kein Data Exposure (Debug/Stack-Trace/Over-Fetch)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkDataExposurePatterns, agentSource: 'security-scan', agentRuleId: 'R3', enforcement: 'reviewed' },
  { id: 'cat-3-rule-23', categoryId: 3, name: 'Kein Client-Side Risk (eval/Prototype-Pollution)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkClientSidePatterns, agentSource: 'security-scan', agentRuleId: 'R4', enforcement: 'blocked' },
  { id: 'cat-3-rule-24', categoryId: 3, name: 'Keine schwachen Krypto-Pattern (MD5/Math.random)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkCryptoPatterns, agentSource: 'security-scan', agentRuleId: 'R7', enforcement: 'reviewed' },
  { id: 'cat-3-rule-25', categoryId: 3, name: 'Keine Business-Logic-Luecken (Mass-Assignment/IDOR)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkBusinessLogicPatterns, agentSource: 'security-scan', agentRuleId: 'R5', enforcement: 'reviewed' },

  // ── Category 4: Datenschutz & Compliance (weights: 3,2,2,2,2,2) ──────────
  manual('cat-4-rule-1', 4, 'Kein PII in Logs', 3),
  manual('cat-4-rule-2', 4, 'Consent-System DSGVO-konform', 2),
  manual('cat-4-rule-3', 4, 'Datenloeschung technisch moeglich', 2),
  manual('cat-4-rule-4', 4, 'Rechtsgrundlagen dokumentiert', 2),
  manual('cat-4-rule-5', 4, 'AVV mit Drittanbietern vorhanden', 2),
  { id: 'cat-4-rule-6', categoryId: 4, name: 'AI Act Klassifizierung durchgefuehrt', weight: 2, checkMode: 'documentation', automatable: true, check: checkAiActDocumentation },
  // Legal Agent R1, R2, R3; Analytics Agent R3
  { id: 'cat-4-rule-7', categoryId: 4, name: 'Impressum + Datenschutz-Seiten vorhanden', weight: 3, checkMode: 'file-system', automatable: true, check: checkLegalPages, agentSource: 'legal', agentRuleId: 'R1', enforcement: 'blocked' },
  { id: 'cat-4-rule-8', categoryId: 4, name: 'VVT (Verarbeitungsverzeichnis) in docs/ vorhanden', weight: 2, checkMode: 'documentation', automatable: true, check: checkVVTPresent, agentSource: 'legal', agentRuleId: 'R2', enforcement: 'reviewed' },
  { id: 'cat-4-rule-9', categoryId: 4, name: 'Cookie-Consent implementiert', weight: 2, checkMode: 'repo-map', automatable: true, check: checkCookieConsent, agentSource: 'legal', agentRuleId: 'R3', enforcement: 'blocked' },
  { id: 'cat-4-rule-10', categoryId: 4, name: 'PII in Analytics-Events getrennt / anonymisiert', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAnalyticsPiiSeparation, agentSource: 'analytics', agentRuleId: 'R3', enforcement: 'reviewed' },
  // DSGVO Deep Agent: R1, R4, R5, R10, R11, R12, R13, R15–R18
  { id: 'cat-4-rule-11', categoryId: 4, name: 'DSGVO: Datenschutzseite vorhanden (Art. 13)', weight: 3, checkMode: 'file-system', automatable: true, check: checkDsgvoPrivacyPage, agentSource: 'dsgvo', agentRuleId: 'R1', enforcement: 'blocked' },
  { id: 'cat-4-rule-12', categoryId: 4, name: 'DSGVO: Cookie Consent Library (ePrivacy Art. 5(3))', weight: 2, checkMode: 'file-system', automatable: true, check: checkDsgvoCookieConsentLibrary, agentSource: 'dsgvo', agentRuleId: 'R4', enforcement: 'blocked' },
  { id: 'cat-4-rule-13', categoryId: 4, name: 'DSGVO: Kein Tracking vor Consent (Art. 7)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkDsgvoNoTrackingBeforeConsent, agentSource: 'dsgvo', agentRuleId: 'R5', enforcement: 'blocked' },
  { id: 'cat-4-rule-14', categoryId: 4, name: 'DSGVO: Passwort-Hashing (Art. 32)', weight: 3, checkMode: 'file-system', automatable: true, check: checkDsgvoPasswordHashing, agentSource: 'dsgvo', agentRuleId: 'R10', enforcement: 'blocked' },
  { id: 'cat-4-rule-15', categoryId: 4, name: 'DSGVO: HSTS-Header konfiguriert (Art. 32)', weight: 2, checkMode: 'file-system', automatable: true, check: checkDsgvoHstsHeader, agentSource: 'dsgvo', agentRuleId: 'R11', enforcement: 'reviewed' },
  { id: 'cat-4-rule-16', categoryId: 4, name: 'DSGVO: CSP-Header konfiguriert (Art. 32)', weight: 2, checkMode: 'file-system', automatable: true, check: checkDsgvoCspHeader, agentSource: 'dsgvo', agentRuleId: 'R17', enforcement: 'reviewed' },
  { id: 'cat-4-rule-17', categoryId: 4, name: 'DSGVO: Datenexport-Endpunkt (Art. 20 — Portabilitaet)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkDsgvoDataExportEndpoint, agentSource: 'dsgvo', agentRuleId: 'R12', enforcement: 'reviewed' },
  { id: 'cat-4-rule-18', categoryId: 4, name: 'DSGVO: Account-Loeschung (Art. 17 — Recht auf Vergessenwerden)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkDsgvoAccountDeletion, agentSource: 'dsgvo', agentRuleId: 'R13', enforcement: 'blocked' },

  // ── Category 5: Datenbank (weights: 3,2,2,1,3,3) ─────────────────────────
  { id: 'cat-5-rule-1', categoryId: 5, name: 'FK-Constraints vorhanden', weight: 3, checkMode: 'documentation', automatable: true, check: checkFKConstraintsInMigrations },
  { id: 'cat-5-rule-2', categoryId: 5, name: 'Index-Strategie vorhanden', weight: 2, checkMode: 'documentation', automatable: true, check: checkIndexStrategyInMigrations },
  { id: 'cat-5-rule-3', categoryId: 5, name: 'Migrations-Tool im Einsatz', weight: 2, checkMode: 'file-system', automatable: true, check: checkMigrationsTool },
  manual('cat-5-rule-4', 5, 'JSON-Blobs vermieden fuer filterbare Daten', 1),
  manual('cat-5-rule-5', 5, 'Principle of Least Privilege fuer DB-User', 3),
  { id: 'cat-5-rule-6', categoryId: 5, name: 'BaaS: RLS aktiv + kein Service Key im Frontend', weight: 3, checkMode: 'repo-map', automatable: true, check: checkServiceKeyInFrontend, agentSource: 'security', agentRuleId: 'R4', enforcement: 'blocked' },
  // Database Agent R4, R6
  { id: 'cat-5-rule-7', categoryId: 5, name: 'Soft-Delete-Pattern (deleted_at) statt DELETE', weight: 2, checkMode: 'documentation', automatable: true, check: checkSoftDeletePattern, agentSource: 'database', agentRuleId: 'R4', enforcement: 'reviewed' },
  { id: 'cat-5-rule-8', categoryId: 5, name: 'Migrations-Naming konsistent', weight: 1, checkMode: 'documentation', automatable: true, check: checkMigrationNaming, agentSource: 'database', agentRuleId: 'R6', enforcement: 'reviewed' },

  // ── Category 6: API-Design (weights: 2,2,2,3,2) ───────────────────────────
  { id: 'cat-6-rule-1', categoryId: 6, name: 'API-Versionierung vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkApiVersioning },
  { id: 'cat-6-rule-2', categoryId: 6, name: 'OpenAPI/Swagger-Spec vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkOpenApiSpec },
  { id: 'cat-6-rule-3', categoryId: 6, name: 'Vendor-Abstraktionsschicht', weight: 2, checkMode: 'repo-map', automatable: true, check: checkVendorAbstraction },
  manual('cat-6-rule-4', 6, 'Webhook-Signaturvalidierung', 3),
  manual('cat-6-rule-5', 6, 'Resilience-Patterns (Timeout, Retry, CB)', 2),
  // API Agent R4, R5
  { id: 'cat-6-rule-6', categoryId: 6, name: 'Webhook-Signaturvalidierung implementiert', weight: 3, checkMode: 'repo-map', automatable: true, check: checkWebhookSignatureValidation, agentSource: 'api', agentRuleId: 'R4', enforcement: 'blocked' },
  { id: 'cat-6-rule-7', categoryId: 6, name: 'Timeout/Retry bei externen Calls', weight: 2, checkMode: 'repo-map', automatable: true, check: checkTimeoutRetryPatterns, agentSource: 'api', agentRuleId: 'R5', enforcement: 'reviewed' },

  // ── Category 7: Performance (weights: 3,2,2,2,2) ─────────────────────────
  { id: 'cat-7-rule-1', categoryId: 7, name: 'Core Web Vitals im Zielbereich', weight: 3, checkMode: 'external-tool', automatable: true, check: checkLighthousePerf, agentSource: 'performance', agentRuleId: 'R1' },
  { id: 'cat-7-rule-2', categoryId: 7, name: 'Bundle-Groesse analysiert und optimiert', weight: 2, checkMode: 'external-tool', automatable: true, check: checkBundleSizes, agentSource: 'performance' },
  manual('cat-7-rule-3', 7, 'Pagination fuer alle Listen-Endpunkte', 2),
  manual('cat-7-rule-4', 7, 'Caching-Strategie definiert und aktiv', 2),
  manual('cat-7-rule-5', 7, 'CDN fuer statische Assets', 2),
  // Performance Agent R3
  { id: 'cat-7-rule-6', categoryId: 7, name: 'Pagination in GET-Endpunkten erkennbar', weight: 2, checkMode: 'repo-map', automatable: true, check: checkPaginationOnListEndpoints, agentSource: 'performance', agentRuleId: 'R3', enforcement: 'reviewed' },

  // ── Category 8: Skalierbarkeit (weights: 3,2,2,2) ────────────────────────
  manual('cat-8-rule-1', 8, 'Stateless App-Server', 3),
  { id: 'cat-8-rule-2', categoryId: 8, name: 'Job-Queue fuer Background-Tasks', weight: 2, checkMode: 'file-system', automatable: true, check: checkJobQueuePresent },
  manual('cat-8-rule-3', 8, 'Lasttests durchgefuehrt + dokumentiert', 2),
  manual('cat-8-rule-4', 8, 'DB-Scaling-Plan vorhanden', 2),
  // Scalability Agent R1
  { id: 'cat-8-rule-5', categoryId: 8, name: 'Kein globaler mutierbarer State in lib/', weight: 2, checkMode: 'repo-map', automatable: true, check: checkGlobalMutableState, agentSource: 'scalability', agentRuleId: 'R1', enforcement: 'reviewed' },

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
  // Testing Agent R2
  { id: 'cat-10-rule-6', categoryId: 10, name: 'vitest Coverage-Thresholds konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkVitestCoverageThresholds, agentSource: 'testing', agentRuleId: 'R2', enforcement: 'blocked' },

  // ── Category 11: CI/CD (weights: 3,2,3,2,2) ──────────────────────────────
  { id: 'cat-11-rule-1', categoryId: 11, name: 'CI-Pipeline vorhanden', weight: 3, checkMode: 'file-system', automatable: true, check: checkCIPipelinePresent },
  manual('cat-11-rule-2', 11, 'Staging-Umgebung vorhanden', 2),
  { id: 'cat-11-rule-3', categoryId: 11, name: 'Rollback-Plan definiert und getestet', weight: 3, checkMode: 'documentation', automatable: true, check: checkRunbooksPresent },
  { id: 'cat-11-rule-4', categoryId: 11, name: 'Infrastructure as Code', weight: 2, checkMode: 'file-system', automatable: true, check: checkInfrastructureAsCode },
  manual('cat-11-rule-5', 11, 'Zero-Downtime Deployments', 2),
  // Platform Agent R2
  { id: 'cat-11-rule-6', categoryId: 11, name: 'Staging/Preview-Umgebung konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkStagingEnvironment, agentSource: 'platform', agentRuleId: 'R2', enforcement: 'reviewed' },

  // ── Category 12: Observability (weights: 3,3,2,2,2) ─────────────────────
  { id: 'cat-12-rule-1', categoryId: 12, name: 'Structured Logging (JSON, kein PII)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkLoggerAbstraction, agentSource: 'observability', agentRuleId: 'R1', enforcement: 'blocked' },
  { id: 'cat-12-rule-2', categoryId: 12, name: 'Error-Tracking-Tool aktiv', weight: 3, checkMode: 'file-system', automatable: true, check: checkErrorTrackingSentry },
  manual('cat-12-rule-3', 12, 'Metrics gesammelt (APM)', 2),
  { id: 'cat-12-rule-4', categoryId: 12, name: 'Distributed Tracing (OpenTelemetry)', weight: 2, checkMode: 'file-system', automatable: true, check: checkDistributedTracing },
  manual('cat-12-rule-5', 12, 'Uptime-Monitoring + Alerting', 2),
  // Observability Agent: R1 (console logs), R4 (trace IDs), R8 (PII in logs)
  { id: 'cat-12-rule-6', categoryId: 12, name: 'Keine console.* in Produktionscode', weight: 2, checkMode: 'repo-map', automatable: true, check: checkConsoleLogs, agentSource: 'observability', agentRuleId: 'R1', enforcement: 'blocked' },
  { id: 'cat-12-rule-7', categoryId: 12, name: 'Trace-/Request-IDs in Middleware', weight: 2, checkMode: 'file-system', automatable: true, check: checkTraceIds, agentSource: 'observability', agentRuleId: 'R4', enforcement: 'reviewed' },
  { id: 'cat-12-rule-8', categoryId: 12, name: 'Kein PII in Log-Aufrufen', weight: 3, checkMode: 'repo-map', automatable: true, check: checkPiiInLogs, agentSource: 'observability', agentRuleId: 'R8', enforcement: 'blocked' },
  // Analytics Agent R1
  { id: 'cat-12-rule-9', categoryId: 12, name: 'Analytics-Event-Schema typisiert', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAnalyticsEventSchema, agentSource: 'analytics', agentRuleId: 'R1', enforcement: 'advisory' },

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
  // Observability Agent R7 — incident response process documented
  { id: 'cat-13-rule-6', categoryId: 13, name: 'Incident-Response-Prozess dokumentiert', weight: 2, checkMode: 'documentation', automatable: true, check: checkIncidentDocs, agentSource: 'observability', agentRuleId: 'R7', enforcement: 'advisory' },
  // Backup DR Agent R3
  { id: 'cat-13-rule-7', categoryId: 13, name: 'Restore-Test dokumentiert und regelmaessig', weight: 2, checkMode: 'documentation', automatable: true, check: checkRestoreTestDocumented, agentSource: 'backup-dr', agentRuleId: 'R3', enforcement: 'reviewed' },

  // ── Category 14: Dependency Management (weights: 3,3,2,1) ────────────────
  { id: 'cat-14-rule-1', categoryId: 14, name: 'Lockfiles committed', weight: 3, checkMode: 'file-system', automatable: true, check: checkLockfileCommitted },
  { id: 'cat-14-rule-2', categoryId: 14, name: 'Vulnerability-Scans in CI', weight: 3, checkMode: 'file-system', automatable: true, check: checkVulnerabilityScanInCI },
  { id: 'cat-14-rule-3', categoryId: 14, name: 'Renovate / Dependabot konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkDependabotConfigured },
  { id: 'cat-14-rule-4', categoryId: 14, name: 'Node-Version fixiert', weight: 1, checkMode: 'file-system', automatable: true, check: checkNodeVersionFixed },
  // Dependencies Agent R5; Git Governance Agent R3
  { id: 'cat-14-rule-5', categoryId: 14, name: 'CODEOWNERS-Datei vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkCodeownersPresent, agentSource: 'git-governance', agentRuleId: 'R3', enforcement: 'reviewed' },
  { id: 'cat-14-rule-6', categoryId: 14, name: 'KI-Dependency-Review-Prozess dokumentiert', weight: 1, checkMode: 'documentation', automatable: true, check: checkKiDependencyReviewDocs, agentSource: 'dependencies', agentRuleId: 'R5', enforcement: 'advisory' },

  // ── Category 15: Design System (weights: 2,2,2,1) ────────────────────────
  manual('cat-15-rule-1', 15, 'Design-Tokens definiert', 2),
  manual('cat-15-rule-2', 15, 'Komponentenbibliothek dokumentiert', 2),
  manual('cat-15-rule-3', 15, 'Kein Hard-Coding von Designwerten', 2),
  manual('cat-15-rule-4', 15, 'Component Lifecycle definiert', 1),
  // Design System Agent R3, R1
  { id: 'cat-15-rule-5', categoryId: 15, name: 'Keine Hex-Farben direkt in TSX/CSS-Modulen', weight: 2, checkMode: 'repo-map', automatable: true, check: checkHardcodedColors, agentSource: 'design-system', agentRuleId: 'R3', enforcement: 'reviewed' },
  { id: 'cat-15-rule-6', categoryId: 15, name: 'CSS-Variables-Datei (globals.css/tokens) vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkCssVariablesFile, agentSource: 'design-system', agentRuleId: 'R1', enforcement: 'reviewed' },

  // ── Category 16: Accessibility (weights: 3,2,1) ───────────────────────────
  { id: 'cat-16-rule-1', categoryId: 16, name: 'WCAG 2.1 AA Konformitaet (Lighthouse)', weight: 3, checkMode: 'external-tool', automatable: true, check: checkLighthouseA11y, agentSource: 'accessibility', agentRuleId: 'R1' },
  manual('cat-16-rule-2', 16, 'Tastaturnavigation funktioniert', 2),
  { id: 'cat-16-rule-3', categoryId: 16, name: 'Korrekte ARIA-Nutzung', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAriaAttributes },
  // Accessibility Agent R2
  { id: 'cat-16-rule-4', categoryId: 16, name: 'axe-core fuer Accessibility-Tests installiert', weight: 2, checkMode: 'file-system', automatable: true, check: checkAxeCoreInstalled, agentSource: 'accessibility', agentRuleId: 'R2', enforcement: 'reviewed' },
  // BFSG Deep Agent: R1 (statement), R2 (feedback), R5 (html lang), R6 (skip nav), R11 (aria-live)
  { id: 'cat-16-rule-5', categoryId: 16, name: 'BFSG: Erklaerung zur Barrierefreiheit vorhanden', weight: 3, checkMode: 'file-system', automatable: true, check: checkBfsgAccessibilityStatement, agentSource: 'bfsg', agentRuleId: 'R1', enforcement: 'blocked' },
  { id: 'cat-16-rule-6', categoryId: 16, name: 'BFSG: Feedback-Mechanismus in Erklaerung (§ 3 BFSG)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBfsgFeedbackMechanism, agentSource: 'bfsg', agentRuleId: 'R2', enforcement: 'reviewed' },
  { id: 'cat-16-rule-7', categoryId: 16, name: 'BFSG: HTML lang-Attribut gesetzt (WCAG 2.1 SC 3.1.1)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBfsgHtmlLang, agentSource: 'bfsg', agentRuleId: 'R5', enforcement: 'blocked' },
  { id: 'cat-16-rule-8', categoryId: 16, name: 'BFSG: Skip-Navigation-Link vorhanden (WCAG 2.1 SC 2.4.1)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBfsgSkipNavLink, agentSource: 'bfsg', agentRuleId: 'R6', enforcement: 'reviewed' },
  { id: 'cat-16-rule-9', categoryId: 16, name: 'BFSG: ARIA live-Regions fuer dynamische Inhalte', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBfsgAriaLiveRegions, agentSource: 'bfsg', agentRuleId: 'R11', enforcement: 'reviewed' },
  // Accessibility Agent R9 (deepened)
  { id: 'cat-16-rule-10', categoryId: 16, name: 'Accessibility: <img> mit alt-Text (WCAG 2.1 SC 1.1.1)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkImageAltText, agentSource: 'accessibility', agentRuleId: 'R9', enforcement: 'blocked' },

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
  { id: 'cat-18-rule-5', categoryId: 18, name: 'Lighthouse SEO', weight: 1, checkMode: 'external-tool', automatable: true, check: checkLighthouseSeo, agentSource: 'lighthouse-seo' },

  // ── Category 19: Git Governance (weights: 3,1,2) ──────────────────────────
  manual('cat-19-rule-1', 19, 'Branch-Schutz fuer main aktiv', 3),
  { id: 'cat-19-rule-2', categoryId: 19, name: 'Conventional Commits eingehalten', weight: 1, checkMode: 'documentation', automatable: true, check: checkConventionalCommits },
  { id: 'cat-19-rule-3', categoryId: 19, name: 'Semantic Versioning fuer Releases', weight: 2, checkMode: 'file-system', automatable: true, check: checkSemanticVersioning },
  // Git Governance Agent R3
  { id: 'cat-19-rule-4', categoryId: 19, name: 'CODEOWNERS automatische Review-Zuweisung', weight: 2, checkMode: 'file-system', automatable: true, check: checkCodeownersForGitGovernance, agentSource: 'git-governance', agentRuleId: 'R3', enforcement: 'reviewed' },

  // ── Category 20: Cost Awareness (weights: 3,2,2,1) ────────────────────────
  manual('cat-20-rule-1', 20, 'Cloud-Budget-Alerts konfiguriert', 3),
  { id: 'cat-20-rule-2', categoryId: 20, name: 'API Rate Limits / Token Budgets', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBudgetEnforcement },
  manual('cat-20-rule-3', 20, 'Vendor-Abstraktionsschicht', 2),
  manual('cat-20-rule-4', 20, 'Lizenz-Compliance geprueft', 1),
  // Cost Awareness Agent R1
  { id: 'cat-20-rule-5', categoryId: 20, name: 'Budget-Alerts dokumentiert und konfiguriert', weight: 2, checkMode: 'documentation', automatable: true, check: checkBudgetAlertsDocumented, agentSource: 'cost-awareness', agentRuleId: 'R1', enforcement: 'reviewed' },

  // ── Category 21: PWA & Resilience (weights: 2,2,2) ───────────────────────
  { id: 'cat-21-rule-1', categoryId: 21, name: 'manifest.json valide', weight: 2, checkMode: 'file-system', automatable: true, check: checkPWAManifest },
  { id: 'cat-21-rule-2', categoryId: 21, name: 'Service Worker vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkServiceWorker },
  manual('cat-21-rule-3', 21, 'Offline-Fallback implementiert', 2),
  // Error Handling Agent — error pages
  { id: 'cat-21-rule-4', categoryId: 21, name: '404 + Error-Seiten vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkErrorPages, agentSource: 'error-handling', agentRuleId: 'R1', enforcement: 'reviewed' },

  // ── Category 22: AI Integration (weights: 3,2,2,2) ───────────────────────
  manual('cat-22-rule-1', 22, 'Prompt Injection Defense', 3),
  { id: 'cat-22-rule-2', categoryId: 22, name: 'Token-Limits definiert und aktiv', weight: 2, checkMode: 'repo-map', automatable: true, check: checkTokenLimitsConfigured },
  manual('cat-22-rule-3', 22, 'Fallback-Strategie bei Modellausfall', 2),
  manual('cat-22-rule-4', 22, 'LLM-Output-Validierung vorhanden', 2),
  // Security Agent R9 — no user input in system prompts
  { id: 'cat-22-rule-5', categoryId: 22, name: 'User-Input nicht in System-Prompt', weight: 3, checkMode: 'repo-map', automatable: true, check: checkLlmInputSeparation, agentSource: 'security', agentRuleId: 'R9', enforcement: 'blocked' },
  // AI Integration Agent R4, R2
  { id: 'cat-22-rule-6', categoryId: 22, name: 'LLM-Output-Validierung erkennbar', weight: 2, checkMode: 'repo-map', automatable: true, check: checkLlmOutputValidation, agentSource: 'ai-integration', agentRuleId: 'R4', enforcement: 'reviewed' },
  { id: 'cat-22-rule-7', categoryId: 22, name: 'AI-Provider ueber Abstraktionsschicht angebunden', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAiProviderAbstraction, agentSource: 'ai-integration', agentRuleId: 'R2', enforcement: 'reviewed' },
  // Security Scan Agent: R8
  { id: 'cat-22-rule-8', categoryId: 22, name: 'Kein AI-Security-Risk (Prompt-Injection/Output-Eval)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAiSecurityPatterns, agentSource: 'security-scan', agentRuleId: 'R8', enforcement: 'blocked' },
  // AI Act Deep Agent: R2 (risk classification), R3 (disclosure), R6 (decision logging), R9 (purpose docs), R10 (prohibited)
  { id: 'cat-22-rule-9', categoryId: 22, name: 'AI Act: Risikoeinstufung dokumentiert (Art. 9)', weight: 2, checkMode: 'documentation', automatable: true, check: checkAiActRiskClassification, agentSource: 'ai-act', agentRuleId: 'R2', enforcement: 'reviewed' },
  { id: 'cat-22-rule-10', categoryId: 22, name: 'AI Act: KI-Interaktionen erkennbar (Art. 52)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAiActDisclosure, agentSource: 'ai-act', agentRuleId: 'R3', enforcement: 'reviewed' },
  { id: 'cat-22-rule-11', categoryId: 22, name: 'AI Act: KI-Entscheidungs-Logging (Art. 12)', weight: 2, checkMode: 'documentation', automatable: true, check: checkAiActDecisionLogging, agentSource: 'ai-act', agentRuleId: 'R6', enforcement: 'reviewed' },
  { id: 'cat-22-rule-12', categoryId: 22, name: 'AI Act: Zweckbeschreibung dokumentiert (Art. 13)', weight: 1, checkMode: 'documentation', automatable: true, check: checkAiActPurposeDocs, agentSource: 'ai-act', agentRuleId: 'R9', enforcement: 'advisory' },
  { id: 'cat-22-rule-13', categoryId: 22, name: 'AI Act: Keine verbotenen Praktiken (Art. 5)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAiActProhibitedPractices, agentSource: 'ai-act', agentRuleId: 'R10', enforcement: 'blocked' },

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
  // Dependencies Agent R6
  { id: 'cat-24-rule-5', categoryId: 24, name: 'Signed Builds / Build-Provenance konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkSignedBuilds, agentSource: 'dependencies', agentRuleId: 'R6', enforcement: 'advisory' },
  // Security Scan Agent: R9
  { id: 'cat-24-rule-6', categoryId: 24, name: 'Kein Supply-Chain-Risiko (Unpinned/Git-URL/Postinstall)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkSupplyChainPatterns, agentSource: 'security-scan', agentRuleId: 'R9', enforcement: 'reviewed' },

  // ── Category 25: Namenskonventionen (weights: 2,2,2,1,2,1) ───────────────
  { id: 'cat-25-rule-1', categoryId: 25, name: 'Datei-Namenskonventionen eingehalten', weight: 2, checkMode: 'repo-map', automatable: true, check: checkNamingConventions },
  {
    id: 'cat-25-rule-2', categoryId: 25, name: 'Keine Dateien > 300 Zeilen (Komponenten)', weight: 2, checkMode: 'repo-map', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkFileSizes(ctx); return { ...r, ruleId: 'cat-25-rule-2' } },
  },
  manual('cat-25-rule-3', 25, 'Keine unused imports', 2),
  manual('cat-25-rule-4', 25, 'Kein auskommentierter Code committed', 1),
  { id: 'cat-25-rule-5', categoryId: 25, name: 'Projektstruktur folgt Standard', weight: 2, checkMode: 'file-system', automatable: true, check: checkProjectStructure, agentSource: 'architecture', agentRuleId: 'R2' },
  manual('cat-25-rule-6', 25, 'Keine duplizierten Utility-Funktionen', 1),
]

export function getRulesForCategory(categoryId: number): AuditRule[] {
  return AUDIT_RULES.filter((r) => r.categoryId === categoryId)
}

export function getRuleById(id: string): AuditRule | undefined {
  return AUDIT_RULES.find((r) => r.id === id)
}
