// src/lib/audit/checkers/agent-regulatory-checker.ts
// Automated checks for the three regulatory deep agents (Sprint 8):
//   DSGVO_AGENT  — GDPR/DSGVO EU 2016/679
//   BFSG_AGENT   — Barrierefreiheitsstärkungsgesetz + WCAG 2.1 AA
//   AI_ACT_AGENT — EU AI Act 2024/1689
//
// Rule IDs are set in rule-registry.ts — not repeated here.

import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}
function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}
function hasFile(rootPath: string, ...parts: string[]): boolean {
  return fs.existsSync(join(rootPath, ...parts))
}
function hasDep(pkg: AuditContext['packageJson'], name: string): boolean {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])
}
function readFile(path: string): string {
  try { return fs.readFileSync(path, 'utf-8') } catch { return '' }
}
function readAt(rootPath: string, ...parts: string[]): string {
  return readFile(join(rootPath, ...parts))
}

/** Walk a directory recursively and collect all file paths matching extension */
function walkFiles(dir: string, ext: string[]): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  function walk(d: string) {
    let entries: string[]
    try { entries = fs.readdirSync(d) as string[] } catch { return }
    for (const entry of entries) {
      const full = join(d, entry)
      let stat: fs.Stats
      try { stat = fs.statSync(full) } catch { continue }
      if (stat.isDirectory()) walk(full)
      else if (ext.some((e) => full.endsWith(e))) results.push(full)
    }
  }
  walk(dir)
  return results
}

/** Search content of multiple files for a regex pattern */
function grepFiles(files: string[], pattern: RegExp): { file: string; match: string }[] {
  const hits: { file: string; match: string }[] = []
  for (const file of files) {
    const content = readFile(file)
    const m = pattern.exec(content)
    if (m) hits.push({ file, match: m[0] })
  }
  return hits
}

// ═══════════════════════════════════════════════════════════════════════════
// DSGVO AGENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DSGVO R1 — Privacy policy page (/datenschutz or /privacy) exists.
 * Note: checkLegalPages also covers this + impressum together.
 * This check is DSGVO-specific (Art. 13/14) with more path variants.
 */
export async function checkDsgvoPrivacyPage(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    'src/app/datenschutz/page.tsx',
    'src/app/(legal)/datenschutz/page.tsx',
    'src/app/privacy/page.tsx',
    'src/app/(legal)/privacy/page.tsx',
    'src/app/datenschutz.tsx',
    'pages/datenschutz.tsx',
    'pages/privacy.tsx',
  ]
  if (candidates.some((p) => hasFile(ctx.rootPath, p))) {
    return pass('cat-4-rule-11', 5, 'Datenschutzerklärung / Privacy Policy page found (DSGVO Art. 13)')
  }
  return fail('cat-4-rule-11', 0, 'Keine Datenschutzerklärung-Seite gefunden', [{
    severity: 'critical',
    message: 'DSGVO Art. 13/14 erfordert eine Datenschutzerklärung — Seite fehlt',
    suggestion: 'Erstelle src/app/datenschutz/page.tsx mit allen Pflichtangaben nach Art. 13(1)',
  }])
}

/**
 * DSGVO R4 — Cookie Consent Management Platform (CMP) library in dependencies.
 * Checks for all common CMP libraries beyond the basic checkCookieConsent.
 */
export async function checkDsgvoCookieConsentLibrary(ctx: AuditContext): Promise<RuleResult> {
  const cmpLibs = [
    'cookiebot', '@cookiehub/cookie-consent-banner', 'tarteaucitron',
    'usercentrics', 'onetrust', 'klaro', 'react-cookie-consent',
    'cookieconsent', '@osano/cookieconsent', 'vanilla-cookieconsent',
  ]
  const found = cmpLibs.find((lib) => hasDep(ctx.packageJson, lib))
  if (found) {
    return pass('cat-4-rule-12', 5, `Cookie Consent Library gefunden: ${found}`)
  }

  // Fallback: check if consent is handled via component file
  const consentFiles = ctx.filePaths.filter((p) => {
    const l = p.toLowerCase()
    return (l.includes('consent') || l.includes('cookie-banner') || l.includes('cookiebanner'))
      && (p.endsWith('.tsx') || p.endsWith('.ts'))
  })
  if (consentFiles.length > 0) {
    return pass('cat-4-rule-12', 4, `Cookie-Consent-Komponente gefunden: ${consentFiles[0]}`)
  }

  return fail('cat-4-rule-12', 0, 'Keine Cookie Consent Management Library gefunden', [{
    severity: 'critical',
    message: 'DSGVO/ePrivacy Art. 5(3): Cookie-Consent vor nicht-essentiellen Cookies erforderlich',
    suggestion: 'Füge eine CMP-Library hinzu (z.B. klaro, react-cookie-consent) oder implementiere Banner-Komponente',
  }])
}

