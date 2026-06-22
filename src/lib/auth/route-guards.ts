// src/lib/auth/route-guards.ts
// Erzwungene Autorisierung für API-Route-Handler (ADR-032).
//
// Diese Wrapper ersetzen das verstreute Per-Route-Boilerplate
// (getAuthUser → 401, verifyProjectAccess → 404) durch ein erzwungenes Pattern.
// Sie geben JSON-Responses zurück — im Gegensatz zu den Server-Component-Guards
// in `guards.ts`, die redirecten (falsch für API-Routen).
//
// Die Wrapper komponieren die vorhandenen Primitive `getAuthUser` /
// `verifyProjectAccess` aus `@/lib/api/projects` — kein Doppel-Fetch.
//
// Service-Routen (Cron/Webhooks) nutzen `withCronAuth`; das gibt dem
// Audit-Checker (cat-3) ein deterministisches Allowlist-Signal.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'
import { canReadWorkspace, canWriteWorkspace } from '@/lib/api/workspaces'
import { getPreflightProjectForUser } from '@/lib/api/preflight'

export type AuthUser = { id: string; organization_id: string; role: string }

/** Next.js-15-Kontext: params ist ein Promise. */
type NextContext<P> = { params: Promise<P> }

/** Angereicherter Kontext, den die Handler erhalten — params bereits aufgelöst. */
export type AuthedContext<P> = { params: P; auth: AuthUser }
export type ProjectContext<P> = AuthedContext<P> & { projectId: string }
export type WorkspaceContext<P> = AuthedContext<P> & { workspaceId: string }
/** Verifiziertes Preflight-Projekt (org/owner-gescoped via getPreflightProjectForUser). */
export type PreflightProject = NonNullable<Awaited<ReturnType<typeof getPreflightProjectForUser>>>
export type PreflightProjectContext<P> = AuthedContext<P> & { preflightProject: PreflightProject }

type Params = Record<string, string>
type RouteResult = Promise<Response> | Response

// ── Standard-Fehler-Responses (deutsch, konsistent mit Bestand) ──────────────
const unauthorized = () =>
  NextResponse.json({ error: 'Nicht autorisiert', code: 'UNAUTHORIZED' }, { status: 401 })
const forbidden = () =>
  NextResponse.json({ error: 'Kein Zugriff', code: 'FORBIDDEN' }, { status: 403 })
const notFound = () =>
  NextResponse.json({ error: 'Nicht gefunden', code: 'NOT_FOUND' }, { status: 404 })

async function resolveParams<P extends Params>(ctx: NextContext<P> | undefined): Promise<P> {
  if (ctx?.params) return ctx.params
  return {} as P
}

/**
 * Stellt sicher, dass ein authentifizierter User vorhanden ist.
 * 401 wenn nicht eingeloggt. Injiziert `auth` + aufgelöste `params`.
 */
export function withAuth<P extends Params = Params>(
  handler: (req: NextRequest, ctx: AuthedContext<P>) => RouteResult,
) {
  // ctx ist required (Next.js übergibt ihn immer) — ein optionaler Parameter
  // würde `| undefined` in den Typ ziehen und Next's ParamCheck brechen.
  // Der Laufzeit-Zugriff bleibt dennoch defensiv (resolveParams).
  return async (req: NextRequest, ctx: NextContext<P>): Promise<Response> => {
    const auth = await getAuthUser()
    if (!auth) return unauthorized()
    const params = await resolveParams(ctx)
    return handler(req, { params, auth })
  }
}

/**
 * Kanonisches Org-Admin-Rollen-Set (ADR-032).
 * Schließt 'owner' ein — konsistent mit DB-Constraint (users_role_check),
 * RLS-Policies und allen /api/admin/*-Routen.
 */
export const ORG_ADMIN_ROLES = ['owner', 'admin', 'superadmin']

/**
 * Wie withAuth, zusätzlich Rollen-Prüfung.
 * 401 wenn nicht eingeloggt, 403 bei falscher Rolle.
 * `opts.roles` überschreibt das Default-Set für Sonderfälle.
 */
export function withOrgAdmin<P extends Params = Params>(
  handler: (req: NextRequest, ctx: AuthedContext<P>) => RouteResult,
  opts?: { roles?: string[] },
) {
  const roles = opts?.roles ?? ORG_ADMIN_ROLES
  return withAuth<P>((req, ctx) => {
    if (!roles.includes(ctx.auth.role)) return forbidden()
    return handler(req, ctx)
  })
}

