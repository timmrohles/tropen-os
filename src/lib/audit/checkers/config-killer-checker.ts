// src/lib/audit/checkers/config-killer-checker.ts
// ADR-027 Schritt 4 — Config-Analyzer: DB-SSL, Dev-Secrets, HTTPS-Erzwingung
// Strategie: docs/audit-reports/killer-detector-strategies-2026-05-04.md
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { AuditContext, Finding, RuleResult } from '../types'

// ─── Shared Helpers ───────────────────────────────────────────────────────────

function readSafe(filePath: string): string {
  try { return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '' } catch { return '' }
}

/** Production-context filter: returns true if this file/varname counts as production config */
function isProductionContext(filename: string, varName: string): boolean {
  const base = path.basename(filename)
  if (base === '.env.local') return false
  if (base === '.env.development') return false
  if (base === '.env.test') return false
  if (/_DEV_|_TEST_|_LOCAL_/i.test(varName)) return false
  if (base === '.env.production') return true
  if (base === '.env') return true
  return false
}

function pass(ruleId: string, reason: string): RuleResult {
  return { ruleId, score: 5, reason, findings: [], automated: true }
}
function fail(ruleId: string, score: number, reason: string, findings: Finding[]): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}

// ─── Detektor 1: DB-SSL ──────────────────────────────────────────────────────

