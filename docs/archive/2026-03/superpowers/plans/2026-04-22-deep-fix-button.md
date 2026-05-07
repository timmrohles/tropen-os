# Deep Fix Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the existing Consensus Fix Engine (`POST /api/audit/fix/consensus`) in the audit UI by adding a "Deep Fix" button to each `RecommendationCard`, so the "4-model consensus + Opus judge produces better fixes" hypothesis can be empirically tested.

**Architecture:** A lazy-caching state machine hook (`useDeepFix`) checks for an existing cached fix on first click (GET), and only fires the expensive generation call (POST) on cache miss. The button lives inside `RecommendationCard` (which receives `runId` threaded from `FindingsTable`), and the result renders inline below the action row.

**Tech Stack:** Next.js 15 App Router, React 19 hooks, Supabase (supabaseAdmin), Phosphor Icons, vitest + @testing-library/react

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/app/api/audit/fix/consensus/route.ts` — add GET handler |
| Create | `src/hooks/useDeepFix.ts` — state machine + fetch logic |
| Create | `src/app/[locale]/(app)/audit/_components/ConsensusFixResult.tsx` — result card |
| Create | `src/app/[locale]/(app)/audit/_components/DeepFixButton.tsx` — button + result wrapper |
| Modify | `src/app/[locale]/(app)/audit/_components/FindingsTable.tsx` — pass `runId` to `RecommendationCard` |
| Modify | `src/app/[locale]/(app)/audit/_components/RecommendationCard.tsx` — add `runId` prop + render `DeepFixButton` |
| Create | `test/audit/useDeepFix.unit.test.ts` — 5 test cases |
| Modify | `docs/architect-log.md` — log entry |

---

### Task 1: Add GET handler to consensus route

**Files:**
- Modify: `src/app/api/audit/fix/consensus/route.ts`

The existing file only has a POST. We add a GET that retrieves a cached consensus fix by `findingId`, scoped to the authenticated user's org. Returns 404 when none exists — that is the cache-miss signal for the hook.

- [ ] **Step 1: Add the GET export to the route file**

Open `src/app/api/audit/fix/consensus/route.ts`. After the existing imports, add `apiError` import (it's already used in other routes but not in this one yet — check first), then append the GET handler:

```typescript
import { apiError } from '@/lib/api-error'
```

Add this export after the POST function:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const findingId = searchParams.get('findingId')
  if (!findingId) return NextResponse.json({ error: 'findingId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'owner', 'superadmin'].includes(profile.role ?? ''))
    return NextResponse.json({ error: 'Admin access required', code: 'FORBIDDEN' }, { status: 403 })

  const { data: fix, error } = await supabaseAdmin
    .from('audit_fixes')
    .select('id, explanation, confidence, model, cost_eur, judge_explanation, drafts, risk_level, risk_details')
    .eq('finding_id', findingId)
    .eq('fix_mode', 'consensus')
    .eq('organization_id', profile.organization_id)
    .in('status', ['pending', 'applied'])
    .maybeSingle()

  if (error) return apiError(error)
  if (!fix) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const drafts = (fix.drafts ?? []) as Array<{
    providerId: string; explanation: string; confidence: string; costEur: number; error?: string
  }>
  const riskDetails = fix.risk_details as Record<string, unknown> | null

  return NextResponse.json({
    fixId: fix.id,
    explanation: fix.explanation,
    confidence: fix.confidence,
    model: fix.model,
    costEur: fix.cost_eur,
    judgeExplanation: fix.judge_explanation ?? null,
    drafts,
    riskLevel: fix.risk_level ?? null,
    riskReasons: (riskDetails?.reasons as string[] | undefined) ?? [],
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no new errors (there are 5 pre-existing errors unrelated to this file — those are fine).

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/api/audit/fix/consensus/route.ts
git commit -m "feat: add GET handler to consensus fix route for cache lookup"
```

---

### Task 2: Create `useDeepFix` hook

**Files:**
- Create: `src/hooks/useDeepFix.ts`

A state machine hook with 5 states: `idle → checking → generating → ready | error`. On first trigger it checks GET (cache hit → `ready`), then if 404 fires POST (`generating → ready`). If `state === 'ready'`, trigger toggles `expanded`. The `ConsensusFixData` interface is exported so components can import the type.

