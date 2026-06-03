// src/lib/audit/checkers/db-security-checker.ts
// Supabase database security checks (ADR-025, Tab-Sprint Phase 1).
// Detection: migration SQL analysis + source code path analysis.

import type { AuditContext, RuleResult, Finding } from '../types'

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}

function fail(ruleId: string, score: number, reason: string, findings: Finding[]): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}

function readContent(ctx: AuditContext, path: string): string | null {
  if (ctx.fileContents?.has(path)) return ctx.fileContents.get(path)!
  try {
     
    const fs = require('fs') as typeof import('fs')
     
    const nodePath = require('path') as typeof import('path')
    return fs.readFileSync(nodePath.join(ctx.rootPath ?? process.cwd(), path), 'utf-8')
  } catch { return null }
}

function getAllMigrationContent(ctx: AuditContext): string {
  const migrationsDir = 'supabase/migrations'
  const parts: string[] = []
  // In-memory-Migrationen (externe Projekt-Scans laufen ohne Disk-Zugriff)
  if (ctx.fileContents) {
    for (const [p, content] of ctx.fileContents) {
      if (/supabase[\\/]migrations[\\/].+\.sql$/i.test(p)) parts.push(content)
    }
  }
  try {
     
    const fs = require('fs') as typeof import('fs')
     
    const nodePath = require('path') as typeof import('path')
    const dir = nodePath.join(ctx.rootPath ?? process.cwd(), migrationsDir)
    if (fs.existsSync(dir)) {
      for (const f of (fs.readdirSync(dir) as string[])) {
        if (f.endsWith('.sql')) parts.push(fs.readFileSync(nodePath.join(dir, f), 'utf-8'))
      }
    }
  } catch { /* ignore */ }
  return parts.join('\n')
}

function getClientCodePaths(ctx: AuditContext): Array<{ path: string; content: string }> {
  const clientPaths = /src[\\/](components|hooks|context)[\\/]/
  const results: Array<{ path: string; content: string }> = []
  if (ctx.fileContents) {
    for (const [filePath, content] of ctx.fileContents) {
      if (clientPaths.test(filePath) && /\.(ts|tsx)$/.test(filePath)) {
        results.push({ path: filePath, content })
      }
    }
  }
  return results
}

// sec-db-01: RLS on user data tables
export async function checkRlsOnUserTables(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-01', 3, 'Keine Supabase-Migrationen gefunden — manuell prüfen')

  const createTablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)/gi
  const rlsPattern = /ALTER\s+TABLE\s+(?:\w+\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi

  const createdTables = new Set<string>()
  const rlsTables = new Set<string>()
  const systemTables = new Set(['schema_migrations', 'migrations', 'spatial_ref_sys', 'buckets', 'objects', 'migrations_version'])

  let m: RegExpExecArray | null
  while ((m = createTablePattern.exec(migrations)) !== null) {
    const name = m[1].toLowerCase()
    if (!systemTables.has(name)) createdTables.add(name)
  }
  while ((m = rlsPattern.exec(migrations)) !== null) {
    rlsTables.add(m[1].toLowerCase())
  }

  const tablesWithoutRls = [...createdTables].filter(t => !rlsTables.has(t))
  if (tablesWithoutRls.length === 0) return pass('sec-db-01', 5, 'Alle Tabellen haben RLS aktiviert')

  const violations: Finding[] = tablesWithoutRls.slice(0, 5).map(t => ({
    severity: 'critical' as const,
    message: `Tabelle "${t}" hat keine RLS aktiviert — alle User können alle Daten sehen`,
    filePath: 'supabase/migrations/',
    suggestion: `Cursor-Prompt: 'Erstelle eine neue Migration die ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY ausführt und SELECT/INSERT Policies mit auth.uid() = user_id hinzufügt'`,
  }))

  const score = tablesWithoutRls.length >= 5 ? 1 : tablesWithoutRls.length >= 3 ? 2 : 3
  return fail('sec-db-01', score, `${tablesWithoutRls.length} Tabelle(n) ohne RLS — DSGVO Art. 32`, violations)
}

// sec-db-02: No service role key in frontend code
export async function checkNoServiceRoleInFrontend(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  for (const { path: filePath, content } of getClientCodePaths(ctx)) {
    if (/supabaseAdmin|SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(content)) {
      violations.push({
        severity: 'critical',
        message: `Service-Role-Key im Client-Pfad "${filePath}" — jeder User kann die gesamte DB lesen`,
        filePath,
        suggestion: `Cursor-Prompt: 'Verschiebe den supabaseAdmin-Aufruf in ${filePath.split('/').pop()} in eine API-Route oder Server-Action unter /api/ oder /actions/'`,
      })
    }
  }
  if (violations.length === 0) return pass('sec-db-02', 5, 'Service-Role-Key nur server-seitig verwendet')
  return fail('sec-db-02', 1, `${violations.length} Client-Datei(en) mit Service-Role-Key`, violations)
}