const DB_PROTOCOLS = [
  { pattern: /postgres(?:ql)?:\/\/[^\s'"]+/gi, type: 'postgres' },
  { pattern: /mysql:\/\/[^\s'"]+/gi, type: 'mysql' },
  { pattern: /mongodb(?:\+srv)?:\/\/[^\s'"]+/gi, type: 'mongodb' },
  { pattern: /mssql:\/\/[^\s'"]+/gi, type: 'mssql' },
]

const ENV_FILES = ['.env', '.env.production', '.env.development', '.env.test']
const ENV_VAR_PATTERN = /^([A-Z_][A-Z0-9_]*)=(.+)$/m

function hasSSLForConnectionString(connStr: string, dbType: string): boolean {
  // Localhost / dev hosts — never a killer
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(connStr)) return true
  if (dbType === 'postgres') {
    if (/sslmode=disable/i.test(connStr)) return false
    // sslmode=require/verify-full/verify-ca = safe; no sslmode = unclear → conservative no killer
    return /sslmode=(require|verify)/i.test(connStr)
  }
  if (dbType === 'mongodb') {
    return /mongodb\+srv:\/\//i.test(connStr) || /ssl=true/i.test(connStr)
  }
  if (dbType === 'mysql') {
    return /ssl-mode=REQUIRED|useSSL=true/i.test(connStr)
  }
  return true // unknown DB type — conservative: no killer
}

export async function checkDbSslConfig(ctx: AuditContext): Promise<RuleResult> {
  const findings: Finding[] = []

  for (const envFile of ENV_FILES) {
    const filePath = path.join(ctx.rootPath, envFile)
    const content = readSafe(filePath)
    if (!content) continue

    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/)
      if (!m) continue
      const [, varName, varValue] = m

      if (!isProductionContext(envFile, varName)) continue

      for (const { pattern, type } of DB_PROTOCOLS) {
        pattern.lastIndex = 0
        const match = pattern.exec(varValue)
        if (!match) continue
        const connStr = match[0]
        if (!hasSSLForConnectionString(connStr, type)) {
          findings.push({
            severity: 'critical',
            isKiller: true,
            message: `${varName} in ${envFile}: ${type} connection without SSL (sslmode=require missing)`,
            filePath: envFile,
            suggestion:
              `🛑 Stopper: Datenbank-Verbindung (${type}) in ${envFile} verwendet kein SSL. ` +
              `Ohne SSL werden Datenbank-Anfragen im Klartext übertragen. ` +
              `Connection-String um ?sslmode=require (Postgres) oder ?ssl=true (MongoDB/MySQL) erweitern.`,
            agentSource: 'security',
          })
        }
      }
    }
  }

  if (findings.length === 0) return pass('config-killer-db-ssl', 'DB connections use SSL or are local-only')
  return fail('config-killer-db-ssl', 1, `${findings.length} DB connection(s) without SSL in production config`, findings)
}

// ─── Detektor 2: Dev-Secrets in Production Config ────────────────────────────

const DEV_SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /sk_test_[a-zA-Z0-9]{10,}/i, label: 'Stripe test secret key' },
  { pattern: /sk-ant-test/i, label: 'Anthropic test token' },
  { pattern: /https?:\/\/localhost/i, label: 'localhost URL' },
  { pattern: /https?:\/\/127\.0\.0\.1/i, label: '127.0.0.1 URL' },
  { pattern: /['"](?:test|fake|demo|example|dummy)[_-]?(?:key|secret|token|password)['"]/i, label: 'test credential value' },
  { pattern: /['"](?:placeholder|changeme|insert_here|your[_-]?(?:api[_-]?)?key)['"]/i, label: 'placeholder credential' },
]

// pk_test_ is public (publishable) — allowed even in production
const DEV_ALLOWLIST_PATTERNS = [/pk_test_/i]

export async function checkDevSecretsInProd(ctx: AuditContext): Promise<RuleResult> {
  const findings: Finding[] = []

  for (const envFile of ENV_FILES) {
    const filePath = path.join(ctx.rootPath, envFile)
    const content = readSafe(filePath)
    if (!content) continue

    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/)
      if (!m) continue
      const [, varName, varValue] = m

      if (!isProductionContext(envFile, varName)) continue
      if (DEV_ALLOWLIST_PATTERNS.some(p => p.test(varValue))) continue

      for (const { pattern, label } of DEV_SECRET_PATTERNS) {
        if (pattern.test(varValue)) {
          findings.push({
            severity: 'critical',
            isKiller: true,
            message: `${varName} in ${envFile}: contains ${label}`,
            filePath: envFile,
            suggestion:
              `🛑 Stopper: ${varName} in ${envFile} enthält ${label}. ` +
              `Production-Apps mit Test-Credentials funktionieren nicht korrekt — ` +
              `Zahlungen werden nicht verarbeitet, OAuth-Login schlägt fehl, ` +
              `Daten landen in Test-Systemen. Echte Production-Werte einsetzen.`,
            agentSource: 'security',
          })
          break
        }
      }
    }
  }

  if (findings.length === 0) return pass('config-killer-dev-secret', 'No dev/test credentials found in production config')
  return fail('config-killer-dev-secret', 1, `${findings.length} dev/test credential(s) in production config`, findings)
}

// ─── Detektor 3: HTTPS-Erzwingung ────────────────────────────────────────────

const PLATFORM_IAC_FILES = [
  'vercel.json', 'netlify.toml', 'fly.toml',
  'railway.toml', 'railway.json', 'render.yaml',
]

const HTTPS_INDICATORS = [
  /Strict-Transport-Security/,
  /\.redirect\s*\([^)]*['"]https:/,
  /req\.headers\.get\(['"]x-forwarded-proto['"]\)/,
  /x-forwarded-proto.*https/i,
  /forceSSL\s*\(/,
  /redirectToHTTPS/i,
]

const HTTPS_CHECK_FILES = [
  'middleware.ts', 'middleware.js',
  'next.config.js', 'next.config.mjs', 'next.config.ts',
  'server.js', 'server.ts',
]

export async function checkHttpsEnforcement(ctx: AuditContext): Promise<RuleResult> {
  // Platform-IaC: Vercel/Netlify/Fly etc. enforce HTTPS automatically
  const hasPlatformIaC = PLATFORM_IAC_FILES.some(f =>
    fs.existsSync(path.join(ctx.rootPath, f))
  )
  if (hasPlatformIaC) {
    const found = PLATFORM_IAC_FILES.find(f => fs.existsSync(path.join(ctx.rootPath, f)))
    return pass('config-killer-https', `Platform-IaC found (${found}) — HTTPS enforced by platform`)
  }

  // Custom detection: middleware, next.config, server files
  for (const candidate of HTTPS_CHECK_FILES) {
    const filePath = path.join(ctx.rootPath, candidate)
    const content = readSafe(filePath)
    if (!content) continue
    if (HTTPS_INDICATORS.some(p => p.test(content))) {
      return pass('config-killer-https', `Explicit HTTPS enforcement found in ${candidate}`)
    }
  }

  return fail('config-killer-https', 1, 'No HTTPS enforcement detected — neither Platform-IaC nor explicit redirect', [{
    severity: 'critical',
    isKiller: true,
    message: 'HTTPS wird nicht erzwungen — keine Platform-IaC und kein expliziter Redirect',
    suggestion:
      '🛑 Stopper: Keine HTTPS-Erzwingung erkannt. ' +
      'Login-Daten und Session-Cookies können im Klartext abgefangen werden. ' +
      'Optionen: Platform-IaC nutzen (vercel.json, netlify.toml), ' +
      'oder middleware.ts mit HTTP→HTTPS-Redirect, ' +
      'oder Strict-Transport-Security-Header in next.config.ts.',
    agentSource: 'security',
  }])
}