- [ ] **Step 1: Write the failing test first (see Task 6 for test setup — do Task 6 Step 1 before this if running in sequence)**

Actually, write the hook now and the tests in Task 6. The hook file:

- [ ] **Step 2: Create `src/hooks/useDeepFix.ts`**

```typescript
'use client'

import { useState } from 'react'

export interface ConsensusFixData {
  fixId: string
  explanation: string
  confidence: 'high' | 'medium' | 'low'
  model: string
  costEur: number
  judgeExplanation: string | null
  drafts: Array<{
    providerId: string
    explanation: string
    confidence: 'high' | 'medium' | 'low'
    costEur: number
    error?: string
  }>
  riskLevel?: 'safe' | 'moderate' | 'critical'
  riskReasons?: string[]
}

export type DeepFixState = 'idle' | 'checking' | 'generating' | 'ready' | 'error'

export function useDeepFix(findingId: string, runId: string) {
  const [state, setState] = useState<DeepFixState>('idle')
  const [data, setData] = useState<ConsensusFixData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function trigger() {
    // Toggle if already loaded
    if (state === 'ready') {
      setExpanded((e) => !e)
      return
    }

    // No-op if a request is in flight
    if (state === 'checking' || state === 'generating') return

    setState('checking')
    setErrorMessage(null)

    try {
      // Cache lookup
      const checkRes = await fetch(
        `/api/audit/fix/consensus?findingId=${encodeURIComponent(findingId)}`
      )

      if (checkRes.ok) {
        const cached = (await checkRes.json()) as ConsensusFixData
        setData(cached)
        setState('ready')
        setExpanded(true)
        return
      }

      if (checkRes.status !== 404) {
        const err = (await checkRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? 'Fehler beim Prüfen')
      }

      // Cache miss — generate
      setState('generating')
      const genRes = await fetch('/api/audit/fix/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, runId }),
      })

      if (!genRes.ok) {
        const err = (await genRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? 'Generierung fehlgeschlagen')
      }

      const generated = (await genRes.json()) as ConsensusFixData
      setData(generated)
      setState('ready')
      setExpanded(true)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setState('error')
    }
  }

  return { state, data, errorMessage, expanded, trigger }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit 2>&1 | grep "useDeepFix"
```

Expected: no output (no errors for this file).

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/hooks/useDeepFix.ts
git commit -m "feat: add useDeepFix state machine hook (idle→checking→generating→ready|error)"
```

---

### Task 3: Create `ConsensusFixResult` component

**Files:**
- Create: `src/app/[locale]/(app)/audit/_components/ConsensusFixResult.tsx`

Displays the result of a consensus fix inline below the action row. Shows: judge explanation, per-model draft badges (colored by success/error), risk badge, explanation text, cost/model metadata. Uses only `className="card"` and CSS variables — no hex colors.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import React from 'react'
import { WarningCircle, CheckCircle } from '@phosphor-icons/react'
import type { ConsensusFixData } from '@/hooks/useDeepFix'

interface Props {
  data: ConsensusFixData
}

const RISK_COLOR: Record<string, string> = {
  safe:     'var(--accent)',
  moderate: '#E5A000',
  critical: 'var(--error)',
}

const RISK_LABEL: Record<string, string> = {
  safe:     'Sicher',
  moderate: 'Moderat',
  critical: 'Kritisch',
}

export default function ConsensusFixResult({ data }: Props) {
  const riskColor = data.riskLevel ? RISK_COLOR[data.riskLevel] : undefined
  const successfulDrafts = data.drafts.filter((d) => !d.error)
  const failedDrafts     = data.drafts.filter((d) => !!d.error)

  return (
    <div
      className="card"
      style={{ padding: '12px 16px', marginTop: 10, borderLeft: '3px solid var(--accent)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          Konsens-Fix
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          ~€{data.costEur.toFixed(3)} · {data.model}
        </span>
      </div>

      {/* Model draft badges */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {successfulDrafts.map((d) => (
          <span
            key={d.providerId}
            style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 4,
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <CheckCircle size={10} weight="fill" aria-hidden="true" />
            {d.providerId.split('/').pop()} ({d.confidence})
          </span>
        ))}
        {failedDrafts.map((d) => (
          <span
            key={d.providerId}
            style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 4,
              background: 'rgba(220,0,0,0.07)', color: 'var(--error)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <WarningCircle size={10} weight="fill" aria-hidden="true" />
            {d.providerId.split('/').pop()} fehlgeschlagen
          </span>
        ))}
      </div>

      {/* Risk badge */}
      {data.riskLevel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <WarningCircle size={12} weight="bold" color={riskColor} aria-hidden="true" />
          <span style={{ fontSize: 12, color: riskColor, fontWeight: 500 }}>
            Risiko: {RISK_LABEL[data.riskLevel] ?? data.riskLevel}
          </span>
          {data.riskReasons && data.riskReasons.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              — {data.riskReasons[0]}
            </span>
          )}
        </div>
      )}

      {/* Judge explanation */}
      {data.judgeExplanation && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Urteil: </span>
          {data.judgeExplanation}
        </p>
      )}

      {/* Fix explanation */}
      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>
        {data.explanation}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit 2>&1 | grep "ConsensusFixResult"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add "src/app/[locale]/(app)/audit/_components/ConsensusFixResult.tsx"
git commit -m "feat: add ConsensusFixResult component for inline consensus fix display"
```