/**
 * DSGVO R5 — No unconditional tracking scripts before consent in root layout.
 * Flags Google Analytics, GTM, Meta Pixel, Hotjar etc. loaded without consent guard.
 */
export async function checkDsgvoNoTrackingBeforeConsent(ctx: AuditContext): Promise<RuleResult> {
  const layoutPaths = [
    join(ctx.rootPath, 'src/app/layout.tsx'),
    join(ctx.rootPath, 'src/app/layout.ts'),
    join(ctx.rootPath, 'pages/_document.tsx'),
    join(ctx.rootPath, 'pages/_app.tsx'),
    join(ctx.rootPath, 'app/layout.tsx'),
  ]

  const trackingPatterns = /\b(gtag|GA_MEASUREMENT_ID|GTM-|fbevents|hotjar|mixpanel|amplitude|heap\.load|clarity\.run|_paq\.push)\b/

  const findings: Finding[] = []
  for (const layoutPath of layoutPaths) {
    const content = readFile(layoutPath)
    if (!content) continue
    const match = trackingPatterns.exec(content)
    if (match) {
      // If consent guard wraps it, that's fine
      const hasConsentGuard = /consent|hasConsent|cookiesAccepted|isGranted/i.test(content)
      if (!hasConsentGuard) {
        findings.push({
          severity: 'critical',
          message: `Tracking-Script ohne Consent-Guard in ${layoutPath.replace(ctx.rootPath + '/', '')}`,
          filePath: layoutPath.replace(ctx.rootPath + '/', ''),
          suggestion: 'Tracking-Scripts nur nach Nutzer-Einwilligung laden (ePrivacy Art. 5(3), DSGVO Art. 7)',
        })
      }
    }
  }

  if (findings.length === 0) {
    return pass('cat-4-rule-13', 5, 'Kein unbedingtes Tracking in Root-Layout gefunden')
  }
  return fail('cat-4-rule-13', 0, 'Tracking-Script ohne Consent-Guard im Root-Layout', findings)
}

/**
 * DSGVO R10 — Password hashing library present.
 * Only relevant if project implements its own auth (not delegated to Supabase/Auth0).
 */
export async function checkDsgvoPasswordHashing(ctx: AuditContext): Promise<RuleResult> {
  // If using Supabase Auth, password hashing is handled by Supabase — pass
  const hasSupabaseAuth = hasDep(ctx.packageJson, '@supabase/supabase-js') ||
    hasDep(ctx.packageJson, '@supabase/ssr') ||
    hasDep(ctx.packageJson, '@supabase/auth-helpers-nextjs')
  const hasNextAuth = hasDep(ctx.packageJson, 'next-auth') || hasDep(ctx.packageJson, '@auth/core')
  const hasClerk = hasDep(ctx.packageJson, '@clerk/nextjs')

  if (hasSupabaseAuth || hasNextAuth || hasClerk) {
    return pass('cat-4-rule-14', 5, 'Auth-Provider (Supabase/NextAuth/Clerk) übernimmt Passwort-Hashing (DSGVO Art. 32)')
  }

  // Own auth: check for hashing library
  const hashLibs = ['bcrypt', 'bcryptjs', '@node-rs/bcrypt', 'argon2', 'argon2-wasm', 'scrypt-js']
  const found = hashLibs.find((lib) => hasDep(ctx.packageJson, lib))
  if (found) {
    return pass('cat-4-rule-14', 5, `Passwort-Hashing-Library gefunden: ${found}`)
  }

  // Check if passwords are stored at all
  const authFiles = ctx.filePaths.filter((p) =>
    p.includes('auth') && (p.endsWith('.ts') || p.endsWith('.tsx'))
  )
  if (authFiles.length === 0) {
    return pass('cat-4-rule-14', 4, 'Keine eigene Auth-Implementierung gefunden — nicht anwendbar')
  }

  return fail('cat-4-rule-14', 0, 'Eigene Auth ohne Hashing-Library (DSGVO Art. 32)', [{
    severity: 'critical',
    message: 'Kein Passwort-Hashing gefunden — Plaintext-Speicherung wäre DSGVO-Verletzung',
    suggestion: 'bcrypt oder argon2 installieren, oder auf Supabase/NextAuth Auth-Provider wechseln',
  }])
}