// sec-db-03: Keine Wildcard-Schreib-Policies (USING/WITH CHECK true) für nicht-service_role
export async function checkAnonKeyNoWriteWildcard(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-03', 3, 'Keine Migrationen — manuell prüfen')

  // Schreib-Policies (ALL/INSERT/UPDATE/DELETE) mit USING/WITH CHECK (true) — für JEDE Rolle,
  // außer service_role (dort ist USING(true) gewollt, da serverseitig). SELECT(true) ist ok (Public-Read).
  const dangerPattern = /CREATE\s+POLICY[^;]*?\bFOR\s+(?:ALL|INSERT|UPDATE|DELETE)\b[^;]*?(?:USING|WITH\s+CHECK)\s*\(\s*true\s*\)/gi
  const violations: Finding[] = []
  let _m: RegExpExecArray | null
  while ((_m = dangerPattern.exec(migrations)) !== null) {
    const stmt = _m[0]
    if (/\bservice_role\b/i.test(stmt)) continue // service_role-Wildcard ist gewollt
    const role = /\bTO\s+(\w+)/i.exec(stmt)?.[1] ?? 'public/authenticated'
    violations.push({
      severity: 'high',
      message: `Over-permissive RLS-Policy (USING/WITH CHECK (true)) für Schreibzugriff der Rolle "${role}" — jeder dieser User kann beliebige Zeilen ändern`,
      filePath: 'supabase/migrations/',
      suggestion: "Cursor-Prompt: 'Ersetze USING (true) / WITH CHECK (true) in der Schreib-Policy durch eine sinnvolle Bedingung (z.B. organization_id = get_my_organization_id() oder auth.uid() = user_id), oder entferne die Policy und nutze die Service-Role serverseitig'",
    })
  }
  if (violations.length === 0) return pass('sec-db-03', 5, 'Keine Wildcard-Schreib-Policies (USING/WITH CHECK true)')
  return fail('sec-db-03', 2, `${violations.length} over-permissive Schreib-Policy(s) — RLS effektiv umgangen`, violations)
}

// sec-db-07: Storage buckets have policies
export async function checkStorageBucketPolicies(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-07', 3, 'Keine Migrationen — manuell prüfen')

  const bucketsCreated = (migrations.match(/INSERT\s+INTO\s+storage\.buckets/gi) ?? []).length
  const bucketPolicies = (migrations.match(/CREATE\s+POLICY[^;]*storage\.objects/gi) ?? []).length

  if (bucketsCreated === 0) return pass('sec-db-07', 5, 'Keine Storage-Buckets in Migrationen')
  if (bucketPolicies === 0) {
    return fail('sec-db-07', 2, 'Storage-Buckets ohne Zugriffs-Policies', [{
      severity: 'high',
      message: `${bucketsCreated} Storage-Bucket(s) gefunden, aber keine Policies — Dateien sind öffentlich lesbar`,
      filePath: 'supabase/migrations/',
      suggestion: "Cursor-Prompt: 'Erstelle RLS-Policies für storage.objects: SELECT-Policy für eigene Dateien (auth.uid() = owner), INSERT-Policy mit auth.uid()-Bedingung'",
    }])
  }
  return pass('sec-db-07', 5, `Storage-Buckets mit ${bucketPolicies} Policy(s) konfiguriert`)
}

// sec-db-08: Edge functions not using service role in user context
export async function checkEdgeFunctionsNoServiceRoleInUserContext(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  try {
     
    const fs = require('fs') as typeof import('fs')
     
    const nodePath = require('path') as typeof import('path')
    const dir = nodePath.join(ctx.rootPath ?? process.cwd(), 'supabase/functions')
    if (!fs.existsSync(dir)) return pass('sec-db-08', 5, 'Keine Edge Functions gefunden')

    const readDir = (d: string): string[] => {
      const entries = fs.readdirSync(d, { withFileTypes: true }) as import('fs').Dirent[]
      return entries.flatMap(e =>
        e.isDirectory() ? readDir(nodePath.join(d, e.name)) : [nodePath.join(d, e.name)]
      )
    }

    const tsFiles = readDir(dir).filter((f: string) => f.endsWith('.ts'))
    for (const filePath of tsFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (/SERVICE_ROLE.*req\.|supabaseAdmin.*req\.|createClient.*SERVICE_ROLE.*req/i.test(content)) {
        violations.push({
          severity: 'critical',
          message: `Edge Function "${nodePath.basename(filePath)}" nutzt Service-Role im User-Request-Context`,
          filePath: filePath.replace(ctx.rootPath ?? '', '').replace(/^[\\/]/, ''),
          suggestion: `Cursor-Prompt: 'Erstelle einen user-scoped Supabase-Client mit dem JWT aus dem Authorization-Header statt Service-Role'`,
        })
      }
    }
  } catch { return pass('sec-db-08', 3, 'Edge Functions nicht lesbar — manuell prüfen') }

  if (violations.length === 0) return pass('sec-db-08', 5, 'Edge Functions verwenden Service-Role nicht im User-Context')
  return fail('sec-db-08', 1, `${violations.length} Edge Function(s) mit Service-Role im User-Context`, violations)
}

