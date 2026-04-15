// src/lib/audit/schema-drift-check.ts
// Schema Drift Check: transparent notice when a project uses a database but
// Tropen OS can't verify live DB state (code-only scan limitation).
// Always returns score: 5 (no penalty) + an info finding when DB is detected.

import type { AuditContext, RuleResult } from './types'

// ─── Provider detection ──────────────────────────────────────────────────────

export type DbProvider =
  | 'supabase'
  | 'neon'
  | 'prisma'       // ORM (Postgres/SQLite/etc.)
  | 'drizzle'      // ORM
  | 'firebase'
  | 'planetscale'
  | 'mongodb'
  | 'postgres'     // generic pg/postgres
  | 'none'

function hasDep(ctx: AuditContext, ...names: string[]): boolean {
  const deps = {
    ...ctx.packageJson.dependencies,
    ...ctx.packageJson.devDependencies,
  }
  return names.some((n) => !!deps[n])
}

function hasPath(ctx: AuditContext, fragment: string): boolean {
  return ctx.filePaths.some((p) => p.includes(fragment))
}

export function detectDbProvider(ctx: AuditContext): DbProvider {
  if (hasDep(ctx, '@supabase/supabase-js', '@supabase/ssr')) return 'supabase'
  if (hasDep(ctx, '@neondatabase/serverless')) return 'neon'
  if (hasDep(ctx, 'firebase', 'firebase-admin')) return 'firebase'
  if (hasDep(ctx, '@planetscale/database')) return 'planetscale'
  if (hasDep(ctx, 'mongoose', 'mongodb')) return 'mongodb'
  if (hasDep(ctx, '@prisma/client', 'prisma')) return 'prisma'
  if (hasDep(ctx, 'drizzle-orm')) return 'drizzle'
  if (hasDep(ctx, 'pg', 'postgres', 'node-postgres')) return 'postgres'

  // Fallback: migration folder presence
  if (hasPath(ctx, 'supabase/migrations')) return 'supabase'
  if (hasPath(ctx, 'prisma/migrations')) return 'prisma'
  if (hasPath(ctx, 'drizzle')) return 'drizzle'

  return 'none'
}

export function isPostgresProvider(provider: DbProvider): boolean {
  return ['supabase', 'neon', 'prisma', 'drizzle', 'postgres'].includes(provider)
}

// ─── SQL queries ─────────────────────────────────────────────────────────────

const POSTGRES_SQL = `-- 1. Alle Tabellen mit RLS-Status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Alle aktiven Policies
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Tabellen OHNE RLS (kritisch!)
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- 4. Tabellen ohne jegliche Policy
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' AND p.policyname IS NULL;`

function buildSuggestion(provider: DbProvider): string {
  if (isPostgresProvider(provider)) {
    const providerName = provider === 'supabase'
      ? 'Supabase SQL Editor'
      : provider === 'neon'
        ? 'Neon Console → SQL Editor'
        : 'Dein Postgres-Client'

    return (
      `Führe diese Queries in ${providerName} aus und vergleiche das Ergebnis mit deinen Migrations:\n\n` +
      `\`\`\`sql\n${POSTGRES_SQL}\n\`\`\`\n\n` +
      `Checkliste:\n` +
      `[ ] Jede Tabelle hat RLS aktiviert (rowsecurity = true)\n` +
      `[ ] Jede Tabelle hat mindestens eine Policy\n` +
      `[ ] Keine Tabelle existiert die nicht in deinen Migrations vorkommt\n` +
      `[ ] Policies matchen die Logik in deinen Migrations-Dateien`
    )
  }

  if (provider === 'firebase') {
    return (
      `Firebase/Firestore nutzt keine SQL-Queries für Security-Regeln. Prüfe manuell:\n\n` +
      `1. Öffne Firebase Console → Firestore → Rules\n` +
      `2. Vergleiche mit den Regeln in deinem Code (firestore.rules)\n` +
      `3. Prüfe ob Staging- und Produktions-Rules identisch sind\n\n` +
      `Checkliste:\n` +
      `[ ] Keine Regel erlaubt globalem Zugriff (allow read, write: if true)\n` +
      `[ ] Auth-Checks in allen Collections\n` +
      `[ ] Produktions-Rules = Code-Rules`
    )
  }

  if (provider === 'planetscale') {
    return (
      `PlanetScale nutzt MySQL. Prüfe im PlanetScale Dashboard:\n\n` +
      `1. Öffne PlanetScale Console → Branches → main → Query\n` +
      `2. Führe aus: SHOW TABLES;\n` +
      `3. Vergleiche mit deinen Migrations\n\n` +
      `Checkliste:\n` +
      `[ ] Keine unbekannte Tabelle vorhanden\n` +
      `[ ] Alle erwarteten Tabellen existieren\n` +
      `[ ] Foreign Key Constraints aktiv (PlanetScale disabled FK by default!)`
    )
  }

  if (provider === 'mongodb') {
    return (
      `MongoDB/Mongoose nutzt Schema-Validation statt SQL. Prüfe in MongoDB Atlas:\n\n` +
      `1. Öffne MongoDB Atlas → Collections\n` +
      `2. Vergleiche Collections mit deinen Mongoose-Schemas\n` +
      `3. Prüfe Schema Validation Rules\n\n` +
      `Checkliste:\n` +
      `[ ] Keine unbekannte Collection vorhanden\n` +
      `[ ] Schema Validation aktiv für kritische Collections\n` +
      `[ ] Indexes vorhanden (Atlas → Indexes)`
    )
  }

  return (
    `Vergleiche deine Live-Datenbank manuell mit deinen Migrations/Schema-Definitionen.\n\n` +
    `Checkliste:\n` +
    `[ ] Alle Tabellen/Collections entsprechen dem Schema-Code\n` +
    `[ ] Keine manuell hinzugefügten/gelöschten Felder\n` +
    `[ ] Sicherheitsregeln (Policies/Rules) stimmen mit Code überein`
  )
}

// ─── Main checker ────────────────────────────────────────────────────────────

export async function checkSchemaDrift(ctx: AuditContext): Promise<RuleResult> {
  const provider = detectDbProvider(ctx)

  if (provider === 'none') {
    return {
      ruleId: 'cat-5-schema-drift',
      score: 5,
      reason: 'Kein Datenbank-Provider erkannt — Schema Drift Check nicht anwendbar.',
      findings: [],
      automated: true,
    }
  }

  const providerLabel: Record<DbProvider, string> = {
    supabase:    'Supabase',
    neon:        'Neon',
    prisma:      'Prisma',
    drizzle:     'Drizzle',
    firebase:    'Firebase/Firestore',
    planetscale: 'PlanetScale',
    mongodb:     'MongoDB',
    postgres:    'Postgres',
    none:        '',
  }

  return {
    ruleId: 'cat-5-schema-drift',
    score: 5,
    reason: `${providerLabel[provider]} erkannt — Schema Drift Check empfohlen (Code-Only-Scan kann Live-DB-Zustand nicht prüfen).`,
    findings: [
      {
        severity: 'info',
        message: `Schema Drift Check empfohlen (${providerLabel[provider]})`,
        suggestion: buildSuggestion(provider),
        agentSource: 'database',
        agentRuleId: 'schema-drift',
        fixHint: `Führe den Schema Drift Check in deinem ${providerLabel[provider]}-Dashboard aus`,
      },
    ],
    automated: true,
  }
}
