// src/lib/audit/checkers/sprint9b-domain-checkers.ts
// ADR-027 Schritt 9b — Neue Domain-Detektoren: OSS, Marketing, Plattform, Infrastruktur.
// Diese Detektoren sind LAZY — sie laufen nur wenn das Profil die Domain aktiviert hat.

import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

function pass(ruleId: string, reason: string): RuleResult {
  return { ruleId, score: 5, reason, findings: [], automated: true }
}

function info(ruleId: string, reason: string, findings: Finding[]): RuleResult {
  return { ruleId, score: 5, reason, findings, automated: true }
}

function warn(ruleId: string, score: number, reason: string, findings: Finding[]): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}

// ── OSS-Lizenzen-Detektor ─────────────────────────────────────────────────────

const COPYLEFT_LICENSES = new Set([
  'GPL', 'GPL-2.0', 'GPL-2.0-only', 'GPL-2.0-or-later',
  'GPL-3.0', 'GPL-3.0-only', 'GPL-3.0-or-later',
  'AGPL-3.0', 'AGPL-3.0-only', 'AGPL-3.0-or-later',
  'LGPL-2.0', 'LGPL-2.1', 'LGPL-2.1-only', 'LGPL-2.1-or-later',
  'LGPL-3.0', 'LGPL-3.0-only', 'LGPL-3.0-or-later',
  'EUPL-1.1', 'EUPL-1.2',
])

function isCopyleft(license: string | null | undefined): boolean {
  if (!license) return false
  const upper = license.toUpperCase()
  // Check for GPL/AGPL/LGPL patterns
  if (/\bAGPL\b/.test(upper)) return true
  if (/\bLGPL\b/.test(upper)) return true
  if (/\bGPL\b/.test(upper) && !/\bMIT\b/.test(upper)) return true
  return COPYLEFT_LICENSES.has(license)
}

function getLicense(packageJsonPath: string): string | null {
  try {
    const raw = fs.readFileSync(packageJsonPath, 'utf-8')
    const pkg = JSON.parse(raw) as { license?: string | { type: string } }
    if (typeof pkg.license === 'string') return pkg.license
    if (typeof pkg.license === 'object' && pkg.license?.type) return pkg.license.type
    return null
  } catch {
    return null
  }
}

export async function checkOssLicenses(ctx: AuditContext): Promise<RuleResult> {
  const deps = Object.keys(ctx.packageJson.dependencies ?? {})
  if (deps.length === 0) return pass('oss-license-copyleft', 'No direct dependencies to check')

  const nodeModules = join(ctx.rootPath, 'node_modules')
  if (!fs.existsSync(nodeModules)) {
    return info('oss-license-copyleft', 'node_modules not found — cannot check licenses', [{
      severity: 'info',
      message: 'Lizenzen konnten nicht geprüft werden — node_modules nicht vorhanden. Führt `pnpm install` aus.',
      suggestion: 'pnpm install ausführen, dann erneut scannen.',
    }])
  }

  const copyleftFindings: Finding[] = []

  for (const dep of deps) {
    const pkgPath = join(nodeModules, dep, 'package.json')
    const license = getLicense(pkgPath)
    if (!license) continue // unbekannte Lizenz — kein Finding (konservativ)

    if (isCopyleft(license)) {
      copyleftFindings.push({
        severity: 'high',
        message: `${dep} (${license}) — Copyleft-Lizenz in direkten Dependencies`,
        suggestion: `Prüft ob ${dep} dual-licensed ist. Wenn nein: durch Alternative ersetzen oder Lizenz-Compliance sicherstellen.`,
        filePath: 'package.json',
        isKiller: false, // Coach: Solo bekommt Polish, Killer kommt über Profil-Logik
      } as Finding)
    }
  }

  if (copyleftFindings.length === 0) {
    return pass('oss-license-copyleft', `Checked ${deps.length} direct dependencies — no copyleft licenses found`)
  }

  return warn('oss-license-copyleft', 2,
    `${copyleftFindings.length} direct dependency/ies with copyleft license`,
    copyleftFindings,
  )
}