/**
 * DSGVO R11 — HSTS header configured.
 * Checks next.config.ts / vercel.json for Strict-Transport-Security.
 */
export async function checkDsgvoHstsHeader(ctx: AuditContext): Promise<RuleResult> {
  const configFiles = [
    join(ctx.rootPath, 'next.config.ts'),
    join(ctx.rootPath, 'next.config.js'),
    join(ctx.rootPath, 'next.config.mjs'),
    join(ctx.rootPath, 'vercel.json'),
    join(ctx.rootPath, 'middleware.ts'),
    join(ctx.rootPath, 'middleware.js'),
  ]

  for (const f of configFiles) {
    const content = readFile(f)
    if (content && /Strict-Transport-Security/i.test(content)) {
      return pass('cat-4-rule-15', 5, `HSTS Header konfiguriert in ${f.replace(ctx.rootPath + '/', '')} (DSGVO Art. 32)`)
    }
  }

  return fail('cat-4-rule-15', 1, 'Strict-Transport-Security Header nicht gefunden', [{
    severity: 'high',
    message: 'HSTS-Header fehlt — DSGVO Art. 32(1)(a) fordert Verschlüsselung aller Verbindungen',
    suggestion: "In next.config.ts headers() → { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }",
  }])
}

/**
 * DSGVO R17 — Content Security Policy configured.
 * Checks next.config.ts / vercel.json for Content-Security-Policy header.
 */
export async function checkDsgvoCspHeader(ctx: AuditContext): Promise<RuleResult> {
  const configFiles = [
    join(ctx.rootPath, 'next.config.ts'),
    join(ctx.rootPath, 'next.config.js'),
    join(ctx.rootPath, 'next.config.mjs'),
    join(ctx.rootPath, 'vercel.json'),
    join(ctx.rootPath, 'middleware.ts'),
  ]

  for (const f of configFiles) {
    const content = readFile(f)
    if (content && /Content-Security-Policy/i.test(content)) {
      return pass('cat-4-rule-16', 5, `Content-Security-Policy konfiguriert in ${f.replace(ctx.rootPath + '/', '')}`)
    }
  }

  return fail('cat-4-rule-16', 1, 'Content-Security-Policy nicht gefunden', [{
    severity: 'high',
    message: 'CSP fehlt — schützt gegen XSS und unerlaubte Script-Ausführung (DSGVO Art. 32)',
    suggestion: "In next.config.ts headers(): { key: 'Content-Security-Policy', value: \"default-src 'self'\" }",
  }])
}

/**
 * DSGVO R12 — Data export endpoint (Art. 15, 20 — right of access & portability).
 */
