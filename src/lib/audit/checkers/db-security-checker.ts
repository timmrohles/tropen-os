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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodePath = require('path') as typeof import('path')
    return fs.readFileSync(nodePath.join(ctx.rootPath ?? process.cwd(), path), 'utf-8')
  } catch { return null }
}

function getAllMigrationContent(ctx: AuditContext): string {
  const migrationsDir = 'supabase/migrations'
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodePath = require('path') as typeof import('path')
    const dir = nodePath.join(ctx.rootPath ?? process.cwd(), migrationsDir)
    if (!fs.existsSync(dir)) return ''
    return (fs.readdirSync(dir) as string[])
      .filter(f => f.endsWith('.sql'))
      .map(f => fs.readFileSync(nodePath.join(dir, f), 'utf-8'))
      .join('\n')
  } catch { return '' }
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

// sec-db-03: Anon key no wildcard write access
export async function checkAnonKeyNoWriteWildcard(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-03', 3, 'Keine Migrationen — manuell prüfen')

  // Look for policies granting anon INSERT/UPDATE/DELETE with USING (true)
  const dangerPattern = /CREATE\s+POLICY[^;]*FOR\s+(?:INSERT|UPDATE|DELETE)[^;]*TO\s+anon[^;]*(?:USING|WITH\s+CHECK)\s*\(\s*true\s*\)/gi
  const violations: Finding[] = []
  let m: RegExpExecArray | null
  while ((m = dangerPattern.exec(migrations)) !== null) {
    violations.push({
      severity: 'high',
      message: 'Anon-User hat unkontrollierten Schreibzugriff — unauthentifizierte Requests können Daten ändern',
      filePath: 'supabase/migrations/',
      suggestion: "Cursor-Prompt: 'Ersetze USING (true) in der anon-Schreib-Policy durch eine sinnvolle Bedingung oder entferne die Policy und nutze nur auth.uid()-basierte Policies'",
    })
  }
  if (violations.length === 0) return pass('sec-db-03', 5, 'Keine wilden Anon-Schreib-Policies')
  return fail('sec-db-03', 2, `${violations.length} unsichere Anon-Schreib-Policy(s)`, violations)
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