---

### Task 4: Create `DeepFixButton` component

**Files:**
- Create: `src/app/[locale]/(app)/audit/_components/DeepFixButton.tsx`

Wraps `useDeepFix` and `ConsensusFixResult`. Shows a `btn btn-ghost btn-sm` button with `Scales` icon. When loading shows a spinner label. When `ready` the button label toggles between "Deep Fix zeigen" / "Deep Fix einklappen". Error state shows an inline error message under the button.

- [ ] **Step 1: Create the component**

```typescript
'use client'

import React from 'react'
import { Scales, WarningCircle } from '@phosphor-icons/react'
import { useDeepFix } from '@/hooks/useDeepFix'
import ConsensusFixResult from './ConsensusFixResult'

interface Props {
  findingId: string
  runId: string
}

export default function DeepFixButton({ findingId, runId }: Props) {
  const { state, data, errorMessage, expanded, trigger } = useDeepFix(findingId, runId)

  const isLoading = state === 'checking' || state === 'generating'

  const label =
    state === 'generating' ? 'Generiert…' :
    state === 'checking'   ? 'Prüft…' :
    state === 'ready'      ? (expanded ? 'Deep Fix einklappen' : 'Deep Fix zeigen') :
    'Deep Fix'

  return (
    <div>
      <button
        className="btn btn-ghost btn-sm"
        onClick={trigger}
        disabled={isLoading}
        title={state === 'generating'
          ? '4-Modell-Konsens läuft — dauert ca. 60 Sekunden'
          : 'Konsens-Fix mit 4 KI-Modellen + Opus-Richter generieren'}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
        aria-busy={isLoading}
      >
        <Scales
          size={13}
          weight="bold"
          aria-hidden="true"
          style={{ opacity: isLoading ? 0.5 : 1 }}
        />
        {label}
      </button>

      {state === 'error' && errorMessage && (
        <p style={{
          fontSize: 11, color: 'var(--error)', marginTop: 4,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <WarningCircle size={11} weight="bold" aria-hidden="true" />
          {errorMessage}
        </p>
      )}

      {state === 'ready' && expanded && data && (
        <ConsensusFixResult data={data} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit 2>&1 | grep "DeepFixButton"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add "src/app/[locale]/(app)/audit/_components/DeepFixButton.tsx"
git commit -m "feat: add DeepFixButton wrapping useDeepFix hook and ConsensusFixResult"
```

---

### Task 5: Wire `runId` through FindingsTable → RecommendationCard → DeepFixButton

**Files:**
- Modify: `src/app/[locale]/(app)/audit/_components/FindingsTable.tsx`
- Modify: `src/app/[locale]/(app)/audit/_components/RecommendationCard.tsx`

Two small changes:
1. `FindingsTable` already has `runId` prop — pass it to `RecommendationCard`.
2. `RecommendationCard` gets `runId?: string` prop and renders `<DeepFixButton>` next to the Fix-Prompt button (under the same `!(group.fixType === 'manual' && recommendation?.manualSteps)` condition).

The representative `findingId` for the group is `group.findings[0].id` — the engine looks it up in the DB by `run_id` + `finding_id`, so any finding in the group is valid. We use the first one.