export async function checkDsgvoDataExportEndpoint(ctx: AuditContext): Promise<RuleResult> {
  const apiRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )

  // Must be a user/account data export, not an artifact/content export (e.g. export-pptx)
  const exportPattern = /user.*export|export.*user|account.*export|data.*export(?!.*artifact)|portability/i
  const exportRoute = apiRoutes.find((f) => exportPattern.test(f.path))

  if (exportRoute) {
    return pass('cat-4-rule-17', 5, `Daten-Export-Endpoint gefunden: ${exportRoute.path}`)
  }

  // Also search in settings pages
  const settingsFiles = ctx.filePaths.filter((p) =>
    (p.includes('settings') || p.includes('account')) &&
    (p.endsWith('.tsx') || p.endsWith('.ts'))
  )
  for (const sf of settingsFiles.slice(0, 10)) {
    const content = readAt(ctx.rootPath, sf)
    if (/export.*data|download.*data|daten.*exportier|portabilität/i.test(content)) {
      return pass('cat-4-rule-17', 4, `Daten-Export in Settings-Seite erkannt: ${sf}`)
    }
  }

  return fail('cat-4-rule-17', 0, 'Kein Daten-Export-Endpoint gefunden (DSGVO Art. 15, 20)', [{
    severity: 'high',
    message: 'Recht auf Datenübertragbarkeit (Art. 20) erfordert einen Export-Endpoint',
    suggestion: 'Erstelle /api/user/export Route die alle Nutzerdaten als JSON/CSV liefert',
  }])
}

/**
 * DSGVO R13 — Account deletion (Art. 17 — right to erasure).
 */
export async function checkDsgvoAccountDeletion(ctx: AuditContext): Promise<RuleResult> {
  // Check API routes
  const apiRoutes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts')
  )
  const deleteRoute = apiRoutes.find((f) =>
    /delete.*user|user.*delete|account.*delete|delete.*account/i.test(f.path)
  )
  if (deleteRoute) {
    return pass('cat-4-rule-18', 5, `Konto-Löschungs-Endpoint gefunden: ${deleteRoute.path}`)
  }

  // Check settings pages for delete account UI
  const settingsFiles = ctx.filePaths.filter((p) =>
    (p.includes('settings') || p.includes('account') || p.includes('profile')) &&
    p.endsWith('.tsx')
  )
  for (const sf of settingsFiles.slice(0, 10)) {
    const content = readAt(ctx.rootPath, sf)
    if (/delete.*account|konto.*löschen|account.*delete|lösch.*profil/i.test(content)) {
      return pass('cat-4-rule-18', 4, `Konto-Löschung in Settings-UI erkannt: ${sf}`)
    }
  }

  return fail('cat-4-rule-18', 0, 'Kein Konto-Löschungs-Endpoint/UI gefunden (DSGVO Art. 17)', [{
    severity: 'high',
    message: 'Recht auf Löschung (Art. 17) erfordert Konto-Löschfunktion',
    suggestion: 'Settings-Seite: "Konto löschen" Button + /api/user/delete Route mit Soft-Delete/Anonymisierung',
  }])
}

// ═══════════════════════════════════════════════════════════════════════════
// BFSG AGENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * BFSG R1 — Accessibility statement page required (BFSG §12).
 * Must be at /barrierefreiheit or /accessibility-statement.
 */
export async function checkBfsgAccessibilityStatement(ctx: AuditContext): Promise<RuleResult> {
  const candidates = [
    'src/app/barrierefreiheit/page.tsx',
    'src/app/(legal)/barrierefreiheit/page.tsx',
    'src/app/accessibility-statement/page.tsx',
    'src/app/accessibility/page.tsx',
    'pages/barrierefreiheit.tsx',
  ]
  if (candidates.some((p) => hasFile(ctx.rootPath, p))) {
    return pass('cat-16-rule-5', 5, 'Barrierefreiheitserklärung-Seite gefunden (BFSG §12)')
  }
  return fail('cat-16-rule-5', 0, 'Barrierefreiheitserklärung fehlt (BFSG §12)', [{
    severity: 'high',
    message: 'BFSG §12 erfordert eine Barrierefreiheitserklärung — seit 28.06.2025 Pflicht für B2C SaaS',
    suggestion: 'Erstelle src/app/barrierefreiheit/page.tsx mit Status-Angabe, Feedback-Kontakt und Datum',
  }])
}

/**
 * BFSG R2 — Accessibility feedback mechanism in statement page.
 * Must include email contact or form for accessibility feedback.
 */