// ── Marketing/Tracking-Detektor ───────────────────────────────────────────────
// Nur Detection — Consent-Logik kommt in eigenem Sprint (Backlog).

const ANALYTICS_LIBS = ['@next/third-parties', 'react-ga4', '@vercel/analytics', 'posthog-js', 'mixpanel-browser', 'amplitude-js']
const PIXEL_LIBS = ['react-facebook-pixel', 'fb-sdk', '@analytics/google-tag-manager', 'gtag']
const SESSION_RECORDING_LIBS = ['@hotjar/browser', 'hotjar', 'fullstory-browser', 'logrocket', '@fullstory/browser']
const ERROR_MONITORING_LIBS = ['@sentry/nextjs', '@sentry/react', '@sentry/browser', 'bugsnag', '@bugsnag/js', 'rollbar']

function hasDep(ctx: AuditContext, libName: string): boolean {
  return !!(
    ctx.packageJson.dependencies?.[libName] ||
    ctx.packageJson.devDependencies?.[libName]
  )
}

function detectLibs(ctx: AuditContext, libs: string[]): string[] {
  return libs.filter(lib => hasDep(ctx, lib))
}

export async function checkMarketingTracking(ctx: AuditContext): Promise<RuleResult> {
  const analyticsFound = detectLibs(ctx, ANALYTICS_LIBS)
  const pixelFound = detectLibs(ctx, PIXEL_LIBS)
  const sessionFound = detectLibs(ctx, SESSION_RECORDING_LIBS)
  const errorFound = detectLibs(ctx, ERROR_MONITORING_LIBS)

  const findings: Finding[] = []

  if (analyticsFound.length > 0) {
    findings.push({
      severity: 'info',
      message: `Analytics-Libraries erkannt: ${analyticsFound.join(', ')} — Cookie-Consent konfiguriert?`,
      suggestion: 'Stellt sicher, dass Analytics erst nach Cookie-Einwilligung startet (DSGVO Art. 7).',
      isKiller: false,
    } as Finding)
  }

  if (pixelFound.length > 0) {
    findings.push({
      severity: 'info',
      message: `Pixel/Tag-Manager erkannt: ${pixelFound.join(', ')} — Cookie-Consent konfiguriert?`,
      suggestion: 'Werbe-Tracking braucht explizite Einwilligung vor dem ersten Request.',
      isKiller: false,
    } as Finding)
  }

  if (sessionFound.length > 0) {
    findings.push({
      severity: 'info',
      message: `Session-Recording erkannt: ${sessionFound.join(', ')} — informiert ihr Nutzer?`,
      suggestion: 'Session-Recording-Tools müssen in der Datenschutzerklärung erwähnt werden.',
      isKiller: false,
    } as Finding)
  }

  if (errorFound.length > 0) {
    findings.push({
      severity: 'info',
      message: `Error-Monitoring erkannt: ${errorFound.join(', ')} — AVV abgeschlossen?`,
      suggestion: 'Sentry und ähnliche Tools verarbeiten ggf. User-Daten. AVV prüfen (DSGVO Art. 28).',
      isKiller: false,
    } as Finding)
  }

  if (findings.length === 0) {
    return pass('marketing-tracking-detection', 'No known tracking libraries detected')
  }

  return info('marketing-tracking-detection',
    `${findings.length} tracking/analytics libraries detected`,
    findings,
  )
}

// ── Plattform-Detektor (App Store) ────────────────────────────────────────────

function hasFile(rootPath: string, ...parts: string[]): boolean {
  return fs.existsSync(join(rootPath, ...parts))
}

