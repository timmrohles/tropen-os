import { describe, it, expect } from 'vitest'
import { checkFetchInEffect } from '../checkers/state-deps-obs-checkers'
import type { AuditContext } from '../types'

const FETCH_IN_EFFECT = `
'use client'
import { useEffect, useState } from 'react'

export default function DataWidget() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
  return <div>{JSON.stringify(data)}</div>
}
`

const FETCH_IN_EFFECT_NO_USE_CLIENT = `
import { useEffect, useState } from 'react'

export default function DataWidget() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
  return <div>{JSON.stringify(data)}</div>
}
`

const FETCH_IN_EFFECT_AUTH = `
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function UserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    fetch(\`/api/users/\${user.id}\`).then(r => r.json()).then(setProfile)
  }, [user.id])
  return <div>{profile?.name}</div>
}
`

const FETCH_IN_EFFECT_REALTIME = `
'use client'
import { useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'

export default function LiveFeed() {
  useEffect(() => {
    const channel = supabase.channel('feed')
    channel.subscribe()
    fetch('/api/initial').then(r => r.json())
  }, [])
  return <div />
}
`

const FETCH_IN_EFFECT_WEBSOCKET = `
'use client'
import { useEffect } from 'react'

export default function LiveChart() {
  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com')
    fetch('/api/history').then(r => r.json())
  }, [])
  return <div />
}
`

function makeCtx(files: Array<{ path: string }>, contents: Map<string, string>, nextDep = true): AuditContext {
  return {
    rootPath: undefined,
    repoMap: {
      files: files.map(f => ({ path: f.path, lineCount: 50, exports: [], symbols: [] })),
      dependencies: [],
    },
    packageJson: {
      dependencies: nextDep ? { next: '^15.0.0' } : {},
      devDependencies: {},
    },
    fileContents: contents,
  } as unknown as AuditContext
}

describe('checkFetchInEffect — cache layer guard', () => {
  it('passes immediately when SWR is installed', async () => {
    const ctx = {
      ...makeCtx([], new Map()),
      packageJson: { dependencies: { swr: '^2.0.0', next: '^15.0.0' }, devDependencies: {} },
    } as unknown as AuditContext
    const result = await checkFetchInEffect(ctx)
    expect(result.score).toBe(5)
    expect(result.findings).toHaveLength(0)
  })

  it('passes when react-query is installed', async () => {
    const ctx = {
      ...makeCtx([], new Map()),
      packageJson: { dependencies: { '@tanstack/react-query': '^5.0.0', next: '^15.0.0' }, devDependencies: {} },
    } as unknown as AuditContext
    const result = await checkFetchInEffect(ctx)
    expect(result.score).toBe(5)
  })
})

describe('checkFetchInEffect — Next.js App Router guards (P4.1)', () => {
  it('skips server components in app/ (no use client — cannot run useEffect)', async () => {
    const path = 'src/app/dashboard/page.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT_NO_USE_CLIENT]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(0)
  })

  it('skips client component with useAuth (legitimate client-state need)', async () => {
    const path = 'src/app/(app)/profile/page.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT_AUTH]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(0)
  })

  it('skips client component with WebSocket (legitimate realtime need)', async () => {
    const path = 'src/app/(app)/chart/page.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT_WEBSOCKET]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(0)
  })

  it('skips client component with supabase.channel (realtime subscription)', async () => {
    const path = 'src/app/(app)/feed/page.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT_REALTIME]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(0)
  })

  it('skips API route handlers in app/api/', async () => {
    const path = 'src/app/api/data/route.ts'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(0)
  })

  it('flags client component in app/ WITHOUT client-state indicators', async () => {
    const path = 'src/app/(app)/stats/page.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].filePath).toBe(path)
  })
})

describe('checkFetchInEffect — non-App-Router files', () => {
  it('flags fetch-in-useEffect in src/components/ even with Next.js', async () => {
    const path = 'src/components/widgets/DataWidget.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(1)
  })

  it('flags fetch-in-useEffect in src/hooks/ even with Next.js', async () => {
    const path = 'src/hooks/useData.ts'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT_NO_USE_CLIENT]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(1)
  })

  it('flags fetch-in-useEffect in non-Next.js projects', async () => {
    const path = 'src/app/dashboard/page.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT]]), false)
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(1)
  })

  it('skips test files', async () => {
    const path = 'src/components/__tests__/DataWidget.test.tsx'
    const ctx = makeCtx([{ path }], new Map([[path, FETCH_IN_EFFECT]]))
    const result = await checkFetchInEffect(ctx)
    expect(result.findings).toHaveLength(0)
  })
})

describe('checkFetchInEffect — score thresholds', () => {
  it('returns score 4 when no violations', async () => {
    const ctx = makeCtx([], new Map())
    const result = await checkFetchInEffect(ctx)
    expect(result.score).toBe(4)
  })

  it('returns score 2 for <=10 violations', async () => {
    const files = Array.from({ length: 3 }, (_, i) => ({ path: `src/components/W${i}.tsx` }))
    const contents = new Map(files.map(f => [f.path, FETCH_IN_EFFECT]))
    const ctx = makeCtx(files, contents)
    const result = await checkFetchInEffect(ctx)
    expect(result.score).toBe(2)
  })

  it('returns score 1 for >10 violations', async () => {
    const files = Array.from({ length: 11 }, (_, i) => ({ path: `src/components/W${i}.tsx` }))
    const contents = new Map(files.map(f => [f.path, FETCH_IN_EFFECT]))
    const ctx = makeCtx(files, contents)
    const result = await checkFetchInEffect(ctx)
    expect(result.score).toBe(1)
  })
})