// sec-db-10: Backup strategy documented
export async function checkDbBackupStrategyDocumented(ctx: AuditContext): Promise<RuleResult> {
  const readme = readContent(ctx, 'README.md') ?? ''
  const hasBackup = /PITR|point.in.time|backup|Backup/i.test(readme)
  if (hasBackup) return pass('sec-db-10', 5, 'Backup-Strategie in README dokumentiert')
  return fail('sec-db-10', 3, 'Backup-Strategie nicht dokumentiert — DSGVO Art. 32', [{
    severity: 'medium',
    message: 'PITR-Status und Backup-Strategie fehlen in der Dokumentation',
    filePath: 'README.md',
    suggestion: "Cursor-Prompt: 'Füge eine Backup-Sektion in README.md ein: Supabase Plan (Free/Pro), PITR (enabled/disabled), letzter Restore-Test'",
  }])
}

// sec-db-11: Views ohne SECURITY DEFINER (security_invoker gesetzt)
// Eine View ohne security_invoker läuft mit den Rechten/RLS des Erstellers (postgres) statt des
// abfragenden Users → RLS-Bypass. Entspricht Supabase-Linter 'security_definer_view' (ERROR).
export async function checkSecurityDefinerViews(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-11', 3, 'Keine Migrationen — manuell prüfen')

  const createViewPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)/gi
  const invokerPattern = /(?:CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW|ALTER\s+VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)[^;]*security_invoker\s*=\s*(?:on|true)/gi

  const views = new Set<string>()
  const invokerViews = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = createViewPattern.exec(migrations)) !== null) views.add(m[1].toLowerCase())
  while ((m = invokerPattern.exec(migrations)) !== null) invokerViews.add(m[1].toLowerCase())

  const unsafe = [...views].filter(v => !invokerViews.has(v))
  if (unsafe.length === 0) return pass('sec-db-11', 5, 'Alle Views nutzen security_invoker (keine SECURITY DEFINER-Views)')

  const violations: Finding[] = unsafe.slice(0, 5).map(v => ({
    severity: 'critical' as const,
    message: `View "${v}" läuft als SECURITY DEFINER (kein security_invoker=on) — Abfragen umgehen die RLS des aufrufenden Users`,
    filePath: 'supabase/migrations/',
    suggestion: `Cursor-Prompt: 'Erstelle eine Migration: ALTER VIEW ${v} SET (security_invoker = on); — damit greift die RLS des abfragenden Users statt der des Erstellers'`,
  }))
  const score = unsafe.length >= 3 ? 1 : 2
  return fail('sec-db-11', score, `${unsafe.length} View(s) als SECURITY DEFINER — RLS-Bypass-Risiko`, violations)
}

// sec-db-12: DB-Funktionen mit festem search_path
// Funktionen ohne 'SET search_path' sind anfällig für search_path-Hijacking.
// Entspricht Supabase-Linter 'function_search_path_mutable' (WARN).
export async function checkFunctionSearchPath(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-12', 3, 'Keine Migrationen — manuell prüfen')

  const createFnPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:\w+\.)?(\w+)\s*\(/gi
  const fns = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = createFnPattern.exec(migrations)) !== null) fns.add(m[1].toLowerCase())

  // Eine Funktion gilt als geschützt, wenn 'SET search_path' innerhalb der Optionen (CREATE) oder
  // via 'ALTER FUNCTION ... SET search_path' gesetzt ist (Options stehen vor dem AS-Body).
  const protectedFns = new Set<string>()
  for (const name of fns) {
    const re = new RegExp(
      '(?:CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION|ALTER\\s+FUNCTION)\\s+(?:\\w+\\.)?' + name + '\\b[\\s\\S]{0,400}?SET\\s+search_path',
      'i'
    )
    if (re.test(migrations)) protectedFns.add(name)
  }

  const unsafe = [...fns].filter(f => !protectedFns.has(f))
  if (unsafe.length === 0) return pass('sec-db-12', 5, 'Alle Funktionen haben einen festen search_path')

  const violations: Finding[] = unsafe.slice(0, 8).map(f => ({
    severity: 'medium' as const,
    message: `Funktion "${f}()" hat keinen festen search_path — anfällig für search_path-Hijacking`,
    filePath: 'supabase/migrations/',
    suggestion: `Cursor-Prompt: 'Erstelle eine Migration: ALTER FUNCTION ${f}(<signatur>) SET search_path = public; — gegen search_path-Hijacking'`,
  }))
  const score = unsafe.length >= 6 ? 2 : 3
  return fail('sec-db-12', score, `${unsafe.length} Funktion(en) ohne festen search_path`, violations)
}
