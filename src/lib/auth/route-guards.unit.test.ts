import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/api/projects', () => ({
  getAuthUser: vi.fn(),
  verifyProjectAccess: vi.fn(),
}))

vi.mock('@/lib/api/workspaces', () => ({
  canReadWorkspace: vi.fn(),
  canWriteWorkspace: vi.fn(),
}))

import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'
import { canReadWorkspace, canWriteWorkspace } from '@/lib/api/workspaces'
import {
  withAuth, withOrgAdmin, withProjectAccess, withCronAuth,
  withSuperadmin, withWorkspaceAccess,
} from './route-guards'

const mockGetAuthUser = vi.mocked(getAuthUser)
const mockVerify = vi.mocked(verifyProjectAccess)
const mockCanRead = vi.mocked(canReadWorkspace)
const mockCanWrite = vi.mocked(canWriteWorkspace)

const MEMBER = { id: 'u1', organization_id: 'org1', role: 'member' }
const ADMIN = { id: 'u2', organization_id: 'org1', role: 'admin' }
const SUPERADMIN = { id: 'u3', organization_id: 'org1', role: 'superadmin' }

// Die Wrapper (außer withCronAuth) lesen req nicht — ein leeres Objekt genügt.
const req = {} as never
const ctx = <P>(params: P) => ({ params: Promise.resolve(params) })
const ok = () => NextResponse.json({ ok: true })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('withAuth', () => {
  it('gibt 401 zurück, wenn nicht eingeloggt — Handler wird nicht aufgerufen', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    const handler = vi.fn(ok)
    const res = await withAuth(handler)(req, ctx({}))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Nicht autorisiert', code: 'UNAUTHORIZED' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ruft den Handler mit auth + aufgelösten params auf', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    const handler = vi.fn(ok)
    const res = await withAuth<{ slug: string }>(handler)(req, ctx({ slug: 'x' }))
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledWith(req, { params: { slug: 'x' }, auth: MEMBER })
  })

  it('liefert leere params bei statischer Route (leerer Kontext)', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    const handler = vi.fn(ok)
    await withAuth(handler)(req, ctx({}))
    expect(handler).toHaveBeenCalledWith(req, { params: {}, auth: MEMBER })
  })
})