export async function checkBfsgFeedbackMechanism(ctx: AuditContext): Promise<RuleResult> {
  const statementPaths = [
    'src/app/barrierefreiheit/page.tsx',
    'src/app/(legal)/barrierefreiheit/page.tsx',
    'src/app/accessibility-statement/page.tsx',
  ]

  for (const p of statementPaths) {
    const content = readAt(ctx.rootPath, p)
    if (!content) continue
    // Check for email address, contact form, or feedback mechanism
    if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content) ||
        /feedback|kontakt|contact|melden|feedback-mechanismus/i.test(content)) {
      return pass('cat-16-rule-6', 5, 'Feedback-Mechanismus in Barrierefreiheitserklärung gefunden (BFSG §12 Abs. 3)')
    }
    // Page exists but no feedback mechanism
    return fail('cat-16-rule-6', 2, 'Barrierefreiheitserklärung ohne Feedback-Mechanismus', [{
      severity: 'medium',
      message: 'BFSG §12 Abs. 3: Feedback-Mechanismus (E-Mail/Formular) fehlt in Barrierefreiheitserklärung',
      suggestion: 'E-Mail-Adresse (z.B. barrierefreiheit@example.com) in der Barrierefreiheitserklärung angeben',
    }])
  }

  return fail('cat-16-rule-6', 0, 'Keine Barrierefreiheitserklärung für Feedback-Check gefunden', [{
    severity: 'high',
    message: 'BFSG §12 Abs. 3: Barrierefreiheitserklärung mit Feedback-Mechanismus fehlt komplett',
    suggestion: 'Zuerst src/app/barrierefreiheit/page.tsx mit Feedback-E-Mail erstellen',
  }])
}

/**
 * BFSG R5 — Document language declaration (WCAG 2.1 SC 3.1.1).
 * Checks for lang attribute on html element in root layout.
 */