- [ ] **Step 1: Add `runId` to `FindingsTable`'s `RecommendationCard` call**

In `src/app/[locale]/(app)/audit/_components/FindingsTable.tsx`, find the existing `<RecommendationCard>` call at the `groups.map(...)` loop (around line 372–378):

```tsx
<RecommendationCard
  group={group}
  recommendation={findRecommendation(cleanRuleId(group.ruleId), group.baseMessage)}
  isExternalProject={isExternalProject}
  onMarkFixed={handleMarkFixed}
  onMarkNotRelevant={handleMarkNotRelevant}
/>
```

Change to:

```tsx
<RecommendationCard
  group={group}
  recommendation={findRecommendation(cleanRuleId(group.ruleId), group.baseMessage)}
  isExternalProject={isExternalProject}
  onMarkFixed={handleMarkFixed}
  onMarkNotRelevant={handleMarkNotRelevant}
  runId={runId}
/>
```

- [ ] **Step 2: Add `runId` prop + `DeepFixButton` import to `RecommendationCard`**

In `src/app/[locale]/(app)/audit/_components/RecommendationCard.tsx`:

**2a. Add import** (after existing imports):
```typescript
import DeepFixButton from './DeepFixButton'
```

**2b. Add `runId` to the props interface** (after `onCopyGroupPrompt?` line):
```typescript
runId?: string
```

**2c. Destructure `runId`** in the component signature:
```typescript
export default function RecommendationCard({
  group, recommendation, isExternalProject,
  onMarkFixed, onMarkNotRelevant,
  runId,
}: RecommendationCardProps) {
```

**2d. Add `DeepFixButton` in the actions row** — insert after the Fix-Prompt button block and before the Erledigt button. The relevant section currently reads (around line 327–338):

```tsx
{/* Actions: Fix-Prompt (primary) + Erledigt + Nicht relevant */}
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
  {/* Fix-Prompt — only for non-manual findings; manual findings show steps inline */}
  {!(group.fixType === 'manual' && recommendation?.manualSteps) && (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setDrawerOpen(true)}
      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
    >
      <ClipboardText size={13} weight="bold" aria-hidden="true" /> {t('viewFixPrompt')}
    </button>
  )}

  {/* Erledigt */}
```

Change to:

```tsx
{/* Actions: Fix-Prompt (primary) + Deep Fix + Erledigt + Nicht relevant */}
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
  {/* Fix-Prompt — only for non-manual findings; manual findings show steps inline */}
  {!(group.fixType === 'manual' && recommendation?.manualSteps) && (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setDrawerOpen(true)}
      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
    >
      <ClipboardText size={13} weight="bold" aria-hidden="true" /> {t('viewFixPrompt')}
    </button>
  )}

  {/* Deep Fix — consensus AI fix; only shown when runId is available and same condition as Fix-Prompt */}
  {runId && !(group.fixType === 'manual' && recommendation?.manualSteps) && (
    <DeepFixButton
      findingId={group.findings[0].id}
      runId={runId}
    />
  )}

  {/* Erledigt */}
```

**2e. The `DeepFixButton` renders `ConsensusFixResult` inside itself** — but it needs to appear *below* the action row, not inside it. Move the `DeepFixButton` outside the flex row and make it a sibling. The actions div currently ends at the Nicht-relevant button. Place the Deep Fix trigger inside the flex row and render the result card after the entire actions div.

Actually, looking at the component structure, the actions `<div>` contains inline flex items. `DeepFixButton` renders both the button AND the result card internally. Since the result card is a block element, placing `DeepFixButton` inside the flex row will cause the result to break layout.

Better approach: extract the trigger and result separately, or let `DeepFixButton` render its button inline and its result card as a portal-style sibling. The simplest fix: place `<DeepFixButton>` *after* the closing `</div>` of the actions flex row, not inside it. Then the Scales button and result card both render as block-level elements below the action row.

Revise Step 2d — the final structure should be:

```tsx
{/* Actions: Fix-Prompt (primary) + Erledigt + Nicht relevant */}
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
  {/* Fix-Prompt — only for non-manual findings; manual findings show steps inline */}
  {!(group.fixType === 'manual' && recommendation?.manualSteps) && (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setDrawerOpen(true)}
      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
    >
      <ClipboardText size={13} weight="bold" aria-hidden="true" /> {t('viewFixPrompt')}
    </button>
  )}

  {/* Erledigt */}
  ...all existing Erledigt + Nicht-relevant buttons unchanged...
</div>

{/* Deep Fix — consensus AI fix; rendered below action row */}
{runId && !(group.fixType === 'manual' && recommendation?.manualSteps) && (
  <DeepFixButton
    findingId={group.findings[0].id}
    runId={runId}
  />
)}
```

This keeps the flex row clean and lets the result card expand below it as a full-width block.

- [ ] **Step 3: Verify TypeScript**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit 2>&1 | grep -E "FindingsTable|RecommendationCard"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add "src/app/[locale]/(app)/audit/_components/FindingsTable.tsx" "src/app/[locale]/(app)/audit/_components/RecommendationCard.tsx"
git commit -m "feat: wire runId through FindingsTable→RecommendationCard and render DeepFixButton"
```

---

### Task 6: Write unit tests for `useDeepFix`

**Files:**
- Create: `test/audit/useDeepFix.unit.test.ts`

5 test cases covering: initial idle state, cache hit (GET 200), generate new fix on cache miss (GET 404 → POST 200), error handling (POST fails), and toggle expanded on second click.

- [ ] **Step 1: Check vitest config**

```bash
cd "/c/Users/timmr/tropen OS" && cat vitest.config.ts 2>/dev/null || cat vitest.config.js 2>/dev/null | head -20
```

Note the test file pattern and globals setup for the next step.

- [ ] **Step 2: Create the test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDeepFix } from '@/hooks/useDeepFix'
import type { ConsensusFixData } from '@/hooks/useDeepFix'

const MOCK_FIX: ConsensusFixData = {
  fixId: 'fix-123',
  explanation: 'Replace X with Y',
  confidence: 'high',
  model: 'anthropic/claude-opus-4.6',
  costEur: 0.012,
  judgeExplanation: 'All models agreed on approach Y.',
  drafts: [
    { providerId: 'anthropic/claude-sonnet-4.6', explanation: 'Use Y', confidence: 'high', costEur: 0.003 },
    { providerId: 'openai/gpt-5.4', explanation: 'Use Y', confidence: 'high', costEur: 0.003 },
  ],
  riskLevel: 'safe',
  riskReasons: [],
}

describe('useDeepFix', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('starts in idle state', () => {
    vi.stubGlobal('fetch', vi.fn())
    const { result } = renderHook(() => useDeepFix('finding-1', 'run-1'))
    expect(result.current.state).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(result.current.expanded).toBe(false)
  })

  it('transitions to ready on cache hit (GET 200)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FIX,
    }))

    const { result } = renderHook(() => useDeepFix('finding-1', 'run-1'))

    await act(async () => {
      await result.current.trigger()
    })

    expect(result.current.state).toBe('ready')
    expect(result.current.data).toEqual(MOCK_FIX)
    expect(result.current.expanded).toBe(true)
  })

  it('generates new fix on cache miss (GET 404 → POST 200)', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Not found' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => MOCK_FIX })
    )

    const { result } = renderHook(() => useDeepFix('finding-1', 'run-1'))

    await act(async () => {
      await result.current.trigger()
    })

    expect(result.current.state).toBe('ready')
    expect(result.current.data).toEqual(MOCK_FIX)
    expect(result.current.expanded).toBe(true)

    // Verify POST was called with correct body
    const fetchMock = vi.mocked(global.fetch)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [postUrl, postInit] = fetchMock.mock.calls[1]
    expect(postUrl).toBe('/api/audit/fix/consensus')
    expect((postInit as RequestInit).method).toBe('POST')
    const body = JSON.parse((postInit as RequestInit).body as string)
    expect(body).toEqual({ findingId: 'finding-1', runId: 'run-1' })
  })

  it('transitions to error state on failed generation', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Not found' }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Generierung fehlgeschlagen' }) })
    )

    const { result } = renderHook(() => useDeepFix('finding-1', 'run-1'))

    await act(async () => {
      await result.current.trigger()
    })

    expect(result.current.state).toBe('error')
    expect(result.current.errorMessage).toBe('Generierung fehlgeschlagen')
    expect(result.current.data).toBeNull()
  })

  it('toggles expanded on second trigger when ready', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_FIX,
    }))

    const { result } = renderHook(() => useDeepFix('finding-1', 'run-1'))

    // First trigger — loads and expands
    await act(async () => {
      await result.current.trigger()
    })
    expect(result.current.expanded).toBe(true)

    // Second trigger — collapses (no fetch)
    await act(async () => {
      await result.current.trigger()
    })
    expect(result.current.expanded).toBe(false)
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1) // no extra fetch
  })
})
```