describe('withOrgAdmin', () => {
  it('gibt 401 zurück, wenn nicht eingeloggt', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    const handler = vi.fn(ok)
    const res = await withOrgAdmin(handler)(req, ctx({}))
    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('gibt 403 zurück bei falscher Rolle', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    const handler = vi.fn(ok)
    const res = await withOrgAdmin(handler)(req, ctx({}))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Kein Zugriff', code: 'FORBIDDEN' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('lässt admin und superadmin durch', async () => {
    const handler = vi.fn(ok)
    for (const user of [ADMIN, SUPERADMIN]) {
      mockGetAuthUser.mockResolvedValue(user)
      const res = await withOrgAdmin(handler)(req, ctx({}))
      expect(res.status).toBe(200)
    }
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('lässt owner per Default zu (kanonisches Set schließt owner ein)', async () => {
    const owner = { id: 'u4', organization_id: 'org1', role: 'owner' }
    mockGetAuthUser.mockResolvedValue(owner)
    const handler = vi.fn(ok)
    const res = await withOrgAdmin(handler)(req, ctx({}))
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('respektiert ein einschränkenderes roles-Set', async () => {
    const owner = { id: 'u4', organization_id: 'org1', role: 'owner' }
    mockGetAuthUser.mockResolvedValue(owner)
    const handler = vi.fn(ok)
    const res = await withOrgAdmin(handler, { roles: ['superadmin'] })(req, ctx({}))
    expect(res.status).toBe(403)
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('withProjectAccess', () => {
  it('gibt 401 zurück, wenn nicht eingeloggt — verifyProjectAccess wird nicht aufgerufen', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    const handler = vi.fn(ok)
    const res = await withProjectAccess(handler)(req, ctx({ id: 'p1' }))
    expect(res.status).toBe(401)
    expect(mockVerify).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('gibt 404 zurück, wenn der id-Param fehlt', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    const handler = vi.fn(ok)
    const res = await withProjectAccess(handler)(req, ctx({}))
    expect(res.status).toBe(404)
    expect(mockVerify).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('gibt 404 zurück, wenn kein Zugriff besteht', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    mockVerify.mockResolvedValue(false)
    const handler = vi.fn(ok)
    const res = await withProjectAccess(handler)(req, ctx({ id: 'p1' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Nicht gefunden', code: 'NOT_FOUND' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('ruft den Handler mit auth + projectId auf und prüft Zugriff korrekt', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    mockVerify.mockResolvedValue(true)
    const handler = vi.fn(ok)
    const res = await withProjectAccess<{ id: string }>(handler)(req, ctx({ id: 'p1' }))
    expect(res.status).toBe(200)
    expect(mockVerify).toHaveBeenCalledWith('p1', MEMBER)
    expect(handler).toHaveBeenCalledWith(req, { params: { id: 'p1' }, auth: MEMBER, projectId: 'p1' })
  })

  it('respektiert einen benutzerdefinierten paramKey', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    mockVerify.mockResolvedValue(true)
    const handler = vi.fn(ok)
    await withProjectAccess<{ projectId: string }>(handler, { paramKey: 'projectId' })(
      req,
      ctx({ projectId: 'p9' }),
    )
    expect(mockVerify).toHaveBeenCalledWith('p9', MEMBER)
  })
})

describe('withSuperadmin', () => {
  it('gibt 401 zurück, wenn nicht eingeloggt', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    const handler = vi.fn(ok)
    const res = await withSuperadmin(handler)(req, ctx({}))
    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('gibt 403 zurück für Nicht-Superadmins (auch admin/owner)', async () => {
    const handler = vi.fn(ok)
    for (const role of ['member', 'admin', 'owner']) {
      mockGetAuthUser.mockResolvedValue({ id: 'u', organization_id: 'o', role })
      const res = await withSuperadmin(handler)(req, ctx({}))
      expect(res.status).toBe(403)
    }
    expect(handler).not.toHaveBeenCalled()
  })

  it('lässt superadmin durch', async () => {
    mockGetAuthUser.mockResolvedValue(SUPERADMIN)
    const handler = vi.fn(ok)
    const res = await withSuperadmin(handler)(req, ctx({}))
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('withWorkspaceAccess', () => {
  it('gibt 401 zurück, wenn nicht eingeloggt — Zugriffsprüfung nicht aufgerufen', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    const handler = vi.fn(ok)
    const res = await withWorkspaceAccess(handler)(req, ctx({ id: 'w1' }))
    expect(res.status).toBe(401)
    expect(mockCanRead).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('gibt 404 zurück, wenn der id-Param fehlt', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    const handler = vi.fn(ok)
    const res = await withWorkspaceAccess(handler)(req, ctx({}))
    expect(res.status).toBe(404)
    expect(mockCanRead).not.toHaveBeenCalled()
  })

  it('Lese-Modus (default): nutzt canReadWorkspace; 404 bei kein Zugriff', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    mockCanRead.mockResolvedValue(false)
    const handler = vi.fn(ok)
    const res = await withWorkspaceAccess(handler)(req, ctx({ id: 'w1' }))
    expect(res.status).toBe(404)
    expect(mockCanRead).toHaveBeenCalledWith('w1', MEMBER)
    expect(mockCanWrite).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('Lese-Modus: injiziert workspaceId + auth bei Zugriff', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    mockCanRead.mockResolvedValue(true)
    const handler = vi.fn(ok)
    const res = await withWorkspaceAccess<{ id: string }>(handler)(req, ctx({ id: 'w1' }))
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledWith(req, { params: { id: 'w1' }, auth: MEMBER, workspaceId: 'w1' })
  })

  it('Schreib-Modus ({write:true}): nutzt canWriteWorkspace', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    mockCanWrite.mockResolvedValue(true)
    const handler = vi.fn(ok)
    const res = await withWorkspaceAccess(handler, { write: true })(req, ctx({ id: 'w1' }))
    expect(res.status).toBe(200)
    expect(mockCanWrite).toHaveBeenCalledWith('w1', MEMBER)
    expect(mockCanRead).not.toHaveBeenCalled()
  })

  it('respektiert einen benutzerdefinierten paramKey', async () => {
    mockGetAuthUser.mockResolvedValue(MEMBER)
    mockCanRead.mockResolvedValue(true)
    const handler = vi.fn(ok)
    await withWorkspaceAccess<{ wsId: string }>(handler, { paramKey: 'wsId' })(req, ctx({ wsId: 'w9' }))
    expect(mockCanRead).toHaveBeenCalledWith('w9', MEMBER)
  })
})

describe('withCronAuth', () => {
  const SECRET = 'test-cron-secret'
  let original: string | undefined

  beforeEach(() => {
    original = process.env.CRON_SECRET
    process.env.CRON_SECRET = SECRET
  })
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  const cronReq = (auth?: string) =>
    new Request('http://localhost/api/cron/x', auth ? { headers: { authorization: auth } } : undefined) as never

  it('lässt korrekten Bearer-Token durch', async () => {
    const handler = vi.fn(ok)
    const res = await withCronAuth(handler)(cronReq(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('gibt 401 zurück bei falschem Token', async () => {
    const handler = vi.fn(ok)
    const res = await withCronAuth(handler)(cronReq('Bearer wrong'))
    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('gibt 401 zurück, wenn der Header fehlt', async () => {
    const handler = vi.fn(ok)
    const res = await withCronAuth(handler)(cronReq())
    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('gibt 401 zurück (fail-closed), wenn CRON_SECRET nicht gesetzt ist', async () => {
    delete process.env.CRON_SECRET
    const handler = vi.fn(ok)
    const res = await withCronAuth(handler)(cronReq('Bearer '))
    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })
})