export async function checkBfsgHtmlLang(ctx: AuditContext): Promise<RuleResult> {
  const layoutPaths = [
    'src/app/layout.tsx',
    'src/app/layout.ts',
    'app/layout.tsx',
    'pages/_document.tsx',
    'pages/_document.js',
  ]

  for (const p of layoutPaths) {
    const content = readAt(ctx.rootPath, p)
    if (!content) continue
    if (/<html[^>]+lang\s*=\s*["'][a-z]{2}/i.test(content)) {
      return pass('cat-16-rule-7', 5, `HTML lang-Attribut in ${p} gesetzt (WCAG 2.1 SC 3.1.1)`)
    }
    if (content.includes('<html') || content.includes('DocumentType')) {
      return fail('cat-16-rule-7', 0, `HTML lang-Attribut fehlt in ${p}`, [{
        severity: 'high',
        message: 'WCAG 2.1 SC 3.1.1: <html lang="de"> fehlt — Screen Reader können Sprache nicht erkennen',
        suggestion: "In src/app/layout.tsx: <html lang=\"de\"> (oder die primäre Sprache der App)",
      }])
    }
  }

  return pass('cat-16-rule-7', 3, 'Root-Layout nicht gefunden — lang-Attribut nicht prüfbar')
}

/**
 * BFSG R6 / ACCESSIBILITY R11 — Skip navigation link (WCAG 2.1 SC 2.4.1).
 * Checks for skip-to-content link in layout components.
 */
export async function checkBfsgSkipNavLink(ctx: AuditContext): Promise<RuleResult> {
  const layoutFiles = ctx.repoMap.files.filter((f) =>
    f.path.startsWith('src/components/layout/') && f.path.endsWith('.tsx')
  )
  const rootLayoutPath = join(ctx.rootPath, 'src/app/layout.tsx')

  const skipPattern = /skip.*content|skip.*main|zum.*inhalt|skip-link|skipnav|skip.*nav/i

  // Check layout components
  for (const lf of layoutFiles) {
    const content = readAt(ctx.rootPath, lf.path)
    if (skipPattern.test(content)) {
      return pass('cat-16-rule-8', 5, `Skip-Navigation-Link in ${lf.path} gefunden (WCAG 2.1 SC 2.4.1)`)
    }
  }
  // Check root layout
  const rootLayout = readFile(rootLayoutPath)
  if (skipPattern.test(rootLayout)) {
    return pass('cat-16-rule-8', 5, 'Skip-Navigation-Link in root layout gefunden')
  }

  return fail('cat-16-rule-8', 1, 'Kein Skip-Navigation-Link gefunden (WCAG 2.1 SC 2.4.1)', [{
    severity: 'medium',
    message: 'Tastaturnutzer können Navigation nicht überspringen — WCAG 2.1 SC 2.4.1 verletzt',
    suggestion: 'Erster fokussierbarer Element im Layout: <a href="#main-content" className="skip-link">Zum Inhalt springen</a>',
  }])
}

/**
 * BFSG R11 — ARIA live regions for dynamic content (WCAG 2.1 SC 4.1.3).
 * Checks for aria-live / role=status in chat/notification components.
 */
export async function checkBfsgAriaLiveRegions(ctx: AuditContext): Promise<RuleResult> {
  // Focus on dynamic UI areas: chat, notifications, toasts, status
  const dynamicFiles = ctx.repoMap.files.filter((f) => {
    const p = f.path.toLowerCase()
    return (p.includes('chat') || p.includes('notification') || p.includes('toast') ||
            p.includes('alert') || p.includes('status') || p.includes('message')) &&
           f.path.endsWith('.tsx')
  })

  if (dynamicFiles.length === 0) {
    return pass('cat-16-rule-9', 4, 'Keine dynamischen UI-Komponenten gefunden — ARIA live nicht prüfbar')
  }

  const ariaPattern = /aria-live|role=["']status["']|role=["']alert["']|role=["']log["']/

  const withAriaLive = dynamicFiles.filter((f) => {
    const content = readAt(ctx.rootPath, f.path)
    return ariaPattern.test(content)
  })

  if (withAriaLive.length > 0) {
    return pass('cat-16-rule-9', 5, `ARIA-Live-Regionen in ${withAriaLive.length} Komponente(n) gefunden`)
  }

  return fail('cat-16-rule-9', 1, 'Keine ARIA-Live-Regionen in dynamischen Komponenten', [{
    severity: 'medium',
    message: `${dynamicFiles.length} dynamische Komponente(n) ohne aria-live (WCAG 2.1 SC 4.1.3)`,
    affectedFiles: dynamicFiles.slice(0, 5).map((f) => f.path),
    suggestion: 'Bei dynamischen Updates aria-live="polite" oder role="status" setzen',
  }])
}

// ═══════════════════════════════════════════════════════════════════════════
// AI ACT AGENT
// ═══════════════════════════════════════════════════════════════════════════

/** Check if project has AI dependencies (applicability gate for all AI Act rules) */
function hasAiDeps(pkg: AuditContext['packageJson']): boolean {
  const aiDeps = [
    '@anthropic-ai/sdk', 'openai', '@google/generative-ai',
    '@mistralai/mistralai', 'ai', '@ai-sdk/anthropic', '@ai-sdk/openai', '@ai-sdk/google',
  ]
  return aiDeps.some((dep) => hasDep(pkg, dep))
}

/**
 * AI_ACT R2 — Risk classification documentation (Art. 6).
 * Looks for ai-act-risk or risk-classification docs.
 */
export async function checkAiActRiskClassification(ctx: AuditContext): Promise<RuleResult> {
  if (!hasAiDeps(ctx.packageJson)) {
    return pass('cat-22-rule-9', 5, 'Keine KI-Dependencies — AI Act nicht anwendbar')
  }

  const docsDir = join(ctx.rootPath, 'docs')
  const docFiles = walkFiles(docsDir, ['.md', '.pdf', '.docx'])
  const pattern = /ai.act|risk.class|risikoklasse|minimal.risk|high.risk|risikoklass/i

  for (const f of docFiles) {
    const content = readFile(f)
    if (pattern.test(f) || pattern.test(content)) {
      return pass('cat-22-rule-9', 5, `AI Act Risiko-Klassifizierung dokumentiert: ${f.replace(ctx.rootPath + '/', '')}`)
    }
  }

  // Also check CLAUDE.md
  const claudeMd = readAt(ctx.rootPath, 'CLAUDE.md')
  if (/ai.act|risk.class|risikoklass/i.test(claudeMd)) {
    return pass('cat-22-rule-9', 4, 'AI Act Risiko-Klassifizierung in CLAUDE.md erwähnt')
  }

  return fail('cat-22-rule-9', 0, 'Keine AI Act Risiko-Klassifizierung dokumentiert (Art. 6)', [{
    severity: 'high',
    message: 'EU AI Act Art. 6: Risiko-Klassifizierung muss dokumentiert sein',
    suggestion: 'Erstelle docs/ai-act-risk-classification.md mit Einstufung (minimal-risk/limited-risk/high-risk) und Begründung',
  }])
}

/**
 * AI_ACT R3 — AI interaction disclosure in UI (Art. 50 Abs. 1).
 * Users must be informed they're interacting with an AI.
 */
export async function checkAiActDisclosure(ctx: AuditContext): Promise<RuleResult> {
  if (!hasAiDeps(ctx.packageJson)) {
    return pass('cat-22-rule-10', 5, 'Keine KI-Dependencies — AI Act Transparenzpflicht nicht anwendbar')
  }

  const uiFiles = ctx.repoMap.files.filter((f) =>
    f.path.startsWith('src/') && f.path.endsWith('.tsx') &&
    !f.path.includes('.test.') && !f.path.includes('.spec.')
  )

  const disclosurePattern = /\b(KI|AI|Toro|Assistent|assistant|generiert|generated|powered.by|ki-antwort|ai-response)\b/i

  const withDisclosure = uiFiles.filter((f) => {
    const content = readAt(ctx.rootPath, f.path)
    return disclosurePattern.test(content)
  })

  if (withDisclosure.length >= 2) {
    return pass('cat-22-rule-10', 5, `KI-Transparenz-Hinweis in ${withDisclosure.length} UI-Komponente(n) gefunden (AI Act Art. 50)`)
  }
  if (withDisclosure.length === 1) {
    return pass('cat-22-rule-10', 3, `KI-Transparenz in 1 Komponente — ggf. weitere benötigt: ${withDisclosure[0].path}`)
  }

  return fail('cat-22-rule-10', 0, 'Kein KI-Transparenz-Hinweis in UI-Komponenten gefunden (Art. 50)', [{
    severity: 'high',
    message: 'EU AI Act Art. 50: User muss wissen, dass er mit KI interagiert',
    suggestion: 'Label/Badge in Chat-UI: "KI-generierte Antwort" oder "Powered by Toro (KI)"',
  }])
}

/**
 * AI_ACT R6 — AI decision logging in DB schema (Art. 12 — record-keeping).
 * Checks for ai_runs or similar logging table in migrations.
 */
export async function checkAiActDecisionLogging(ctx: AuditContext): Promise<RuleResult> {
  if (!hasAiDeps(ctx.packageJson)) {
    return pass('cat-22-rule-11', 5, 'Keine KI-Dependencies — AI Act Logging-Pflicht nicht anwendbar')
  }

  const migrationsDir = join(ctx.rootPath, 'supabase', 'migrations')
  const sqlFiles: string[] = []
  if (fs.existsSync(migrationsDir)) {
    try {
      const files = fs.readdirSync(migrationsDir) as string[]
      sqlFiles.push(...files.filter((f) => f.endsWith('.sql')).map((f) => join(migrationsDir, f)))
    } catch { /* ignore */ }
  }

  const loggingPattern = /ai_runs|ai_audit|ai_decisions|conversation_log|llm_calls|model_calls/i

  for (const f of sqlFiles) {
    const content = readFile(f)
    if (loggingPattern.test(content)) {
      return pass('cat-22-rule-11', 5, `KI-Logging-Tabelle in Migration gefunden: ${f.replace(ctx.rootPath + '/', '')} (AI Act Art. 12)`)
    }
  }

  // Check src/ for logging patterns
  const srcFiles = ctx.repoMap.files.filter((f) =>
    f.path.startsWith('src/') && (f.path.endsWith('.ts') || f.path.endsWith('.tsx'))
  )
  for (const sf of srcFiles.slice(0, 100)) {
    const content = readAt(ctx.rootPath, sf.path)
    if (/ai_runs|ai_audit|log.*model|log.*tokens|conversation.*log/i.test(content)) {
      return pass('cat-22-rule-11', 4, `KI-Logging-Code in ${sf.path} gefunden`)
    }
  }

  return fail('cat-22-rule-11', 0, 'Keine KI-Entscheidungs-Logging-Tabelle gefunden (AI Act Art. 12)', [{
    severity: 'high',
    message: 'EU AI Act Art. 12: KI-Entscheidungen müssen protokolliert werden (Timestamp, User-ID, Modell)',
    suggestion: 'Migration: CREATE TABLE ai_runs (id, user_id, model, prompt_tokens, completion_tokens, created_at)',
  }])
}

/**
 * AI_ACT R9 — AI purpose documentation (Art. 13 Abs. 1).
 * Checks docs/ for intended-use / ai-purpose description.
 */
export async function checkAiActPurposeDocs(ctx: AuditContext): Promise<RuleResult> {
  if (!hasAiDeps(ctx.packageJson)) {
    return pass('cat-22-rule-12', 5, 'Keine KI-Dependencies — AI Act Dokumentationspflicht nicht anwendbar')
  }

  const docsDir = join(ctx.rootPath, 'docs')
  const docFiles = walkFiles(docsDir, ['.md', '.pdf', '.docx'])
  const purposePattern = /intended.use|ai.purpose|einsatzzweck|bestimmungsgemäß|ki.zweck/i

  for (const f of docFiles) {
    if (purposePattern.test(f) || purposePattern.test(readFile(f))) {
      return pass('cat-22-rule-12', 5, `KI-Einsatzzweck dokumentiert: ${f.replace(ctx.rootPath + '/', '')}`)
    }
  }

  // Check CLAUDE.md / README for AI purpose
  for (const meta of ['CLAUDE.md', 'README.md', 'ARCHITECT.md']) {
    const content = readAt(ctx.rootPath, meta)
    if (purposePattern.test(content)) {
      return pass('cat-22-rule-12', 4, `KI-Einsatzzweck in ${meta} dokumentiert`)
    }
  }

  return fail('cat-22-rule-12', 1, 'Kein KI-Einsatzzweck-Dokument gefunden (AI Act Art. 13)', [{
    severity: 'medium',
    message: 'EU AI Act Art. 13: Technische Dokumentation muss Einsatzzweck beschreiben',
    suggestion: 'Erstelle docs/ai-intended-use.md mit: Zweck, Zielgruppe, Einschränkungen, Deployment-Kontext',
  }])
}

/**
 * AI_ACT R10 — No prohibited AI practices (Art. 5).
 * Scans code/prompts for prohibited patterns (subliminal manipulation, social scoring, etc.)
 */
export async function checkAiActProhibitedPractices(ctx: AuditContext): Promise<RuleResult> {
  if (!hasAiDeps(ctx.packageJson)) {
    return pass('cat-22-rule-13', 5, 'Keine KI-Dependencies — AI Act Verbots-Check nicht anwendbar')
  }

  const prohibitedPattern = /subliminal|social.scor|biometric.*surveillance|mass.*surveillance|emotion.*recogni.*workplace|exploit.*vulnerabilit/i

  const scanDirs = [
    join(ctx.rootPath, 'src'),
    join(ctx.rootPath, 'supabase', 'functions'),
    join(ctx.rootPath, 'prompts'),
  ]

  const findings: Finding[] = []
  for (const dir of scanDirs) {
    const files = walkFiles(dir, ['.ts', '.tsx', '.js', '.md', '.txt'])
    for (const f of files.slice(0, 200)) {
      const content = readFile(f)
      const match = prohibitedPattern.exec(content)
      if (match) {
        findings.push({
          severity: 'critical',
          message: `Mögliche verbotene KI-Praxis in ${f.replace(ctx.rootPath + '/', '')}: "${match[0]}"`,
          filePath: f.replace(ctx.rootPath + '/', ''),
          suggestion: 'EU AI Act Art. 5: Subliminal Manipulation, Social Scoring und biometrische Massenüberwachung sind verboten',
        })
      }
    }
  }

  if (findings.length === 0) {
    return pass('cat-22-rule-13', 5, 'Keine verbotenen KI-Praktiken (Art. 5) im Code gefunden')
  }
  return fail('cat-22-rule-13', 0, `${findings.length} mögliche verbotene KI-Praktiken gefunden`, findings.slice(0, 5))
}
