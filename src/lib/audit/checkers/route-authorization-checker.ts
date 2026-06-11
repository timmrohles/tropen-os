// src/lib/audit/checkers/route-authorization-checker.ts
// ADR-032 — Erzwungene Route-Autorisierung.
//
// Prüft, ob API-Routen, die per Service-Role-Client (supabaseAdmin, RLS-umgehend)
// auf Daten zugreifen, einen der erzwungenen Auth-Wrapper nutzen.
//
// WICHTIG (Checker-Design-Patterns P1/P18): Auth wird per DATENFLUSS erkannt
// (Datei-Inhalt auf Wrapper-/Primitiv-Aufrufe geprüft), NIE per Signatur oder
// Pfadname. Der frühere zeilenbasierte `missing-auth-in-route`-Scanner wurde
// genau deshalb entfernt. Die Allowlist (Service-/öffentliche Routen) ist
// deterministisch, nicht heuristisch.

import * as fs from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

const RULE = 'cat-3-rule-27'

// Deterministische Allowlist (aus docs/audit/route-authorization-inventory.md):
// Service-Routen (CRON_SECRET / Webhook-Secret) + bewusst öffentliche Routen.
const ALLOWLIST_PREFIXES = [
  'src/app/api/cron/',
  'src/app/api/feeds/inbound/',
  'src/app/api/agents/webhook/',
  'src/app/api/public/',
]
const ALLOWLIST_EXACT = new Set([
  'src/app/api/health/route.ts',
  'src/app/api/beta/waitlist/route.ts',
  'src/app/api/s/[token]/route.ts',
  'src/app/api/shared/[token]/route.ts',
  // Bewusste Ausnahmen (ADR-032 Tranche 5):
  'src/app/api/debug/feeds/route.ts',        // eigener assertSuperadmin + prod-404-Guard
  'src/app/api/onboarding/complete/route.ts', // Bootstrap: User ohne organization_id, withAuth würde 401
])

// Erzwungene Wrapper (das Ziel) — ADR-032.
// `(?:<[^>]*>)?` erlaubt explizite Type-Argumente: withProjectAccess<{ id: string }>(…)
const WRAPPER_RE = /\bwith(?:Auth|OrgAdmin|ProjectAccess|WorkspaceAccess|Superadmin|CronAuth)\s*(?:<[^>]*>)?\s*\(/
// Auth-Signal während der Migration (Auth vorhanden, aber nicht wrapper-erzwungen).
// BEWUSST BREIT (P10): erfasst auch route-lokale Inline-Helfer (getAdminUser, isSuperadmin,
// guardSuperadmin, …), die intern alle `supabase.auth.getUser()` aufrufen — daher fängt
// `getUser(` praktisch jede authentifizierte Route. Falsch-"primitiv" ist harmlos
// (zählt als noch-nicht-migriert); gefährlich wäre nur ein falsches "kein Auth".
const PRIMITIVE_RE = /\bgetUser\s*\(|\bgetAuthUser\b|\bgetAdminUser\b|\brequire(?:OrgAdmin|Superadmin|Auth)\b|\b(?:assert|guard|is)Superadmin\b|\bverify\w*Access\b|\bcan(?:Read|Write)Workspace\b|\bCRON_SECRET\b|\bwebhook_secret\b/
// Service-Role-Datenzugriff (umgeht RLS) — nur solche Routen sind in Scope.
const DATA_ACCESS_RE = /\bsupabaseAdmin\b/

function pass(score: number, reason: string): RuleResult {
  return { ruleId: RULE, score, reason, findings: [], automated: true }
}

// P6: Disk-Fallback, damit nicht still mit score 5 bestanden wird.
function readContent(ctx: AuditContext, path: string): string | null {
  const c = ctx.fileContents?.get(path)
  if (c !== undefined) return c
  if (ctx.rootPath) {
    try { return fs.readFileSync(join(ctx.rootPath, path), 'utf-8') } catch { return null }
  }
  return null
}

function isAllowlisted(path: string): boolean {
  return ALLOWLIST_EXACT.has(path) || ALLOWLIST_PREFIXES.some((p) => path.startsWith(p))
}

export async function checkRouteAuthorizationWrappers(ctx: AuditContext): Promise<RuleResult> {
  const routes = ctx.repoMap.files.filter(
    (f) => f.path.startsWith('src/app/api/') && f.path.endsWith('route.ts'),
  )

  const wrapped: string[] = []
  const primitiveOnly: string[] = []
  const noAuth: string[] = []

  for (const r of routes) {
    if (isAllowlisted(r.path)) continue
    const content = readContent(ctx, r.path)
    if (content === null) continue            // P6: nicht lesbar → überspringen, nicht falsch bestehen
    if (!DATA_ACCESS_RE.test(content)) continue // kein Service-Role-Zugriff → nicht in Scope

    if (WRAPPER_RE.test(content)) wrapped.push(r.path)
    else if (PRIMITIVE_RE.test(content)) primitiveOnly.push(r.path)
    else noAuth.push(r.path)
  }

  const relevant = wrapped.length + primitiveOnly.length + noAuth.length
  if (relevant === 0) {
    return pass(5, 'Keine supabaseAdmin-Routen ausserhalb der Allowlist — nichts zu erzwingen')
  }

  const findings: Finding[] = [
    // Echte Sorge: Service-Role-Datenzugriff ganz ohne erkennbaren Auth-Mechanismus.
    ...noAuth.map((path): Finding => ({
      severity: 'high',
      message: `supabaseAdmin-Route ohne erkennbaren Auth-Mechanismus: ${path}`,
      filePath: path,
      suggestion: 'withAuth/withOrgAdmin/withProjectAccess/withWorkspaceAccess/withSuperadmin verwenden — oder, falls bewusst öffentlich, in die Checker-Allowlist aufnehmen.',
      agentSource: 'security',
    })),
    // Gate (ADR-032 Rollout abgeschlossen): nicht-wrapper-erzwungene Route = Verstoss.
    ...primitiveOnly.slice(0, 20).map((path): Finding => ({
      severity: 'medium',
      message: `supabaseAdmin-Route ohne erzwungenen Auth-Wrapper (ADR-032): ${path}`,
      filePath: path,
      suggestion: 'Auf den passenden Wrapper migrieren (withAuth/withProjectAccess/withWorkspaceAccess/withOrgAdmin/withSuperadmin) — oder, bei bewusster Ausnahme, in die Checker-Allowlist aufnehmen.',
      agentSource: 'security',
    })),
  ]

  // Gate-Semantik: volle Wrapper-Abdeckung erforderlich (Rollout abgeschlossen, ADR-032).
  // Ein neuer ungewrappter supabaseAdmin-Route-Export lässt den Score sofort fallen.
  let score: number
  if (noAuth.length > 0) {
    score = noAuth.length > 3 ? 1 : 2          // potenzielle echte Lücken
  } else if (primitiveOnly.length > 0) {
    score = primitiveOnly.length > 5 ? 2 : 3   // un-migrierte Routen = Verstoss gegen das Gate
  } else {
    score = 5                                   // volle Abdeckung
  }

  return {
    ruleId: RULE,
    score,
    automated: true,
    reason: `Wrapper-Abdeckung ${wrapped.length}/${relevant} supabaseAdmin-Routen — ${noAuth.length} ohne Auth, ${primitiveOnly.length} ohne Wrapper (ADR-032)`,
    findings,
  }
}
