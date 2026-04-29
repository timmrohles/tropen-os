// src/lib/audit/rule-registry.ts
import type { AuditRule, AuditContext, FixType, RuleTier, AuditTier, AuditDomain } from './types'
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
  checkBundleSizes, checkEslintDetailed, checkNpmAudit,
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
  checkLegalPages, checkVVTPresent, checkAnalyticsPiiSeparation,
  checkSoftDeletePattern, checkMigrationNaming,
  checkWebhookSignatureValidation, checkTimeoutRetryPatterns,
  checkGlobalMutableState,
  checkVitestCoverageThresholds,
  checkStagingEnvironment,
  checkRestoreTestDocumented,
  checkKiDependencyReviewDocs,
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
  checkDsgvoCookieConsentLibrary, checkDsgvoNoTrackingBeforeConsent,
  checkDsgvoPasswordHashing, checkDsgvoHstsHeader, checkDsgvoCspHeader,
  checkDsgvoDataExportEndpoint, checkDsgvoAccountDeletion,
  checkBfsgAccessibilityStatement, checkBfsgFeedbackMechanism,
  checkBfsgHtmlLang, checkBfsgSkipNavLink, checkBfsgAriaLiveRegions,
  checkAiActRiskClassification, checkAiActDisclosure,
  checkAiActDecisionLogging, checkAiActPurposeDocs, checkAiActProhibitedPractices,
} from './checkers/agent-regulatory-checker'
import { checkSchemaDrift } from './schema-drift-check'
import {
  checkAgbPage, checkWiderrufsbelehrung, checkCheckoutButtonText,
  checkAffiliateDisclosure, checkAiTransparency, checkAiContentLabeling,
} from './checkers/compliance-checker'
import {
  checkCognitiveComplexity, checkGodComponents, checkErrorHandling,
  checkHardcodedSecrets, checkCircularImports, checkAnyUsage,
  checkNPlusOneQueries, checkErrorBoundary,
} from './checkers/ast-quality-checker'
import {
  checkEnvExample, checkTodoComments, checkUnhandledPromises, checkLoadingStates,
} from './checkers/gap-checkers'
import {
  checkPerformanceBasics, checkCIPipelineExists, checkCIHasTypeCheck,
  checkLLMTokenLimits, checkAIRouteRateLimiting,
} from './checkers/category-gap-checkers'
import {
  checkFetchInEffect, checkPropDrilling, checkServerStateInStore,
  checkOutdatedMajorVersions, checkErrorMonitoring,
} from './checkers/state-deps-obs-checkers'
import {
  checkBackupDocs, checkSupabasePITR,
  checkAPITimeouts, checkUnlimitedQueries,
  checkReadmeQuality, checkChangelog,
  checkWebManifest, checkOfflineFallback,
  checkDeploymentDocs,
} from './checkers/final-category-checkers'
import {
  checkIconLibraryConsistency, checkHardcodedStrings,
  checkGitignoreCompleteness, checkDeploymentConfig,
  checkTestFrameworkInstalled, checkNextFontDisplayMode,
} from './checkers/thin-category-checkers'
import {
  checkPlaceholderComments, checkAiToolFingerprints, checkOvercommenting,
  checkPlaceholderCredentials, checkMixedCommentLanguage,
} from './checkers/slop-detection-checker'
import {
  checkAiContextFile, checkPrdPresent, checkReadmeDrift, checkCursorrulesHasStack,
} from './checkers/spec-checker'
import {
  checkRlsOnUserTables, checkNoServiceRoleInFrontend, checkAnonKeyNoWriteWildcard,
  checkStorageBucketPolicies, checkEdgeFunctionsNoServiceRoleInUserContext,
  checkDbBackupStrategyDocumented,
} from './checkers/db-security-checker'

function manual(
  id: string,
  categoryId: number,
  name: string,
  weight: 1 | 2 | 3,
  fixType: FixType = 'manual',
  auditTier: AuditTier = 'code',
  maturityTier?: RuleTier,
  auditDomain: AuditDomain = 'code-quality'
): AuditRule {
  return {
    id, categoryId, name, weight,
    checkMode: 'manual', automatable: false,
    fixType, tier: auditTier, domain: auditDomain,
    ...(maturityTier ? { maturityTier } : {}),
  }
}