export async function checkPlatformAppStore(ctx: AuditContext): Promise<RuleResult> {
  const findings: Finding[] = []

  // Capacitor (Cross-Platform)
  if (hasFile(ctx.rootPath, 'capacitor.config.ts') || hasFile(ctx.rootPath, 'capacitor.config.json')) {
    findings.push({
      severity: 'info',
      message: 'Capacitor erkannt — plant ihr Veröffentlichung in iOS- und/oder Android-Stores?',
      suggestion: 'Stellt sicher, dass App Store Review Guidelines (Apple) und Google Play Policy eingehalten werden.',
      isKiller: false,
    } as Finding)
  }

  // iOS native
  if (hasFile(ctx.rootPath, 'ios', 'Info.plist')) {
    findings.push({
      severity: 'info',
      message: 'iOS-Konfiguration erkannt — App Store Connect vorbereitet?',
      suggestion: 'Datenschutzerklärung im App Store notwendig. Privacy Nutrition Labels für jede Datenkategorie ausfüllen.',
      isKiller: false,
    } as Finding)
  }

  // Android native
  if (hasFile(ctx.rootPath, 'android', 'AndroidManifest.xml')) {
    findings.push({
      severity: 'info',
      message: 'Android-Konfiguration erkannt — Google Play Console vorbereitet?',
      suggestion: 'Datensicherheitsformular in Google Play Console ausfüllen. Nutzer müssen über Datenerhebung informiert werden.',
      isKiller: false,
    } as Finding)
  }

  if (findings.length === 0) {
    return pass('platform-app-store-detection', 'No mobile platform configuration detected')
  }

  return info('platform-app-store-detection',
    `${findings.length} mobile platform configuration(s) detected`,
    findings,
  )
}

// ── Infrastruktur-Detektor (Hosting) ─────────────────────────────────────────

export async function checkInfrastructure(ctx: AuditContext): Promise<RuleResult> {
  const findings: Finding[] = []

  // Vercel
  if (hasFile(ctx.rootPath, 'vercel.json') || hasFile(ctx.rootPath, '.vercel')) {
    findings.push({
      severity: 'info',
      message: 'Vercel-Konfiguration erkannt — wo laufen eure Functions und wo werden Daten gespeichert?',
      suggestion: 'Vercel-Functions können in USA oder EU laufen. Für DSGVO: Region in Vercel-Settings auf Frankfurt (fra1) setzen.',
      isKiller: false,
    } as Finding)
  }

  // Netlify
  if (hasFile(ctx.rootPath, 'netlify.toml')) {
    findings.push({
      severity: 'info',
      message: 'Netlify-Konfiguration erkannt — habt ihr geprüft wo Netlify-Functions laufen?',
      suggestion: 'Netlify-Functions laufen standardmäßig in USA. Für DSGVO: Region in netlify.toml prüfen.',
      isKiller: false,
    } as Finding)
  }

  // Docker / Self-Hosting
  if (hasFile(ctx.rootPath, 'Dockerfile') || hasFile(ctx.rootPath, 'docker-compose.yml') || hasFile(ctx.rootPath, 'docker-compose.yaml')) {
    findings.push({
      severity: 'info',
      message: 'Docker-Konfiguration erkannt — lauft ihr self-hosted oder in der Cloud?',
      suggestion: 'Bei Self-Hosting: stellt sicher, dass Server in der EU stehen falls ihr EU-Nutzer habt.',
      isKiller: false,
    } as Finding)
  }

  // Fly.io
  if (hasFile(ctx.rootPath, 'fly.toml')) {
    findings.push({
      severity: 'info',
      message: 'Fly.io-Konfiguration erkannt — in welcher Region lauft ihr?',
      suggestion: 'In fly.toml die primary_region auf eine EU-Region setzen (z.B. fra für Frankfurt).',
      isKiller: false,
    } as Finding)
  }

  if (findings.length === 0) {
    return pass('infrastructure-hosting-detection', 'No infrastructure configuration detected')
  }

  return info('infrastructure-hosting-detection',
    `${findings.length} infrastructure configuration(s) detected`,
    findings,
  )
}