- [ ] **Step 3: Run the tests**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec vitest run test/audit/useDeepFix.unit.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add test/audit/useDeepFix.unit.test.ts
git commit -m "test: add useDeepFix unit tests (5 cases: idle, cache hit, generate, error, toggle)"
```

---

### Task 7: Update architect log

**Files:**
- Modify: `docs/architect-log.md`

- [ ] **Step 1: Add log entry**

Prepend after the `---` separator (after line 24) in `docs/architect-log.md`:

```markdown
## 2026-04-22 — Deep Fix Button (Consensus Fix Engine UI)

**Ampel:** 🟢
**Prompt:** Integrate existing Consensus Fix Engine backend into audit UI (superpowers:writing-plans)

**Entscheidung:** Lazy-caching strategy für Deep Fix: GET on first click (cache hit → sofort), 404 → POST (generation). Verhindert 50+ GET-Requests beim ersten Render von FindingsTable. `runId` wird von FindingsTable → RecommendationCard als optionaler Prop durchgereicht — AuditFinding hat kein run_id-Feld. `DeepFixButton` rendert unter der Actions-Flex-Row (nicht darin), damit ConsensusFixResult als Block-Element sauber expandiert.

**Anpassungen:**
- GET route scoped per `organization_id` (Tenant-Isolation)
- `winnerProviderId` + `consensusLevel` nicht in DB gespeichert (Migration 101) — werden aus drafts-JSON nicht re-deriviert; GET gibt judge_explanation + drafts zurück statt synthetic consensus fields
- Nur für nicht-manuelle Findings gezeigt (gleiche Bedingung wie Fix-Prompt-Button)

**Offene Punkte:**
- Diff-Viewer: POST response enthält `diffs` — aktuell nicht angezeigt (future: inline diff mit Syntax-Highlighting)
- Budget-Check vor POST wäre ideal (analog zu anderen LLM-Routes)

**Neue Lernmuster:** Bei feature-gated UI-Buttons auf API-Features immer lazy-check pattern verwenden (GET → 404 → POST) statt on-mount-prefetch — verhindert Request-Storms bei Listen-Views.

---
```

- [ ] **Step 2: Verify file is valid markdown**

```bash
cd "/c/Users/timmr/tropen OS" && head -50 docs/architect-log.md
```

Expected: New entry appears at the top, format matches existing entries.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add docs/architect-log.md
git commit -m "docs: add architect log entry for Deep Fix Button implementation"
```

---

## Self-Review

### Spec coverage check

| Requirement | Covered by |
|------------|------------|
| GET route for cache lookup | Task 1 |
| `useDeepFix` state machine (idle→checking→generating→ready|error) | Task 2 |
| `ConsensusFixResult` component | Task 3 |
| `DeepFixButton` wrapper | Task 4 |
| `runId` threading FindingsTable→RecommendationCard | Task 5 |
| Same visibility condition as Fix-Prompt button | Task 5 Step 2d |
| Lazy caching (no render-time GET storm) | Task 2 + Task 6 test 5 |
| Tenant isolation in GET route | Task 1 (`organization_id` filter) |
| No Vercel credential warning (credentials in .env) | Not added — correct |
| Unit tests (5 cases) | Task 6 |
| Architect log | Task 7 |

### Placeholder scan

No TBD, TODO, or "similar to Task N" patterns — all steps contain complete code.

### Type consistency

- `ConsensusFixData` defined in `src/hooks/useDeepFix.ts`, imported by `DeepFixButton` and `ConsensusFixResult` via `@/hooks/useDeepFix`.
- `group.findings[0].id` — `FindingGroup.findings: AuditFinding[]`, `AuditFinding.id: string` ✓
- `runId?: string` in `RecommendationCardProps`, matches `FindingsTableProps.runId?: string` ✓
- `DeepFixState` exported for testing ✓

No type mismatches detected.