/**
 * Wie withAuth, zusätzlich Ownership-Prüfung auf ein Projekt.
 * Die Projekt-ID wird aus den Route-Params gelesen (default-Key: 'id').
 * 401 wenn nicht eingeloggt, 404 wenn Projekt fehlt oder kein Zugriff
 * (übernimmt die "Existenz nicht leaken"-Semantik von verifyProjectAccess).
 * Injiziert zusätzlich `projectId`.
 */
export function withProjectAccess<P extends Params = Params>(
  handler: (req: NextRequest, ctx: ProjectContext<P>) => RouteResult,
  opts?: { paramKey?: string },
) {
  const key = opts?.paramKey ?? 'id'
  return withAuth<P>(async (req, ctx) => {
    const projectId = ctx.params[key]
    if (!projectId) return notFound()
    const allowed = await verifyProjectAccess(projectId, ctx.auth)
    if (!allowed) return notFound()
    return handler(req, { ...ctx, projectId })
  })
}

/**
 * Wie withAuth, zusätzlich Ownership-Prüfung auf ein Preflight-Projekt.
 * Die ID wird aus den Route-Params gelesen (default-Key: 'id').
 * 401 wenn nicht eingeloggt, 404 wenn Projekt fehlt oder kein Zugriff
 * (getPreflightProjectForUser ist org/owner-gescoped, superadmin sieht alles).
 * Injiziert das geladene `preflightProject` — kein Doppel-Fetch im Handler.
 */
export function withPreflightProjectAccess<P extends Params = Params>(
  handler: (req: NextRequest, ctx: PreflightProjectContext<P>) => RouteResult,
  opts?: { paramKey?: string },
) {
  const key = opts?.paramKey ?? 'id'
  return withAuth<P>(async (req, ctx) => {
    const id = ctx.params[key]
    if (!id) return notFound()
    const preflightProject = await getPreflightProjectForUser(id, ctx.auth)
    if (!preflightProject) return notFound()
    return handler(req, { ...ctx, preflightProject })
  })
}

/**
 * Wie withAuth, zusätzlich Plattform-Rolle === 'superadmin'.
 * 401 wenn nicht eingeloggt, 403 wenn kein Superadmin.
 * Für cross-org Routen (superadmin/*, admin/qa/*) — keine Org-/Ownership-Injektion.
 */
export function withSuperadmin<P extends Params = Params>(
  handler: (req: NextRequest, ctx: AuthedContext<P>) => RouteResult,
) {
  return withAuth<P>((req, ctx) => {
    if (ctx.auth.role !== 'superadmin') return forbidden()
    return handler(req, ctx)
  })
}

/**
 * Wie withAuth, zusätzlich Ownership-Prüfung auf einen Workspace.
 * Die Workspace-ID wird aus den Route-Params gelesen (default-Key: 'id').
 * `opts.write` = true verlangt Schreibzugriff (canWriteWorkspace), sonst Lesezugriff (canReadWorkspace).
 * 401 wenn nicht eingeloggt, 404 wenn Workspace fehlt oder kein Zugriff
 * (übernimmt die "Existenz nicht leaken"-Semantik). Injiziert zusätzlich `workspaceId`.
 */
export function withWorkspaceAccess<P extends Params = Params>(
  handler: (req: NextRequest, ctx: WorkspaceContext<P>) => RouteResult,
  opts?: { paramKey?: string; write?: boolean },
) {
  const key = opts?.paramKey ?? 'id'
  return withAuth<P>(async (req, ctx) => {
    const workspaceId = ctx.params[key]
    if (!workspaceId) return notFound()
    // getAuthUser liefert role:string; die Workspace-Helfer erwarten ein engeres Union.
    // Laufzeit-sicher, da role faktisch einer der gültigen Werte ist.
    const allowed = opts?.write
      ? await canWriteWorkspace(workspaceId, ctx.auth as Parameters<typeof canWriteWorkspace>[1])
      : await canReadWorkspace(workspaceId, ctx.auth as Parameters<typeof canReadWorkspace>[1])
    if (!allowed) return notFound()
    return handler(req, { ...ctx, workspaceId })
  })
}

/**
 * Service-/Cron-Routen: prüft den `Bearer ${CRON_SECRET}`-Header.
 * Fail-closed: fehlt CRON_SECRET in der Env, wird abgelehnt (401).
 * Konsolidiert die zuvor 6× duplizierte Prüfung und markiert die Route
 * für den Audit-Checker eindeutig als legitime Service-Route.
 */
export function withCronAuth(handler: (req: NextRequest) => RouteResult) {
  return async (req: NextRequest): Promise<Response> => {
    const expected = process.env.CRON_SECRET
    const provided = req.headers.get('authorization')
    if (!expected || provided !== `Bearer ${expected}`) return unauthorized()
    return handler(req)
  }
}
