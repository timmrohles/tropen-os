import { describe, it, expect } from 'vitest'
import type { AuditContext } from '../types'
import { checkRouteAuthorizationWrappers } from './route-authorization-checker'

// Minimaler AuditContext aus In-Memory-Dateien (kein Disk-Zugriff).
function ctxFrom(files: Record<string, string>): AuditContext {
  return {
    repoMap: { files: Object.keys(files).map((path) => ({ path })) },
    fileContents: new Map(Object.entries(files)),
    rootPath: undefined,
  } as unknown as AuditContext
}

const WRAPPED = `import { withProjectAccess } from '@/lib/auth/route-guards'
export const GET = withProjectAccess<{ id: string }>(async (_r, { projectId }) => {
  const { data } = await supabaseAdmin.from('projects').select('*').eq('id', projectId)
  return Response.json(data)
})`

const PRIMITIVE = `import { getAuthUser } from '@/lib/api/projects'
export async function GET() {
  const me = await getAuthUser()
  const { data } = await supabaseAdmin.from('x').select('*').eq('organization_id', me.organization_id)
  return Response.json(data)
}`

const NO_AUTH = `export async function GET() {
  const { data } = await supabaseAdmin.from('x').select('*')
  return Response.json(data)
}`

const NO_DATA_ACCESS = `export async function GET() { return Response.json({ ok: true }) }`

// Inline-Helfer (wie admin/*-Routen): kein getAuthUser, aber supabase.auth.getUser() im Helfer.
const INLINE_HELPER = `import { createClient } from '@/utils/supabase/server'
async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return user
}
export async function GET() {
  const me = await getAdminUser()
  if (!me) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { data } = await supabaseAdmin.from('organization_settings').select('*')
  return Response.json(data)
}`

describe('checkRouteAuthorizationWrappers', () => {
  it('score 5, wenn keine supabaseAdmin-Routen ausserhalb der Allowlist', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/x/route.ts': NO_DATA_ACCESS,
    }))
    expect(res.score).toBe(5)
    expect(res.findings).toHaveLength(0)
  })

  it('flaggt supabaseAdmin-Route ganz ohne Auth (high finding, niedriger Score)', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/x/route.ts': NO_AUTH,
    }))
    expect(res.score).toBeLessThanOrEqual(2)
    expect(res.findings.some((f) => f.severity === 'high' && f.filePath === 'src/app/api/x/route.ts')).toBe(true)
  })

  it('primitiv-only ohne Wrapper: Gate-Verstoss → Score 3, medium-Finding', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/x/route.ts': PRIMITIVE,
    }))
    expect(res.score).toBe(3)
    expect(res.findings.every((f) => f.severity === 'medium')).toBe(true)
    expect(res.findings.some((f) => f.severity === 'high')).toBe(false)
  })

  it('Inline-Helfer (admin-Stil, supabase.auth.getUser) gilt als auth, NICHT als Loch (P10) — aber Gate-Verstoss', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/admin/some-route/route.ts': INLINE_HELPER,
    }))
    expect(res.score).toBe(3)
    expect(res.findings.every((f) => f.severity === 'medium')).toBe(true)
    expect(res.findings.some((f) => f.severity === 'high')).toBe(false)
  })

  it('volle Wrapper-Abdeckung → Score 5, keine Findings', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/projects/[id]/route.ts': WRAPPED,
    }))
    expect(res.score).toBe(5)
    expect(res.findings).toHaveLength(0)
  })

  it('Allowlist: Service-Route (cron) mit supabaseAdmin ohne Auth wird NICHT geflaggt', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/cron/feed-fetch/route.ts': NO_AUTH,
    }))
    expect(res.score).toBe(5)
    expect(res.findings).toHaveLength(0)
  })

  it('öffentliche Allowlist-Route (shared/[token]) wird NICHT geflaggt', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/shared/[token]/route.ts': NO_AUTH,
    }))
    expect(res.score).toBe(5)
  })

  it('gemischt: zählt Abdeckung korrekt und meldet nur die echte Lücke als high', async () => {
    const res = await checkRouteAuthorizationWrappers(ctxFrom({
      'src/app/api/a/route.ts': WRAPPED,
      'src/app/api/b/route.ts': PRIMITIVE,
      'src/app/api/c/route.ts': NO_AUTH,
      'src/app/api/cron/x/route.ts': NO_AUTH, // allowlisted, ignoriert
    }))
    // 1 noAuth vorhanden → Score 2 (<=3 Lücken)
    expect(res.score).toBe(2)
    const highs = res.findings.filter((f) => f.severity === 'high')
    expect(highs).toHaveLength(1)
    expect(highs[0].filePath).toBe('src/app/api/c/route.ts')
    expect(res.reason).toContain('1/3')
  })
})
