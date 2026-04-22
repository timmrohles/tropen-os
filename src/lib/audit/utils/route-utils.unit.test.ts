import { describe, it, expect } from 'vitest'
import { isListRoute } from './route-utils'

describe('isListRoute', () => {
  // ── true (is a list route) ─────────────────────────────────────────────────

  it('returns true for a flat collection endpoint', () => {
    expect(isListRoute('src/app/api/users/route.ts')).toBe(true)
  })

  it('returns true for a nested collection without dynamic ancestors', () => {
    expect(isListRoute('src/app/api/admin/clients/route.ts')).toBe(true)
  })

  it('returns true for an org-level list endpoint', () => {
    expect(isListRoute('src/app/api/workspaces/route.ts')).toBe(true)
  })

  it('returns true for a standard audit runs endpoint', () => {
    expect(isListRoute('src/app/api/audit/runs/route.ts')).toBe(true)
  })

  // ── false: dynamic last segment ───────────────────────────────────────────

  it('returns false when the parent dir is a dynamic segment [id]', () => {
    expect(isListRoute('src/app/api/users/[id]/route.ts')).toBe(false)
  })

  it('returns false for any dynamic segment format [slug]', () => {
    expect(isListRoute('src/app/api/posts/[slug]/route.ts')).toBe(false)
  })

  // ── false: dynamic ancestor ───────────────────────────────────────────────

  it('returns false for sub-resource under dynamic parent', () => {
    expect(isListRoute('src/app/api/users/[id]/comments/route.ts')).toBe(false)
  })

  it('returns false for deeply nested sub-resource under dynamic parent', () => {
    expect(isListRoute('src/app/api/orgs/[orgId]/members/route.ts')).toBe(false)
  })

  // ── false: NON_LIST_SEGMENTS ───────────────────────────────────────────────

  it('returns false for /settings endpoint', () => {
    expect(isListRoute('src/app/api/admin/settings/route.ts')).toBe(false)
  })

  it('returns false for /config endpoint', () => {
    expect(isListRoute('src/app/api/org/config/route.ts')).toBe(false)
  })

  it('returns false for /callback endpoint', () => {
    expect(isListRoute('src/app/api/auth/callback/route.ts')).toBe(false)
  })

  it('returns false for /batch endpoint', () => {
    expect(isListRoute('src/app/api/tasks/batch/route.ts')).toBe(false)
  })

  it('returns false for hyphenated segment containing a non-list segment (batch-generate)', () => {
    expect(isListRoute('src/app/api/audit/fix/batch-generate/route.ts')).toBe(false)
  })

  it('returns false for hyphenated segment with suffix (post-callback)', () => {
    expect(isListRoute('src/app/api/webhooks/post-callback/route.ts')).toBe(false)
  })

  it('returns false for /session endpoint', () => {
    expect(isListRoute('src/app/api/user/impersonation-sessions/route.ts')).toBe(false)
  })

  it('returns false for /compliance endpoint', () => {
    expect(isListRoute('src/app/api/admin/qa/compliance/route.ts')).toBe(false)
  })

  it('returns false for /verify endpoint', () => {
    expect(isListRoute('src/app/api/email/verify/route.ts')).toBe(false)
  })

  it('returns false for /invite endpoint', () => {
    expect(isListRoute('src/app/api/org/invite/route.ts')).toBe(false)
  })

  it('returns false for /me endpoint', () => {
    expect(isListRoute('src/app/api/users/me/route.ts')).toBe(false)
  })

  it('returns false for /profile endpoint', () => {
    expect(isListRoute('src/app/api/users/profile/route.ts')).toBe(false)
  })

  // ── false: cron paths ─────────────────────────────────────────────────────

  it('returns false for a cron job route', () => {
    expect(isListRoute('src/app/api/cron/sync-feeds/route.ts')).toBe(false)
  })

  it('returns false for a nested cron route', () => {
    expect(isListRoute('src/app/api/internal/cron/cleanup/route.ts')).toBe(false)
  })
})