export const AUDIT_RULES: AuditRule[] = [
  // ── Category 1: Architektur (weights: 3, 3, 2, 1, 2) ──────────────────────
  manual('cat-1-rule-1', 1, 'Klare Schichtenarchitektur erkennbar', 3, 'refactoring'),
  { id: 'cat-1-rule-2', categoryId: 1, name: 'Business-Logik nicht in UI/Routes', weight: 3, checkMode: 'repo-map', automatable: true, check: checkBusinessLogicSeparation, fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-1-rule-3', categoryId: 1, name: 'Keine zirkulaeren Abhaengigkeiten', weight: 2, checkMode: 'external-tool', automatable: true, check: checkDepCruiserCycles, agentSource: 'architecture', agentRuleId: 'R1', fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },
  {
    id: 'cat-1-rule-4', categoryId: 1, name: 'Dateien < 300 Zeilen (Ausnahmen dokumentiert)', weight: 1, checkMode: 'repo-map', automatable: true,
    // Exclude /components/ — those are checked by cat-25-rule-2 to avoid duplicates
    check: async (ctx: AuditContext) => {
      const filteredCtx = { ...ctx, repoMap: { ...ctx.repoMap, files: ctx.repoMap.files.filter(f => !f.path.includes('/components/')) } }
      return checkFileSizes(filteredCtx)
    },
    agentSource: 'architecture', agentRuleId: 'R3', enforcement: 'blocked', fixType: 'refactoring', tier: 'code', domain: 'code-quality',
  },
  { id: 'cat-1-rule-5', categoryId: 1, name: 'ADRs vorhanden fuer Kerntechnologieentscheidungen', weight: 2, checkMode: 'documentation', automatable: true, check: checkADRsPresent, agentSource: 'architecture', agentRuleId: 'R8', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  // Architecture Agent: R1 (dependency model), R2 (folder names), R7 (namespaces)
  { id: 'cat-1-rule-6', categoryId: 1, name: 'Dependency-Modell durch Tooling erzwungen', weight: 2, checkMode: 'file-system', automatable: true, check: checkDependencyModel, agentSource: 'architecture', agentRuleId: 'R1', enforcement: 'blocked', fixType: 'code-fix', tier: 'code', maturityTier: 'enterprise', domain: 'code-quality' },
  { id: 'cat-1-rule-7', categoryId: 1, name: 'Keine verbotenen Ordnernamen', weight: 1, checkMode: 'repo-map', automatable: true, check: checkForbiddenFolderNames, agentSource: 'architecture', agentRuleId: 'R2', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-1-rule-8', categoryId: 1, name: 'Keine unerwarteten Top-Level-Verzeichnisse', weight: 1, checkMode: 'repo-map', automatable: true, check: checkUnexpectedNamespaces, agentSource: 'architecture', agentRuleId: 'R7', enforcement: 'reviewed', fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },

  // ── Category 2: Code-Qualitaet (weights: 3, 2, 1, 1, 2, 2) ────────────────
  { id: 'cat-2-rule-1', categoryId: 2, name: 'TypeScript Strict Mode aktiv', weight: 3, checkMode: 'file-system', automatable: true, check: checkTypeScriptStrictMode, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-2', categoryId: 2, name: 'ESLint konfiguriert und aktiv', weight: 2, checkMode: 'file-system', automatable: true, check: checkEsLintConfigured, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-3', categoryId: 2, name: 'Prettier konfiguriert', weight: 1, checkMode: 'file-system', automatable: true, check: checkPrettierConfigured, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  manual('cat-2-rule-4', 2, 'Magic Numbers/Strings minimiert', 1),
  manual('cat-2-rule-5', 2, 'Explizites Error Handling durchgaengig', 2, 'code-fix'),
  manual('cat-2-rule-6', 2, 'Cognitive Complexity <= 15', 2, 'manual', 'metric'),
  { id: 'cat-2-rule-9', categoryId: 2, name: 'ESLint: keine Violations (detailliert)', weight: 2, checkMode: 'external-tool', automatable: true, check: checkEslintDetailed, agentSource: 'code-style', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  // Code Style Agent R2, R9, R10
  { id: 'cat-2-rule-7', categoryId: 2, name: 'Keine leeren catch-Bloecke', weight: 2, checkMode: 'repo-map', automatable: true, check: checkEmptyCatchBlocks, agentSource: 'code-style', agentRuleId: 'R2', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-8', categoryId: 2, name: 'Kein auskommentierter Code-Block > 2 Zeilen', weight: 1, checkMode: 'repo-map', automatable: true, check: checkCommentedOutCode, agentSource: 'code-style', agentRuleId: 'R9', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-10', categoryId: 2, name: 'Strikte Gleichheitsoperatoren (=== statt ==)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkStrictEquality, agentSource: 'code-style', agentRuleId: 'R10', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-11', categoryId: 2, name: 'Lighthouse Best Practices', weight: 2, checkMode: 'external-tool', automatable: true, check: checkLighthouseBestPractices, agentSource: 'lighthouse-best-practices', fixType: 'code-fix', tier: 'metric', domain: 'performance' },

  // ── Category 3: Sicherheit (weights: 3,3,3,2,2,3,2,3,2,2,2,3,2,3) ────────
  manual('cat-3-rule-1',  3, 'OWASP Top 10 beruecksichtigt', 3, 'manual', 'code', undefined, 'security'),
  { id: 'cat-3-rule-2',  categoryId: 3, name: 'Serverseitige Input-Validierung', weight: 3, checkMode: 'repo-map', automatable: true, check: checkInputValidationCoverage, agentSource: 'security', agentRuleId: 'R2', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-3',  categoryId: 3, name: 'Keine Secrets im Repo / History', weight: 3, checkMode: 'cli', automatable: true, check: cliChecks.checkNoSecretsInRepo, agentSource: 'security', agentRuleId: 'R1', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  manual('cat-3-rule-4',  3, 'HTTP Sicherheitsheader gesetzt', 2, 'code-fix', 'code', undefined, 'security'),
  manual('cat-3-rule-5',  3, 'Rate Limiting implementiert', 2, 'code-fix', 'code', undefined, 'security'),
  manual('cat-3-rule-6',  3, 'Auth und Authz klar getrennt', 3, 'refactoring', 'code', undefined, 'security'),
  { id: 'cat-3-rule-7',  categoryId: 3, name: 'Dependency-Vulnerabilities geprueft', weight: 2, checkMode: 'cli', automatable: true, check: checkNpmAudit, agentSource: 'npm-audit', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  manual('cat-3-rule-8',  3, 'Auth-Haertung (Token-Expiry, Rotation, Logout)', 3, 'code-fix', 'code', undefined, 'security'),
  manual('cat-3-rule-9',  3, 'Boilerplate-Hygiene (keine Default-Credentials)', 2, 'code-fix', 'code', undefined, 'security'),
  manual('cat-3-rule-10', 3, 'E-Mail-Sicherheit (SPF, DKIM, DMARC)', 2, 'manual', 'code', undefined, 'security'),
  manual('cat-3-rule-11', 3, 'Patch-Management + Disclosure Policy', 2, 'manual', 'compliance', undefined, 'security'),
  manual('cat-3-rule-12', 3, 'SSRF-Schutz (URL-Validierung, Allowlist)', 3, 'code-fix', 'code', undefined, 'security'),
  manual('cat-3-rule-13', 3, 'CSRF-Schutz (SameSite Cookies, CSRF-Tokens)', 2, 'code-fix', 'code', undefined, 'security'),
  manual('cat-3-rule-14', 3, 'Object-Level Authorization (Ownership-Check)', 3, 'code-fix', 'code', undefined, 'security'),
  // Security Agent: R3 (auth guard), R4 (RLS), R6 (rate limit), R7 (CORS), R8 (error leak), R9 (LLM)
  { id: 'cat-3-rule-15', categoryId: 3, name: 'Auth-Check in allen API-Routes', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAuthGuardConsistency, agentSource: 'security', agentRuleId: 'R3', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-16', categoryId: 3, name: 'RLS-Coverage in Migrations', weight: 3, checkMode: 'documentation', automatable: true, check: checkRlsCoverage, agentSource: 'security', agentRuleId: 'R4', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-17', categoryId: 3, name: 'Rate Limiting konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkRateLimiting, agentSource: 'security', agentRuleId: 'R6', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-18', categoryId: 3, name: 'CORS: keine Wildcard-Origin', weight: 2, checkMode: 'file-system', automatable: true, check: checkCorsConfig, agentSource: 'security', agentRuleId: 'R7', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-19', categoryId: 3, name: 'Keine Error-Internals in API-Responses', weight: 2, checkMode: 'repo-map', automatable: true, check: checkErrorLeakage, agentSource: 'security', agentRuleId: 'R8', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  // Security Agent R10 (file upload validation)
  { id: 'cat-3-rule-26', categoryId: 3, name: 'File-Upload-Validierung (Typ, Groesse, Pfad)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkFileUploadValidation, agentSource: 'security', agentRuleId: 'R10', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  // Security Scan Agent: R1–R6
  { id: 'cat-3-rule-20', categoryId: 3, name: 'Keine Injection-Pattern (SQL/Cmd/Path/SSRF/XSS)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkInjectionPatterns, agentSource: 'security-scan', agentRuleId: 'R1', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-21', categoryId: 3, name: 'Keine unsicheren Auth-Pattern (Secrets/Tokens)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAuthPatterns, agentSource: 'security-scan', agentRuleId: 'R2', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-22', categoryId: 3, name: 'Kein Data Exposure (Debug/Stack-Trace/Over-Fetch)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkDataExposurePatterns, agentSource: 'security-scan', agentRuleId: 'R3', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-23', categoryId: 3, name: 'Kein Client-Side Risk (eval/Prototype-Pollution)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkClientSidePatterns, agentSource: 'security-scan', agentRuleId: 'R4', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-24', categoryId: 3, name: 'Keine schwachen Krypto-Pattern (MD5/Math.random)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkCryptoPatterns, agentSource: 'security-scan', agentRuleId: 'R7', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-3-rule-25', categoryId: 3, name: 'Keine Business-Logic-Luecken (Mass-Assignment/IDOR)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkBusinessLogicPatterns, agentSource: 'security-scan', agentRuleId: 'R5', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'security' },

  // ── Category 4: Datenschutz & Compliance (weights: 3,2,2,2,2,2) ──────────
  manual('cat-4-rule-1', 4, 'Kein PII in Logs', 3, 'code-fix', 'code', undefined, 'dsgvo'),
  manual('cat-4-rule-2', 4, 'Consent-System DSGVO-konform', 2, 'code-gen', 'compliance', undefined, 'dsgvo'),
  manual('cat-4-rule-3', 4, 'Datenloeschung technisch moeglich', 2, 'code-gen', 'code', undefined, 'dsgvo'),
  manual('cat-4-rule-4', 4, 'Rechtsgrundlagen dokumentiert', 2, 'code-gen', 'compliance', undefined, 'dsgvo'),
  manual('cat-4-rule-5', 4, 'AVV mit Drittanbietern vorhanden', 2, 'manual', 'compliance', undefined, 'dsgvo'),
  { id: 'cat-4-rule-6', categoryId: 4, name: 'AI Act Klassifizierung durchgefuehrt', weight: 2, checkMode: 'documentation', automatable: true, check: checkAiActDocumentation, fixType: 'code-gen', tier: 'compliance', domain: 'ki-act' },
  // Legal Agent R1, R2, R3; Analytics Agent R3
  { id: 'cat-4-rule-7', categoryId: 4, name: 'Impressum + Datenschutz-Seiten vorhanden', weight: 3, checkMode: 'file-system', automatable: true, check: checkLegalPages, agentSource: 'legal', agentRuleId: 'R1', enforcement: 'blocked', fixType: 'code-gen', tier: 'compliance', domain: 'dsgvo' },
  { id: 'cat-4-rule-8', categoryId: 4, name: 'VVT (Verarbeitungsverzeichnis) in docs/ vorhanden', weight: 2, checkMode: 'documentation', automatable: true, check: checkVVTPresent, agentSource: 'legal', agentRuleId: 'R2', enforcement: 'reviewed', fixType: 'code-gen', tier: 'compliance', domain: 'dsgvo' },
  // cat-4-rule-9 removed — subset of cat-4-rule-12 (DSGVO CMP check covers all 3 libs + 7 more)
  { id: 'cat-4-rule-10', categoryId: 4, name: 'PII in Analytics-Events getrennt / anonymisiert', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAnalyticsPiiSeparation, agentSource: 'analytics', agentRuleId: 'R3', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'dsgvo' },
  // DSGVO Deep Agent: R4, R5, R10, R11, R12, R13, R15–R18
  // cat-4-rule-11 removed — presence check is subset of cat-4-rule-7 (Impressum + Datenschutz)
  { id: 'cat-4-rule-12', categoryId: 4, name: 'DSGVO: Cookie Consent Library (ePrivacy Art. 5(3))', weight: 2, checkMode: 'file-system', automatable: true, check: checkDsgvoCookieConsentLibrary, agentSource: 'dsgvo', agentRuleId: 'R4', enforcement: 'blocked', fixType: 'code-gen', tier: 'compliance', domain: 'dsgvo' },
  { id: 'cat-4-rule-13', categoryId: 4, name: 'DSGVO: Kein Tracking vor Consent (Art. 7)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkDsgvoNoTrackingBeforeConsent, agentSource: 'dsgvo', agentRuleId: 'R5', enforcement: 'blocked', fixType: 'code-fix', tier: 'compliance', domain: 'dsgvo' },
  { id: 'cat-4-rule-14', categoryId: 4, name: 'DSGVO: Passwort-Hashing (Art. 32)', weight: 3, checkMode: 'file-system', automatable: true, check: checkDsgvoPasswordHashing, agentSource: 'dsgvo', agentRuleId: 'R10', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'dsgvo' },
  { id: 'cat-4-rule-15', categoryId: 4, name: 'DSGVO: HSTS-Header konfiguriert (Art. 32)', weight: 2, checkMode: 'file-system', automatable: true, check: checkDsgvoHstsHeader, agentSource: 'dsgvo', agentRuleId: 'R11', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'dsgvo' },
  { id: 'cat-4-rule-16', categoryId: 4, name: 'DSGVO: CSP-Header konfiguriert (Art. 32)', weight: 2, checkMode: 'file-system', automatable: true, check: checkDsgvoCspHeader, agentSource: 'dsgvo', agentRuleId: 'R17', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'dsgvo' },
  { id: 'cat-4-rule-17', categoryId: 4, name: 'DSGVO: Datenexport-Endpunkt (Art. 20 — Portabilitaet)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkDsgvoDataExportEndpoint, agentSource: 'dsgvo', agentRuleId: 'R12', enforcement: 'reviewed', fixType: 'code-gen' , tier: 'code', domain: 'dsgvo' },
  { id: 'cat-4-rule-18', categoryId: 4, name: 'DSGVO: Account-Loeschung (Art. 17 — Recht auf Vergessenwerden)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkDsgvoAccountDeletion, agentSource: 'dsgvo', agentRuleId: 'R13', enforcement: 'blocked', fixType: 'code-gen' , tier: 'code', domain: 'dsgvo' },

  // ── Category 5: Datenbank (weights: 3,2,2,1,3,3) ─────────────────────────
  { id: 'cat-5-rule-1', categoryId: 5, name: 'FK-Constraints vorhanden', weight: 3, checkMode: 'documentation', automatable: true, check: checkFKConstraintsInMigrations, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-5-rule-2', categoryId: 5, name: 'Index-Strategie vorhanden', weight: 2, checkMode: 'documentation', automatable: true, check: checkIndexStrategyInMigrations, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-5-rule-3', categoryId: 5, name: 'Migrations-Tool im Einsatz', weight: 2, checkMode: 'file-system', automatable: true, check: checkMigrationsTool, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  manual('cat-5-rule-4', 5, 'JSON-Blobs vermieden fuer filterbare Daten', 1, 'refactoring'),
  manual('cat-5-rule-5', 5, 'Principle of Least Privilege fuer DB-User', 3),
  { id: 'cat-5-rule-6', categoryId: 5, name: 'BaaS: RLS aktiv + kein Service Key im Frontend', weight: 3, checkMode: 'repo-map', automatable: true, check: checkServiceKeyInFrontend, agentSource: 'security', agentRuleId: 'R4', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  // Database Agent R4, R6
  { id: 'cat-5-rule-7', categoryId: 5, name: 'Soft-Delete-Pattern (deleted_at) statt DELETE', weight: 2, checkMode: 'documentation', automatable: true, check: checkSoftDeletePattern, agentSource: 'database', agentRuleId: 'R4', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-5-rule-8', categoryId: 5, name: 'Migrations-Naming konsistent', weight: 1, checkMode: 'documentation', automatable: true, check: checkMigrationNaming, agentSource: 'database', agentRuleId: 'R6', enforcement: 'reviewed', fixType: 'code-fix', tier: 'code', maturityTier: 'production', domain: 'code-quality' },
  // Schema Drift Check: always score 5 (no penalty), info finding when DB detected
  { id: 'cat-5-schema-drift', categoryId: 5, name: 'Schema Drift Check empfohlen', weight: 1, checkMode: 'file-system', automatable: true, check: checkSchemaDrift, agentSource: 'database', agentRuleId: 'schema-drift', enforcement: 'advisory', fixType: 'manual' , tier: 'code', domain: 'code-quality' },

  // ── Category 6: API-Design (weights: 2,2,2,3,2) ───────────────────────────
  { id: 'cat-6-rule-1', categoryId: 6, name: 'API-Versionierung vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkApiVersioning, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-6-rule-2', categoryId: 6, name: 'OpenAPI/Swagger-Spec vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkOpenApiSpec, fixType: 'code-gen', tier: 'code', maturityTier: 'enterprise', domain: 'code-quality' },
  { id: 'cat-6-rule-3', categoryId: 6, name: 'Vendor-Abstraktionsschicht', weight: 2, checkMode: 'repo-map', automatable: true, check: checkVendorAbstraction, fixType: 'refactoring', tier: 'code', maturityTier: 'enterprise', domain: 'code-quality' },
  manual('cat-6-rule-4', 6, 'Webhook-Signaturvalidierung', 3, 'code-fix'),
  manual('cat-6-rule-5', 6, 'Resilience-Patterns (Timeout, Retry, CB)', 2, 'code-fix'),
  // API Agent R4, R5
  { id: 'cat-6-rule-6', categoryId: 6, name: 'Webhook-Signaturvalidierung implementiert', weight: 3, checkMode: 'repo-map', automatable: true, check: checkWebhookSignatureValidation, agentSource: 'api', agentRuleId: 'R4', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-6-rule-7', categoryId: 6, name: 'Timeout/Retry bei externen Calls', weight: 2, checkMode: 'repo-map', automatable: true, check: checkTimeoutRetryPatterns, agentSource: 'api', agentRuleId: 'R5', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },

  // ── Category 7: Performance (weights: 3,2,2,2,2) ─────────────────────────
  { id: 'cat-7-rule-1', categoryId: 7, name: 'Core Web Vitals im Zielbereich', weight: 3, checkMode: 'external-tool', automatable: true, check: checkLighthousePerf, agentSource: 'performance', agentRuleId: 'R1', fixType: 'code-fix', tier: 'metric', domain: 'performance' },
  { id: 'cat-7-rule-2', categoryId: 7, name: 'Bundle-Groesse analysiert und optimiert', weight: 2, checkMode: 'external-tool', automatable: true, check: checkBundleSizes, agentSource: 'performance', fixType: 'refactoring', tier: 'metric', domain: 'performance' },
  manual('cat-7-rule-3', 7, 'Pagination fuer alle Listen-Endpunkte', 2, 'code-fix', 'code', undefined, 'performance'),
  manual('cat-7-rule-4', 7, 'Caching-Strategie definiert und aktiv', 2, 'manual', 'code', undefined, 'performance'),
  manual('cat-7-rule-5', 7, 'CDN fuer statische Assets', 2, 'manual', 'code', undefined, 'performance'),
  // Performance Agent R3
  { id: 'cat-7-rule-6', categoryId: 7, name: 'Pagination in GET-Endpunkten erkennbar', weight: 2, checkMode: 'repo-map', automatable: true, check: checkPaginationOnListEndpoints, agentSource: 'performance', agentRuleId: 'R3', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'performance' },

  // ── Category 8: Skalierbarkeit (weights: 3,2,2,2) ────────────────────────
  manual('cat-8-rule-1', 8, 'Stateless App-Server', 3, 'refactoring'),
  { id: 'cat-8-rule-2', categoryId: 8, name: 'Job-Queue fuer Background-Tasks', weight: 2, checkMode: 'file-system', automatable: true, check: checkJobQueuePresent, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  manual('cat-8-rule-3', 8, 'Lasttests durchgefuehrt + dokumentiert', 2),
  manual('cat-8-rule-4', 8, 'DB-Scaling-Plan vorhanden', 2),
  // Scalability Agent R1
  { id: 'cat-8-rule-5', categoryId: 8, name: 'Kein globaler mutierbarer State in lib/', weight: 2, checkMode: 'repo-map', automatable: true, check: checkGlobalMutableState, agentSource: 'scalability', agentRuleId: 'R1', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },

  // ── Category 9: State Management (weights: 2,2,1) ────────────────────────
  manual('cat-9-rule-1', 9, 'State-Kategorien klar getrennt', 2),
  manual('cat-9-rule-3', 9, 'Optimistic Updates mit Rollback', 1),
  { id: 'cat-9-rule-5', categoryId: 9, name: 'Kein fetch() in useEffect ohne Cache-Layer', weight: 2, checkMode: 'repo-map', automatable: true, check: checkFetchInEffect, agentSource: 'code-style', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-9-rule-6', categoryId: 9, name: 'Keine uebermässige Prop-Weitergabe (>7 Props)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkPropDrilling, agentSource: 'architecture', fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-9-rule-7', categoryId: 9, name: 'Kein Server-State im globalen Store', weight: 2, checkMode: 'repo-map', automatable: true, check: checkServerStateInStore, agentSource: 'code-style', fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },

  // ── Category 10: Testing (weights: 3,2,2,3,2) ────────────────────────────
  { id: 'cat-10-rule-1', categoryId: 10, name: 'Unit-Test-Coverage >= 80%', weight: 3, checkMode: 'cli', automatable: true, check: cliChecks.checkUnitTestCoverage, fixType: 'code-gen', tier: 'metric', domain: 'code-quality' },
  { id: 'cat-10-rule-2', categoryId: 10, name: 'Integration Tests fuer API-Endpunkte', weight: 2, checkMode: 'file-system', automatable: true, check: checkIntegrationTests, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-10-rule-3', categoryId: 10, name: 'E2E Tests fuer kritische User-Journeys', weight: 1, checkMode: 'file-system', automatable: true, check: checkE2ETestsPresent, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-10-rule-4', categoryId: 10, name: 'Tests laufen in CI-Pipeline', weight: 3, checkMode: 'file-system', automatable: true, check: checkTestsInCIPipeline, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-10-rule-5', categoryId: 10, name: 'KI-Code-Gate: Coverage >= 90%', weight: 2, checkMode: 'file-system', automatable: true, check: checkKiCodeGate, fixType: 'code-gen', tier: 'metric', domain: 'code-quality' },
  // Testing Agent R2
  { id: 'cat-10-rule-6', categoryId: 10, name: 'vitest Coverage-Thresholds konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkVitestCoverageThresholds, agentSource: 'testing', agentRuleId: 'R2', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },

  // ── Category 11: CI/CD (weights: 3,2,3,2,2) ──────────────────────────────
  { id: 'cat-11-rule-1', categoryId: 11, name: 'CI-Pipeline vorhanden', weight: 3, checkMode: 'file-system', automatable: true, check: checkCIPipelinePresent, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  manual('cat-11-rule-2', 11, 'Staging-Umgebung vorhanden', 2),
  { id: 'cat-11-rule-3', categoryId: 11, name: 'Rollback-Plan definiert und getestet', weight: 3, checkMode: 'documentation', automatable: true, check: checkRunbooksPresent, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-11-rule-4', categoryId: 11, name: 'Infrastructure as Code', weight: 2, checkMode: 'file-system', automatable: true, check: checkInfrastructureAsCode, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  manual('cat-11-rule-5', 11, 'Zero-Downtime Deployments', 2),
  // Platform Agent R2
  { id: 'cat-11-rule-6', categoryId: 11, name: 'Staging/Preview-Umgebung konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkStagingEnvironment, agentSource: 'platform', agentRuleId: 'R2', enforcement: 'reviewed', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Category 12: Observability (weights: 3,3,2,2,2) ─────────────────────
  { id: 'cat-12-rule-1', categoryId: 12, name: 'Structured Logging (JSON, kein PII)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkLoggerAbstraction, agentSource: 'observability', agentRuleId: 'R1', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-12-rule-2', categoryId: 12, name: 'Error-Tracking-Tool aktiv', weight: 3, checkMode: 'file-system', automatable: true, check: checkErrorTrackingSentry, fixType: 'code-gen', tier: 'code', maturityTier: 'production', domain: 'code-quality' },
  manual('cat-12-rule-3', 12, 'Metrics gesammelt (APM)', 2),
  { id: 'cat-12-rule-4', categoryId: 12, name: 'Distributed Tracing (OpenTelemetry)', weight: 2, checkMode: 'file-system', automatable: true, check: checkDistributedTracing, fixType: 'code-gen', tier: 'code', maturityTier: 'enterprise', domain: 'code-quality' },
  manual('cat-12-rule-5', 12, 'Uptime-Monitoring + Alerting', 2),
  // Observability Agent: R1 (console logs), R4 (trace IDs), R8 (PII in logs)
  { id: 'cat-12-rule-6', categoryId: 12, name: 'Keine console.* in Produktionscode', weight: 2, checkMode: 'repo-map', automatable: true, check: checkConsoleLogs, agentSource: 'observability', agentRuleId: 'R1', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-12-rule-7', categoryId: 12, name: 'Trace-/Request-IDs in Middleware', weight: 2, checkMode: 'file-system', automatable: true, check: checkTraceIds, agentSource: 'observability', agentRuleId: 'R4', enforcement: 'reviewed', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-12-rule-8', categoryId: 12, name: 'Kein PII in Log-Aufrufen', weight: 3, checkMode: 'repo-map', automatable: true, check: checkPiiInLogs, agentSource: 'observability', agentRuleId: 'R8', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  // Analytics Agent R1
  { id: 'cat-12-rule-9', categoryId: 12, name: 'Analytics-Event-Schema typisiert', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAnalyticsEventSchema, agentSource: 'analytics', agentRuleId: 'R1', enforcement: 'advisory', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Category 13: Backup & DR (weights: 3,3,3,2,2) ────────────────────────
  manual('cat-13-rule-1', 13, '3-2-1-Backup-Regel umgesetzt', 3),
  manual('cat-13-rule-2', 13, 'PITR fuer Produktionsdatenbank', 3),
  manual('cat-13-rule-3', 13, 'Restore regelmaessig getestet', 3),
  {
    id: 'cat-13-rule-4', categoryId: 13, name: 'DR-Runbook vorhanden und aktuell', weight: 2, checkMode: 'documentation', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkRunbooksPresent(ctx); return { ...r, ruleId: 'cat-13-rule-4' } },
    fixType: 'code-gen', tier: 'code', domain: 'code-quality' as AuditDomain,
  },
  {
    id: 'cat-13-rule-5', categoryId: 13, name: 'RTO/RPO definiert', weight: 2, checkMode: 'documentation', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkRunbooksPresent(ctx); return { ...r, ruleId: 'cat-13-rule-5' } },
    fixType: 'manual', tier: 'code', domain: 'code-quality' as AuditDomain,
  },
  // Observability Agent R7 — incident response process documented
  { id: 'cat-13-rule-6', categoryId: 13, name: 'Incident-Response-Prozess dokumentiert', weight: 2, checkMode: 'documentation', automatable: true, check: checkIncidentDocs, agentSource: 'observability', agentRuleId: 'R7', enforcement: 'advisory', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  // Backup DR Agent R3
  { id: 'cat-13-rule-7', categoryId: 13, name: 'Restore-Test dokumentiert und regelmaessig', weight: 2, checkMode: 'documentation', automatable: true, check: checkRestoreTestDocumented, agentSource: 'backup-dr', agentRuleId: 'R3', enforcement: 'reviewed', fixType: 'manual' , tier: 'code', domain: 'code-quality' },

  // ── Category 14: Dependency Management (weights: 3,3,2,1) ────────────────
  { id: 'cat-14-rule-1', categoryId: 14, name: 'Lockfiles committed', weight: 3, checkMode: 'file-system', automatable: true, check: checkLockfileCommitted, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-14-rule-2', categoryId: 14, name: 'Vulnerability-Scans in CI', weight: 3, checkMode: 'file-system', automatable: true, check: checkVulnerabilityScanInCI, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-14-rule-3', categoryId: 14, name: 'Renovate / Dependabot konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkDependabotConfigured, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-14-rule-4', categoryId: 14, name: 'Node-Version fixiert', weight: 1, checkMode: 'file-system', automatable: true, check: checkNodeVersionFixed, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  // Git Governance Agent R3 — CODEOWNERS lives in cat-19-rule-4 (correct home)
  { id: 'cat-14-rule-6', categoryId: 14, name: 'KI-Dependency-Review-Prozess dokumentiert', weight: 1, checkMode: 'documentation', automatable: true, check: checkKiDependencyReviewDocs, agentSource: 'dependencies', agentRuleId: 'R5', enforcement: 'advisory', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Category 15: Design System (weights: 2,2,2,1) ────────────────────────
  manual('cat-15-rule-1', 15, 'Design-Tokens definiert', 2),
  manual('cat-15-rule-2', 15, 'Komponentenbibliothek dokumentiert', 2),
  manual('cat-15-rule-3', 15, 'Kein Hard-Coding von Designwerten', 2),
  manual('cat-15-rule-4', 15, 'Component Lifecycle definiert', 1),
  // Design System Agent R3, R1
  { id: 'cat-15-rule-5', categoryId: 15, name: 'Keine Hex-Farben direkt in TSX/CSS-Modulen', weight: 2, checkMode: 'repo-map', automatable: true, check: checkHardcodedColors, agentSource: 'design-system', agentRuleId: 'R3', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-15-rule-6', categoryId: 15, name: 'CSS-Variables-Datei (globals.css/tokens) vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkCssVariablesFile, agentSource: 'design-system', agentRuleId: 'R1', enforcement: 'reviewed', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Category 16: Accessibility (weights: 3,2,1) ───────────────────────────
  { id: 'cat-16-rule-1', categoryId: 16, name: 'WCAG 2.1 AA Konformitaet (Lighthouse)', weight: 3, checkMode: 'external-tool', automatable: true, check: checkLighthouseA11y, agentSource: 'accessibility', agentRuleId: 'R1', fixType: 'code-fix', tier: 'metric', domain: 'accessibility' },
  manual('cat-16-rule-2', 16, 'Tastaturnavigation funktioniert', 2, 'code-fix', 'code', undefined, 'accessibility'),
  { id: 'cat-16-rule-3', categoryId: 16, name: 'Korrekte ARIA-Nutzung', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAriaAttributes, fixType: 'code-fix' , tier: 'code', domain: 'accessibility' },
  // Accessibility Agent R2
  { id: 'cat-16-rule-4', categoryId: 16, name: 'axe-core fuer Accessibility-Tests installiert', weight: 1, checkMode: 'file-system', automatable: true, check: checkAxeCoreInstalled, agentSource: 'accessibility', agentRuleId: 'R2', enforcement: 'reviewed', fixType: 'code-gen', tier: 'code', maturityTier: 'production', domain: 'accessibility' },
  // BFSG Deep Agent: R1 (statement), R2 (feedback), R5 (html lang), R6 (skip nav), R11 (aria-live)
  { id: 'cat-16-rule-5', categoryId: 16, name: 'BFSG: Erklaerung zur Barrierefreiheit vorhanden', weight: 3, checkMode: 'file-system', automatable: true, check: checkBfsgAccessibilityStatement, agentSource: 'bfsg', agentRuleId: 'R1', enforcement: 'blocked', fixType: 'code-gen', tier: 'compliance', domain: 'accessibility' },
  { id: 'cat-16-rule-6', categoryId: 16, name: 'BFSG: Feedback-Mechanismus in Erklaerung (§ 3 BFSG)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBfsgFeedbackMechanism, agentSource: 'bfsg', agentRuleId: 'R2', enforcement: 'reviewed', fixType: 'code-gen', tier: 'compliance', domain: 'accessibility' },
  { id: 'cat-16-rule-7', categoryId: 16, name: 'BFSG: HTML lang-Attribut gesetzt (WCAG 2.1 SC 3.1.1)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBfsgHtmlLang, agentSource: 'bfsg', agentRuleId: 'R5', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'accessibility' },
  { id: 'cat-16-rule-8', categoryId: 16, name: 'BFSG: Skip-Navigation-Link vorhanden (WCAG 2.1 SC 2.4.1)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkBfsgSkipNavLink, agentSource: 'bfsg', agentRuleId: 'R6', enforcement: 'reviewed', fixType: 'code-gen' , tier: 'code', domain: 'accessibility' },
  { id: 'cat-16-rule-9', categoryId: 16, name: 'BFSG: ARIA live-Regions fuer dynamische Inhalte', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBfsgAriaLiveRegions, agentSource: 'bfsg', agentRuleId: 'R11', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'accessibility' },
  // Accessibility Agent R9 (deepened)
  { id: 'cat-16-rule-10', categoryId: 16, name: 'Accessibility: <img> mit alt-Text (WCAG 2.1 SC 1.1.1)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkImageAltText, agentSource: 'accessibility', agentRuleId: 'R9', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'accessibility' },

  // ── Category 17: Internationalisierung (weights: 2,2,2) ──────────────────
  { id: 'cat-17-rule-1', categoryId: 17, name: 'i18n-Framework im Einsatz', weight: 2, checkMode: 'file-system', automatable: true, check: checkI18nFramework, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  manual('cat-17-rule-2', 17, 'Keine hardcodierten Strings', 2),
  manual('cat-17-rule-3', 17, 'Locale-sensitive Formatierung', 2),

  // ── Category 18: Dokumentation (weights: 2,2,2,1) ────────────────────────
  { id: 'cat-18-rule-1', categoryId: 18, name: 'README vollstaendig und aktuell', weight: 2, checkMode: 'documentation', automatable: true, check: checkReadmePresent, fixType: 'code-gen' , tier: 'code', domain: 'documentation' },
  {
    id: 'cat-18-rule-2', categoryId: 18, name: 'ADRs vorhanden', weight: 2, checkMode: 'documentation', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkADRsPresent(ctx); return { ...r, ruleId: 'cat-18-rule-2' } },
    fixType: 'code-gen', domain: 'documentation' as AuditDomain,
  },
  manual('cat-18-rule-3', 18, 'API-Dokumentation generiert', 2, 'code-gen', 'code', undefined, 'documentation'),
  manual('cat-18-rule-4', 18, 'Onboarding < 30 Minuten erreichbar', 1, 'code-gen', 'code', undefined, 'documentation'),
  { id: 'cat-18-rule-5', categoryId: 18, name: 'Lighthouse SEO', weight: 1, checkMode: 'external-tool', automatable: true, check: checkLighthouseSeo, agentSource: 'lighthouse-seo', fixType: 'code-fix', tier: 'metric', domain: 'code-quality' },

  // ── Category 19: Git Governance (weights: 3,1,2) ──────────────────────────
  manual('cat-19-rule-1', 19, 'Branch-Schutz fuer main aktiv', 3),
  { id: 'cat-19-rule-2', categoryId: 19, name: 'Conventional Commits eingehalten', weight: 1, checkMode: 'documentation', automatable: true, check: checkConventionalCommits, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-19-rule-3', categoryId: 19, name: 'Semantic Versioning fuer Releases', weight: 2, checkMode: 'file-system', automatable: true, check: checkSemanticVersioning, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  // Git Governance Agent R3
  { id: 'cat-19-rule-4', categoryId: 19, name: 'CODEOWNERS automatische Review-Zuweisung', weight: 2, checkMode: 'file-system', automatable: true, check: checkCodeownersForGitGovernance, agentSource: 'git-governance', agentRuleId: 'R3', enforcement: 'reviewed', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Category 20: Cost Awareness (weights: 3,2,2,1) ────────────────────────
  manual('cat-20-rule-1', 20, 'Cloud-Budget-Alerts konfiguriert', 3),
  { id: 'cat-20-rule-2', categoryId: 20, name: 'API Rate Limits / Token Budgets', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBudgetEnforcement, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  manual('cat-20-rule-3', 20, 'Vendor-Abstraktionsschicht', 2, 'refactoring'),
  manual('cat-20-rule-4', 20, 'Lizenz-Compliance geprueft', 1, 'manual', 'compliance'),
  // Cost Awareness Agent R1
  { id: 'cat-20-rule-5', categoryId: 20, name: 'Budget-Alerts dokumentiert und konfiguriert', weight: 2, checkMode: 'documentation', automatable: true, check: checkBudgetAlertsDocumented, agentSource: 'cost-awareness', agentRuleId: 'R1', enforcement: 'reviewed', fixType: 'manual' , tier: 'code', domain: 'code-quality' },

  // ── Category 21: PWA & Resilience (weights: 2,2,2) ───────────────────────
  { id: 'cat-21-rule-1', categoryId: 21, name: 'manifest.json valide', weight: 2, checkMode: 'file-system', automatable: true, check: checkPWAManifest, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-21-rule-2', categoryId: 21, name: 'Service Worker vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkServiceWorker, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  manual('cat-21-rule-3', 21, 'Offline-Fallback implementiert', 2, 'manual', 'code'),
  // Error Handling Agent — error pages
  { id: 'cat-21-rule-4', categoryId: 21, name: '404 + Error-Seiten vorhanden', weight: 2, checkMode: 'file-system', automatable: true, check: checkErrorPages, agentSource: 'error-handling', agentRuleId: 'R1', enforcement: 'reviewed', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Category 22: AI Integration (weights: 3,2,2,2) ───────────────────────
  manual('cat-22-rule-1', 22, 'Prompt Injection Defense', 3, 'manual', 'code', undefined, 'ki-act'),
  { id: 'cat-22-rule-2', categoryId: 22, name: 'Token-Limits definiert und aktiv', weight: 2, checkMode: 'repo-map', automatable: true, check: checkTokenLimitsConfigured, fixType: 'code-fix' , tier: 'code', domain: 'ki-act' },
  manual('cat-22-rule-3', 22, 'Fallback-Strategie bei Modellausfall', 2, 'manual', 'code', undefined, 'ki-act'),
  manual('cat-22-rule-4', 22, 'LLM-Output-Validierung vorhanden', 2, 'code-fix', 'code', undefined, 'ki-act'),
  // Security Agent R9 — no user input in system prompts
  { id: 'cat-22-rule-5', categoryId: 22, name: 'User-Input nicht in System-Prompt', weight: 3, checkMode: 'repo-map', automatable: true, check: checkLlmInputSeparation, agentSource: 'security', agentRuleId: 'R9', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'ki-act' },
  // AI Integration Agent R4, R2
  { id: 'cat-22-rule-6', categoryId: 22, name: 'LLM-Output-Validierung erkennbar', weight: 2, checkMode: 'repo-map', automatable: true, check: checkLlmOutputValidation, agentSource: 'ai-integration', agentRuleId: 'R4', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'ki-act' },
  { id: 'cat-22-rule-7', categoryId: 22, name: 'AI-Provider ueber Abstraktionsschicht angebunden', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAiProviderAbstraction, agentSource: 'ai-integration', agentRuleId: 'R2', enforcement: 'reviewed', fixType: 'refactoring' , tier: 'code', domain: 'ki-act' },
  // Security Scan Agent: R8
  { id: 'cat-22-rule-8', categoryId: 22, name: 'Kein AI-Security-Risk (Prompt-Injection/Output-Eval)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAiSecurityPatterns, agentSource: 'security-scan', agentRuleId: 'R8', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'ki-act' },
  // AI Act Deep Agent: R2 (risk classification), R3 (disclosure), R6 (decision logging), R9 (purpose docs), R10 (prohibited)
  { id: 'cat-22-rule-9', categoryId: 22, name: 'AI Act: Risikoeinstufung dokumentiert (Art. 9)', weight: 2, checkMode: 'documentation', automatable: true, check: checkAiActRiskClassification, agentSource: 'ai-act', agentRuleId: 'R2', enforcement: 'reviewed', fixType: 'code-gen', tier: 'compliance', domain: 'ki-act' },
  { id: 'cat-22-rule-10', categoryId: 22, name: 'AI Act: KI-Interaktionen erkennbar (Art. 52)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAiActDisclosure, agentSource: 'ai-act', agentRuleId: 'R3', enforcement: 'reviewed', fixType: 'code-fix', tier: 'compliance', domain: 'ki-act' },
  { id: 'cat-22-rule-11', categoryId: 22, name: 'AI Act: KI-Entscheidungs-Logging (Art. 12)', weight: 2, checkMode: 'documentation', automatable: true, check: checkAiActDecisionLogging, agentSource: 'ai-act', agentRuleId: 'R6', enforcement: 'reviewed', fixType: 'code-gen', tier: 'compliance', domain: 'ki-act' },
  { id: 'cat-22-rule-12', categoryId: 22, name: 'AI Act: Zweckbeschreibung dokumentiert (Art. 13)', weight: 1, checkMode: 'documentation', automatable: true, check: checkAiActPurposeDocs, agentSource: 'ai-act', agentRuleId: 'R9', enforcement: 'advisory', fixType: 'code-gen', tier: 'compliance', domain: 'ki-act' },
  { id: 'cat-22-rule-13', categoryId: 22, name: 'AI Act: Keine verbotenen Praktiken (Art. 5)', weight: 3, checkMode: 'repo-map', automatable: true, check: checkAiActProhibitedPractices, agentSource: 'ai-act', agentRuleId: 'R10', enforcement: 'blocked', fixType: 'code-fix', tier: 'compliance', domain: 'ki-act' },

  // ── Category 23: Infrastructure (weights: 3,2,2,2) ───────────────────────
  manual('cat-23-rule-1', 23, 'Multi-AZ Deployment', 3),
  { id: 'cat-23-rule-2', categoryId: 23, name: 'Health Checks konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkHealthEndpoint, fixType: 'code-gen', tier: 'code', maturityTier: 'production', domain: 'code-quality' },
  manual('cat-23-rule-3', 23, 'Autoscaling konfiguriert', 2),
  manual('cat-23-rule-4', 23, 'Netzwerk-Segmentierung', 2),

  // ── Category 24: Supply Chain Security (weights: 3,2,2,2) ────────────────
  { id: 'cat-24-rule-1', categoryId: 24, name: 'SBOM generiert und gepflegt', weight: 3, checkMode: 'file-system', automatable: true, check: checkSBOMGenerated, fixType: 'code-gen', tier: 'code', maturityTier: 'enterprise', domain: 'security' },
  manual('cat-24-rule-2', 24, 'Signed Builds', 2, 'manual', 'code', undefined, 'security'),
  {
    id: 'cat-24-rule-3', categoryId: 24, name: 'Dependency Provenance geprueft', weight: 2, checkMode: 'file-system', automatable: true,
    check: async (ctx: AuditContext) => { const r = await checkLockfileCommitted(ctx); return { ...r, ruleId: 'cat-24-rule-3' } },
    fixType: 'code-fix', tier: 'code', domain: 'security' as AuditDomain,
  },
  manual('cat-24-rule-4', 24, 'KI-Dependency-Review', 2, 'manual', 'code', undefined, 'security'),
  // Dependencies Agent R6
  { id: 'cat-24-rule-5', categoryId: 24, name: 'Signed Builds / Build-Provenance konfiguriert', weight: 2, checkMode: 'file-system', automatable: true, check: checkSignedBuilds, agentSource: 'dependencies', agentRuleId: 'R6', enforcement: 'advisory', fixType: 'manual', tier: 'code', maturityTier: 'enterprise', domain: 'security' },
  // Security Scan Agent: R9
  { id: 'cat-24-rule-6', categoryId: 24, name: 'Kein Supply-Chain-Risiko (Unpinned/Git-URL/Postinstall)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkSupplyChainPatterns, agentSource: 'security-scan', agentRuleId: 'R9', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'security' },

  // ── Category 25: Namenskonventionen (weights: 2,2,2,1,2,1) ───────────────
  { id: 'cat-25-rule-1', categoryId: 25, name: 'Datei-Namenskonventionen eingehalten', weight: 2, checkMode: 'repo-map', automatable: true, check: checkNamingConventions, fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  {
    id: 'cat-25-rule-2', categoryId: 25, name: 'Keine Dateien > 300 Zeilen (Komponenten)', weight: 2, checkMode: 'repo-map', automatable: true,
    check: async (ctx: AuditContext) => {
      // Only check component files — cat-1-rule-4 handles all files
      const componentCtx = {
        ...ctx,
        repoMap: {
          ...ctx.repoMap,
          files: ctx.repoMap.files.filter(f => f.path.includes('/components/'))
        }
      }
      const r = await checkFileSizes(componentCtx)
      return { ...r, ruleId: 'cat-25-rule-2' }
    },
    fixType: 'refactoring', tier: 'code', domain: 'code-quality' as AuditDomain,
  },
  manual('cat-25-rule-3', 25, 'Keine unused imports', 2, 'code-fix'),
  manual('cat-25-rule-4', 25, 'Kein auskommentierter Code committed', 1, 'code-fix'),
  { id: 'cat-25-rule-5', categoryId: 25, name: 'Projektstruktur folgt Standard', weight: 2, checkMode: 'file-system', automatable: true, check: checkProjectStructure, agentSource: 'architecture', agentRuleId: 'R2', fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },
  manual('cat-25-rule-6', 25, 'Keine duplizierten Utility-Funktionen', 1, 'refactoring'),

  // ── Compliance: E-Commerce / Fernabsatz (profile-gated) ──────────────────
  { id: 'cat-4-rule-20', categoryId: 4, name: 'AGB/Terms-Seite vorhanden', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAgbPage, agentSource: 'legal', enforcement: 'blocked', fixType: 'code-gen', tier: 'compliance', domain: 'dsgvo' },
  { id: 'cat-4-rule-21', categoryId: 4, name: 'Widerrufsbelehrung vorhanden', weight: 2, checkMode: 'repo-map', automatable: true, check: checkWiderrufsbelehrung, agentSource: 'legal', enforcement: 'blocked', fixType: 'code-gen', tier: 'compliance', domain: 'dsgvo' },
  { id: 'cat-4-rule-22', categoryId: 4, name: 'Checkout-Button: "Kostenpflichtig bestellen"', weight: 1, checkMode: 'repo-map', automatable: true, check: checkCheckoutButtonText, agentSource: 'legal', enforcement: 'reviewed', fixType: 'code-fix', tier: 'compliance', domain: 'dsgvo' },

  // ── Compliance: Affiliate/Werbekennzeichnung (profile-gated) ─────────────
  { id: 'cat-5-rule-20', categoryId: 5, name: 'Affiliate-Links korrekt gekennzeichnet', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAffiliateDisclosure, agentSource: 'legal', enforcement: 'reviewed', fixType: 'manual', tier: 'compliance', domain: 'dsgvo' },

  // ── Compliance: AI Act Transparency (profile-gated) ──────────────────────
  { id: 'cat-22-rule-14', categoryId: 22, name: 'AI Act: KI-Nutzung transparent kommuniziert', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAiTransparency, agentSource: 'ai-act', enforcement: 'reviewed', fixType: 'code-gen', tier: 'compliance', domain: 'ki-act' },
  { id: 'cat-22-rule-15', categoryId: 22, name: 'AI Act: KI-generierte Inhalte markiert', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAiContentLabeling, agentSource: 'ai-act', enforcement: 'advisory', fixType: 'code-fix', tier: 'compliance', domain: 'ki-act' },

  // ── AST Code-Quality Checks (B1–B8) ──────────────────────────────────────
  { id: 'cat-2-rule-12', categoryId: 2, name: 'Cognitive Complexity <= 15 pro Funktion', weight: 2, checkMode: 'repo-map', automatable: true, check: checkCognitiveComplexity, agentSource: 'code-style', fixType: 'refactoring', tier: 'metric', domain: 'code-quality' },
  { id: 'cat-1-rule-10', categoryId: 1, name: 'Keine God Components (>300 Zeilen + >5 Hooks)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkGodComponents, agentSource: 'architecture', fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-16', categoryId: 2, name: 'Error-Handling vollstaendig (keine leeren catch)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkErrorHandling, agentSource: 'error-handling', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-3-rule-30', categoryId: 3, name: 'Keine hardcodierten Secrets im Quellcode', weight: 3, checkMode: 'repo-map', automatable: true, check: checkHardcodedSecrets, agentSource: 'security', enforcement: 'blocked', fixType: 'code-fix' , tier: 'code', domain: 'security' },
  { id: 'cat-1-rule-11', categoryId: 1, name: 'Keine zirkulaeren Imports', weight: 2, checkMode: 'repo-map', automatable: true, check: checkCircularImports, agentSource: 'architecture', fixType: 'refactoring' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-13', categoryId: 2, name: 'Minimale any-Type-Nutzung', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAnyUsage, agentSource: 'code-style', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-5-rule-15', categoryId: 5, name: 'Keine N+1 Queries (DB-Call in Schleife)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkNPlusOneQueries, agentSource: 'database', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-2-rule-17', categoryId: 2, name: 'Error Boundary vorhanden (error.tsx)', weight: 2, checkMode: 'repo-map', automatable: true, check: checkErrorBoundary, agentSource: 'error-handling', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Gap Checks (from gap analysis 2026-04-15) ────────────────────────────
  { id: 'cat-14-rule-7', categoryId: 14, name: '.env.example vorhanden', weight: 2, checkMode: 'repo-map', automatable: true, check: checkEnvExample, agentSource: 'dependencies', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-18-rule-6', categoryId: 18, name: 'Keine ungetrackten TODO/FIXME-Kommentare', weight: 1, checkMode: 'repo-map', automatable: true, check: checkTodoComments, agentSource: 'code-style', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-6-rule-8', categoryId: 6, name: 'Promise-Chains haben Error-Handling', weight: 2, checkMode: 'repo-map', automatable: true, check: checkUnhandledPromises, agentSource: 'error-handling', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-9-rule-4', categoryId: 9, name: 'Data-Fetching-Komponenten zeigen Loading-State', weight: 1, checkMode: 'repo-map', automatable: true, check: checkLoadingStates, agentSource: 'code-style', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },

  // ── Category Gap Checks (cat-7 Performance, cat-11 CI/CD, cat-20 Cost) ───
  { id: 'cat-7-rule-7', categoryId: 7, name: 'Performance-Basics (lazy images, next/image, bundle)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkPerformanceBasics, agentSource: 'performance', fixType: 'code-fix' , tier: 'code', domain: 'performance' },
  { id: 'cat-11-rule-7', categoryId: 11, name: 'CI-Pipeline vorhanden', weight: 3, checkMode: 'repo-map', automatable: true, check: checkCIPipelineExists, agentSource: 'platform', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-11-rule-8', categoryId: 11, name: 'CI enthält Type-Check', weight: 2, checkMode: 'repo-map', automatable: true, check: checkCIHasTypeCheck, agentSource: 'platform', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-20-rule-6', categoryId: 20, name: 'LLM-Aufrufe haben Token-Limit', weight: 2, checkMode: 'repo-map', automatable: true, check: checkLLMTokenLimits, agentSource: 'cost-awareness', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-20-rule-7', categoryId: 20, name: 'AI-API-Routes haben Rate-Limiting', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAIRouteRateLimiting, agentSource: 'cost-awareness', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },

  // ── cat-14 + cat-12 Gap Fills ────────────────────────────────────────────
  { id: 'cat-14-rule-8', categoryId: 14, name: 'Core-Dependencies aktuell (React/Next.js/TS)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkOutdatedMajorVersions, agentSource: 'dependencies', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-12-rule-10', categoryId: 12, name: 'Error-Monitoring installiert', weight: 2, checkMode: 'repo-map', automatable: true, check: checkErrorMonitoring, agentSource: 'observability', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Final 5 Categories (cat-8, cat-13, cat-18, cat-21, cat-23) ───────────
  { id: 'cat-13-rule-8', categoryId: 13, name: 'Backup-Konzept dokumentiert', weight: 2, checkMode: 'repo-map', automatable: true, check: checkBackupDocs, agentSource: 'backup-dr', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-13-rule-9', categoryId: 13, name: 'Supabase PITR-Status verifiziert', weight: 1, checkMode: 'repo-map', automatable: true, check: checkSupabasePITR, agentSource: 'backup-dr', fixType: 'manual' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-8-rule-6', categoryId: 8, name: 'API-Routes mit externen Calls haben Timeout', weight: 2, checkMode: 'repo-map', automatable: true, check: checkAPITimeouts, agentSource: 'scalability', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-8-rule-7', categoryId: 8, name: 'Datenbank-Queries haben Limit/Pagination', weight: 2, checkMode: 'repo-map', automatable: true, check: checkUnlimitedQueries, agentSource: 'scalability', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-18-rule-7', categoryId: 18, name: 'README vollstaendig', weight: 2, checkMode: 'repo-map', automatable: true, check: checkReadmeQuality, agentSource: 'content', fixType: 'code-gen' , tier: 'code', domain: 'documentation' },
  { id: 'cat-18-rule-8', categoryId: 18, name: 'CHANGELOG vorhanden', weight: 1, checkMode: 'repo-map', automatable: true, check: checkChangelog, agentSource: 'content', fixType: 'code-gen' , tier: 'code', domain: 'documentation' },
  { id: 'cat-21-rule-5', categoryId: 21, name: 'Web App Manifest vorhanden', weight: 1, checkMode: 'repo-map', automatable: true, check: checkWebManifest, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-21-rule-6', categoryId: 21, name: 'Offline-Fallback (Service Worker)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkOfflineFallback, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  // cat-23-rule-2 (Health Check) already exists via file-system-checker
  { id: 'cat-23-rule-6', categoryId: 23, name: 'Deployment dokumentiert', weight: 1, checkMode: 'repo-map', automatable: true, check: checkDeploymentDocs, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── Thin Category Strengthening ──────────────────────────────────────────
  { id: 'cat-15-rule-7', categoryId: 15, name: 'Konsistente Icon-Library', weight: 1, checkMode: 'repo-map', automatable: true, check: checkIconLibraryConsistency, agentSource: 'design-system', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-15-rule-8', categoryId: 15, name: 'next/font display: swap (nicht optional)', weight: 1, checkMode: 'file-system', automatable: true, check: checkNextFontDisplayMode, agentSource: 'design-system', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-17-rule-4', categoryId: 17, name: 'Keine hardcodierten Strings in JSX', weight: 1, checkMode: 'repo-map', automatable: true, check: checkHardcodedStrings, agentSource: 'content', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-19-rule-5', categoryId: 19, name: '.gitignore vollstaendig', weight: 2, checkMode: 'repo-map', automatable: true, check: checkGitignoreCompleteness, agentSource: 'git-governance', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-23-rule-5', categoryId: 23, name: 'Deployment-Konfiguration vorhanden', weight: 1, checkMode: 'repo-map', automatable: true, check: checkDeploymentConfig, fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-10-rule-7', categoryId: 10, name: 'Test-Framework installiert', weight: 2, checkMode: 'repo-map', automatable: true, check: checkTestFrameworkInstalled, agentSource: 'testing', fixType: 'code-gen' , tier: 'code', domain: 'code-quality' },

  // ── SPEC_AGENT — cat-18 extensions (Sprint 11) ───────────────────────────
  // Context quality checks: are AI context files meaningful? Is there a PRD?
  // DISTINCT from cat-18-rule-1 (README exists) and cat-18-rule-7 (README length).
  { id: 'cat-18-rule-9',  categoryId: 18, name: 'KI-Kontext-Datei vorhanden und vollstaendig', weight: 2, checkMode: 'file-system', automatable: true, check: checkAiContextFile, agentSource: 'spec', enforcement: 'advisory', fixType: 'code-gen' , tier: 'code', domain: 'documentation' },
  { id: 'cat-18-rule-10', categoryId: 18, name: 'PRD oder Requirements-Dokument vorhanden', weight: 1, checkMode: 'file-system', automatable: true, check: checkPrdPresent, agentSource: 'spec', enforcement: 'advisory', fixType: 'code-gen' , tier: 'code', domain: 'documentation' },
  { id: 'cat-18-rule-11', categoryId: 18, name: 'README-Implementation-Drift', weight: 1, checkMode: 'repo-map', automatable: true, check: checkReadmeDrift, agentSource: 'spec', enforcement: 'advisory', fixType: 'code-gen' , tier: 'code', domain: 'documentation' },
  { id: 'cat-18-rule-12', categoryId: 18, name: '.cursorrules enthaelt Tech-Stack', weight: 1, checkMode: 'file-system', automatable: true, check: checkCursorrulesHasStack, agentSource: 'spec', enforcement: 'advisory', fixType: 'code-fix' , tier: 'code', domain: 'documentation' },

  // ── Category 26: KI-Code-Hygiene (SLOP_DETECTION_AGENT, Sprint 11) ─────────
  // Detects patterns common in unreviewed AI-generated code. Non-judgmental: awareness only.
  { id: 'cat-26-rule-1', categoryId: 26, name: 'Keine AI-Placeholder-Kommentare', weight: 2, checkMode: 'repo-map', automatable: true, check: checkPlaceholderComments, agentSource: 'slop', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-26-rule-2', categoryId: 26, name: 'Keine AI-Tool-Fingerprints im Repo', weight: 1, checkMode: 'repo-map', automatable: true, check: checkAiToolFingerprints, agentSource: 'slop', enforcement: 'advisory', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-26-rule-3', categoryId: 26, name: 'Keine Überkommentierung (Kommentar-Ratio <40%)', weight: 1, checkMode: 'repo-map', automatable: true, check: checkOvercommenting, agentSource: 'slop', enforcement: 'advisory', fixType: 'code-fix', tier: 'metric', domain: 'code-quality' },
  { id: 'cat-26-rule-4', categoryId: 26, name: 'Keine Placeholder-Credentials im Sourcecode', weight: 3, checkMode: 'repo-map', automatable: true, check: checkPlaceholderCredentials, agentSource: 'slop', enforcement: 'reviewed', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },
  { id: 'cat-26-rule-5', categoryId: 26, name: 'Konsistente Kommentar-Sprache', weight: 1, checkMode: 'repo-map', automatable: true, check: checkMixedCommentLanguage, agentSource: 'slop', enforcement: 'advisory', fixType: 'code-fix' , tier: 'code', domain: 'code-quality' },

  // ── DB-Sicherheit (sec-db) — ADR-025 Tab-Sprint Phase 1, 2026-04-29 ────────
  { id: 'sec-db-01', categoryId: 3, name: 'RLS auf User-Daten-Tabellen aktiviert', weight: 3,
    checkMode: 'cli' as const, automatable: true, check: checkRlsOnUserTables,
    agentSource: 'security' as const, enforcement: 'blocked' as const, fixType: 'code-gen' as const,
    tier: 'code' as const, domain: 'security' as const },
  { id: 'sec-db-02', categoryId: 3, name: 'Service-Role-Key nicht im Frontend-Code', weight: 3,
    checkMode: 'repo-map' as const, automatable: true, check: checkNoServiceRoleInFrontend,
    agentSource: 'security' as const, enforcement: 'blocked' as const, fixType: 'code-fix' as const,
    tier: 'code' as const, domain: 'security' as const },
  { id: 'sec-db-03', categoryId: 3, name: 'Anon-Key ohne Wildcard-Schreibzugriff', weight: 2,
    checkMode: 'cli' as const, automatable: true, check: checkAnonKeyNoWriteWildcard,
    agentSource: 'security' as const, enforcement: 'reviewed' as const, fixType: 'code-fix' as const,
    tier: 'code' as const, domain: 'security' as const },
  manual('sec-db-04', 3, 'Public-Schema: kein PII ohne RLS', 3, 'code-gen', 'code', undefined, 'security'),
  manual('sec-db-05', 3, 'RLS-Policies aktiviert (nicht nur definiert)', 2, 'code-fix', 'code', undefined, 'security'),
  manual('sec-db-06', 3, 'Auth-Tabellen strenger als Daten-Tabellen', 2, 'code-fix', 'code', undefined, 'security'),
  { id: 'sec-db-07', categoryId: 3, name: 'Storage-Buckets haben Zugriffs-Policies', weight: 2,
    checkMode: 'cli' as const, automatable: true, check: checkStorageBucketPolicies,
    agentSource: 'security' as const, enforcement: 'reviewed' as const, fixType: 'code-gen' as const,
    tier: 'code' as const, domain: 'security' as const },
  { id: 'sec-db-08', categoryId: 3, name: 'Edge Functions: kein Service-Role im User-Context', weight: 3,
    checkMode: 'repo-map' as const, automatable: true, check: checkEdgeFunctionsNoServiceRoleInUserContext,
    agentSource: 'security' as const, enforcement: 'blocked' as const, fixType: 'code-fix' as const,
    tier: 'code' as const, domain: 'security' as const },
  manual('sec-db-09', 3, 'Realtime-Subscriptions serverseitig gefiltert', 2, 'code-fix', 'code', undefined, 'security'),
  { id: 'sec-db-10', categoryId: 3, name: 'Backup-Strategie dokumentiert (PITR-Status)', weight: 2,
    checkMode: 'documentation' as const, automatable: true, check: checkDbBackupStrategyDocumented,
    agentSource: 'security' as const, enforcement: 'reviewed' as const, fixType: 'code-gen' as const,
    tier: 'code' as const, domain: 'security' as const },
]

export function getRulesForCategory(categoryId: number): AuditRule[] {
  return AUDIT_RULES.filter((r) => r.categoryId === categoryId)
}

export function getRuleById(id: string): AuditRule | undefined {
  return AUDIT_RULES.find((r) => r.id === id)
}

/** Resolves the fixType for a rule ID. Returns 'manual' as fallback. */
export function getFixType(ruleId: string): 'code-fix' | 'code-gen' | 'refactoring' | 'manual' {
  return AUDIT_RULES.find((r) => r.id === ruleId)?.fixType ?? 'manual'
}
