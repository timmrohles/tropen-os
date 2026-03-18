# Plan D — Chat & Context Integration

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Capability + Outcome, project_memory, and knowledge search into both chat systems so every LLM call has full context.

**Architecture:** Two chat systems exist with different runtimes — the Supabase Deno Edge Function (`ai-chat`) handles project/conversation chat; the Next.js API route (`chat/stream`) handles workspace/card chat. The capability resolver runs only in Node.js, so the integration pattern differs per system: for `ai-chat` the client pre-resolves the plan and passes it as a parameter; for `chat/stream` the resolver is called directly.

**Tech Stack:** Supabase Edge Functions (Deno), Next.js App Router, Anthropic SDK, supabaseAdmin, Zod, Vitest.

---

## Pre-flight: Ist-Zustand prüfen

Before writing any file, verify:

- [ ] `project_memory` table exists (from migration 030)
- [ ] `search_knowledge_chunks` RPC exists (from RAG migrations)
- [ ] `model_catalog` has `context_window` column (added in migration 039)
- [ ] `supabase/functions/ai-chat/index.ts` — current code is the baseline (read it before changing)
- [ ] `src/app/api/chat/stream/route.ts` — current code is the baseline (read it before changing)

---

## Conflict Analysis

| Item | Status | Decision |
|------|--------|----------|
| `project_memory` loading | Missing in ai-chat | Add in Task 1 |
| Capability model routing in ai-chat | Missing | Pass pre-resolved plan as parameter |
| Memory warning | Missing | Add `memory_warning` in `done` event |
| Auth in `chat/stream` | Takes userId from body (insecure) | Fix to use `getAuthUser()` |
| Knowledge search in `chat/stream` | Missing | Add in Task 4 |

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `supabase/functions/ai-chat/index.ts` | Modify | Add project_memory, workflow_plan param, memory warning |
| `src/app/api/chat/stream/route.ts` | Modify | Fix auth, add capability support, add knowledge search |
| `src/lib/project-context.ts` | Create | `buildProjectMemorySection()` — reusable Node.js helper |
| `src/lib/project-context.unit.test.ts` | Create | Unit tests for project-context builder |
| `CLAUDE.md` | Modify | Document Plan D changes |

---

## Chunk 1: Project Memory Injection (ai-chat)

### Task 1: Load project_memory in ai-chat Edge Function

**Files:**
- Modify: `supabase/functions/ai-chat/index.ts` (section 9 — after project context)

The function already loads `projects.instructions` as `projectContext`. We need to also load `project_memory` entries and inject them into the system prompt.

**What to add after line ~388 (after projectContext is set):**

```typescript
// 9b. Projekt-Gedächtnis laden
let projectMemory: string | null = null
if (projectId) {
  const { data: memoryRows } = await supabase
    .from('project_memory')
    .select('content, type, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (memoryRows && memoryRows.length > 0) {
    projectMemory = memoryRows
      .map((m: { type: string; content: string }) =>
        `[${m.type}] ${m.content}`
      )
      .join('\n')
  }
}
```

**Update `buildSystemPrompt` params + function signature:**

In `buildSystemPrompt`, add a `projectMemory` field alongside `projectContext`:

```typescript
// Add to the interface:
projectMemory: string | null;

// Add to the function body, after projectContext block:
if (p.projectMemory) {
  lines.push('\n## Projekt-Gedächtnis (Erkenntnisse aus früheren Gesprächen)')
  lines.push(p.projectMemory)
}
```

- [ ] **Step 1: Read the full current `ai-chat/index.ts`** to understand exact line numbers and structure before editing.

- [ ] **Step 2: Add `projectMemory` to `buildSystemPrompt` params + function body**

Update the `buildSystemPrompt` function to accept and render `projectMemory`.

- [ ] **Step 3: Add project_memory DB query (section 9b)**

After the `projectContext` block, add the `project_memory` query as shown above.

- [ ] **Step 4: Pass `projectMemory` to `buildSystemPrompt` call**

In section 13, add `projectMemory` to the `buildSystemPrompt` call.

- [ ] **Step 5: Manual smoke test**

Start a conversation linked to a project that has memory entries.
Expected: AI response references information from past memory.

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/functions/ai-chat/index.ts
git commit -m "feat(ai-chat): inject project_memory entries into system prompt"
```

---

## Chunk 2: Capability + Outcome as Chat Parameters

### Task 2: Accept pre-resolved WorkflowPlan in ai-chat

**Files:**
- Modify: `supabase/functions/ai-chat/index.ts`

**Architectural note:** The capability-resolver runs in Node.js only. The Deno Edge Function cannot import it. The integration pattern: the Next.js frontend calls `/api/capabilities/resolve` (or `/api/guided/resolve`) first, then passes the resolved plan as a `workflow_plan` parameter to `ai-chat`. The edge function uses the plan to override model selection and inject the capability system_prompt.

- [ ] **Step 1: Extend `ChatRequest` interface**

```typescript
interface WorkflowPlanParam {
  api_model_id: string   // e.g. "claude-sonnet-4-20250514"
  provider:     string   // "anthropic" | "openai"
  system_prompt: string  // merged capability + outcome prompt from resolver
}

interface ChatRequest {
  workspace_id:    string
  conversation_id: string
  message:         string
  agent_id?:       string
  workflow_plan?:  WorkflowPlanParam  // NEW — pre-resolved, optional
}
```

- [ ] **Step 2: Use `workflow_plan` to skip model-class detection**

In section 7 (model routing), add a branch:

```typescript
let provider: Provider
let apiModelId: string
let modelData: Record<string, unknown>

const wp = body.workflow_plan

if (wp) {
  // Use pre-resolved capability plan — skip model_class detection + DB query
  provider   = wp.provider as Provider
  apiModelId = wp.api_model_id
  modelData  = {
    name:               wp.api_model_id,
    api_model_id:       wp.api_model_id,
    provider:           wp.provider,
    cost_per_1k_input:  0.003,   // conservative fallback
    cost_per_1k_output: 0.015,
    context_window:     200000,
  }
} else {
  // existing model_class detection + DB query (unchanged)
  // ... keep all existing code from steps 3–7
}
```

- [ ] **Step 3: Inject `workflow_plan.system_prompt` into buildSystemPrompt**

Add `workflowSystemPrompt: string | null` to `buildSystemPrompt`, inject before the agent-specific section:

```typescript
// In buildSystemPrompt params:
workflowSystemPrompt: string | null;

// In function body, after general lines and before agentSystemPrompt:
if (p.workflowSystemPrompt) {
  lines.push('\n## Capability-Kontext')
  lines.push(p.workflowSystemPrompt)
}
```

Pass `workflowSystemPrompt: wp?.system_prompt ?? null` in section 13.

- [ ] **Step 4: Manual smoke test**

Call `ai-chat` directly with a `workflow_plan` object. Verify the response uses the correct model and the system_prompt is injected.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/functions/ai-chat/index.ts
git commit -m "feat(ai-chat): accept pre-resolved workflow_plan (capability + outcome) as chat parameter"
```

---

## Chunk 3: Memory Warning

### Task 3: Return memory_warning when context usage > 85%

**Files:**
- Modify: `supabase/functions/ai-chat/index.ts`

When the system prompt + history approaches the model's context window, return `memory_warning: true` in the `done` event. The UI (Plan F) will display a warning in the chat header.

**Token estimation (no API call needed — approximate):**

```typescript
// Approximate token count: ~4 chars per token for German text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// After section 13 (system prompt built), before section 14 (LLM call):
const contextWindow = (modelData.context_window as number) ?? 200000
const historyText = history.map(m => m.content).join(' ')
const approxTokensUsed =
  estimateTokens(systemPrompt) +
  estimateTokens(historyText) +
  estimateTokens(message)

const memoryUsageRatio = approxTokensUsed / contextWindow
const memoryWarning = memoryUsageRatio > 0.85
```

**In the `done` event, add:**

```typescript
send({
  type: "done",
  routing: { ... },
  usage: { ... },
  budget: { ... },
  memory_warning: memoryWarning,              // NEW
  memory_usage_ratio: Math.round(memoryUsageRatio * 100) / 100,  // NEW
})
```

- [ ] **Step 1: Add `estimateTokens` helper function** in the Hilfsfunktionen section.

- [ ] **Step 2: Add token estimation + `memoryWarning` flag** after section 13.

- [ ] **Step 3: Add `memory_warning` + `memory_usage_ratio` to the `done` event.**

- [ ] **Step 4: Manual smoke test**

Verify the `done` event includes `memory_warning` field (should be `false` for short conversations).

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/functions/ai-chat/index.ts
git commit -m "feat(ai-chat): add memory_warning flag when context usage >85%"
```

---

## Chunk 4: Workspace Chat — Auth Fix + Capability Support + Knowledge Search

### Task 4: Fix `chat/stream` route

**Files:**
- Modify: `src/app/api/chat/stream/route.ts`
- Create: `src/lib/project-context.ts` (reusable helper)
- Create: `src/lib/project-context.unit.test.ts`

**Current issues in `chat/stream`:**
1. Takes `userId` from the request body — security issue, user can spoof any userId
2. No auth check at all
3. No knowledge search
4. Hardcoded model `claude-sonnet-4-6`
5. No Capability + Outcome support

**Sub-task 4a: Create `project-context.ts` helper**

```typescript
// src/lib/project-context.ts
// Reusable Node.js helper for loading project memory into system prompts.
// Used by chat/stream and future routes.
import { supabaseAdmin } from '@/lib/supabase-admin'

export interface ProjectMemorySection {
  instructions: string | null
  memoryEntries: string | null
  tokenEstimate: number
}

/**
 * Load project instructions + memory entries for a given project.
 * Returns formatted strings ready for system prompt injection.
 */
export async function loadProjectContext(
  projectId: string
): Promise<ProjectMemorySection> {
  const [{ data: project }, { data: memRows }] = await Promise.all([
    supabaseAdmin
      .from('projects')
      .select('instructions')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single(),
    supabaseAdmin
      .from('project_memory')
      .select('content, type')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const instructions = project?.instructions ?? null
  const memoryEntries = memRows?.length
    ? memRows.map(m => `[${m.type}] ${m.content}`).join('\n')
    : null

  const tokenEstimate = Math.ceil(
    ((instructions?.length ?? 0) + (memoryEntries?.length ?? 0)) / 4
  )

  return { instructions, memoryEntries, tokenEstimate }
}
```

**Sub-task 4b: Unit tests for `project-context.ts`**

```typescript
// src/lib/project-context.unit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { loadProjectContext } from './project-context'

const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>
const PROJECT_ID = '00000000-0000-0000-0000-000000000001'

describe('loadProjectContext', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns instructions and memory when both exist', async () => {
    fromMock
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ is: () => ({ single: () => Promise.resolve({
          data: { instructions: 'Mache X.' }, error: null,
        }) }) }) }),
      })
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({
          data: [{ type: 'fact', content: 'Wichtige Info.' }], error: null,
        }) }) }) }),
      })

    const result = await loadProjectContext(PROJECT_ID)
    expect(result.instructions).toBe('Mache X.')
    expect(result.memoryEntries).toContain('[fact]')
    expect(result.tokenEstimate).toBeGreaterThan(0)
  })

  it('returns nulls when project has no content', async () => {
    fromMock
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ is: () => ({ single: () => Promise.resolve({
          data: { instructions: null }, error: null,
        }) }) }) }),
      })
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({
          data: [], error: null,
        }) }) }) }),
      })

    const result = await loadProjectContext(PROJECT_ID)
    expect(result.instructions).toBeNull()
    expect(result.memoryEntries).toBeNull()
    expect(result.tokenEstimate).toBe(0)
  })
})
```

**Sub-task 4c: Update `chat/stream` route**

Key changes to `src/app/api/chat/stream/route.ts`:

1. Replace body `userId` with `getAuthUser()`:
```typescript
// REMOVE: const { workspaceId, cardId, content, userId } = body
// ADD:
const me = await getAuthUser()
if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const { workspaceId, cardId, content, capabilityId, outcomeId } = body
const userId = me.id
```

2. Add optional Capability + Outcome model routing:
```typescript
import { resolveWorkflow } from '@/lib/capability-resolver'

// Before the LLM call:
let modelId = 'claude-sonnet-4-20250514'
let capabilitySystemPrompt: string | null = null

if (capabilityId && outcomeId) {
  try {
    const plan = await resolveWorkflow(capabilityId, outcomeId, me.id, me.organization_id)
    if (plan.available) {
      modelId = plan.model_id
      capabilitySystemPrompt = plan.system_prompt
    }
  } catch {
    // non-blocking — fall back to default model
  }
}
```

3. Prepend capability system prompt to the existing system prompt:
```typescript
const baseSystemPrompt = cardId
  ? await buildCardContext(cardId)
  : await buildWorkspaceContext(workspaceId)

const systemPrompt = capabilitySystemPrompt
  ? `${capabilitySystemPrompt}\n\n${baseSystemPrompt}`
  : baseSystemPrompt
```

4. Update the Anthropic call to use `modelId` instead of hardcoded string:
```typescript
const stream = anthropic.messages.stream({
  model: modelId,   // was hardcoded 'claude-sonnet-4-6'
  ...
})
```

- [ ] **Step 1: Write failing test for `loadProjectContext`**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec vitest run src/lib/project-context.unit.test.ts
```
Expected: FAIL (file doesn't exist yet)

- [ ] **Step 2: Create `src/lib/project-context.ts`**

Implement `loadProjectContext()` as shown above.

- [ ] **Step 3: Run tests — expect PASS**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec vitest run src/lib/project-context.unit.test.ts
```
Expected: 2 tests passing.

- [ ] **Step 4: Update `chat/stream` route**

Apply changes a, b, c, d in order:
- Remove `userId` from body
- Add `getAuthUser()` + imports
- Add capability plan resolution block
- Update system prompt concatenation
- Update `modelId` usage
- Update `insert` calls (userId is now `me.id`, not from body)

- [ ] **Step 5: TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/lib/project-context.ts src/lib/project-context.unit.test.ts src/app/api/chat/stream/route.ts
git commit -m "feat(chat/stream): fix auth, add capability routing, add project-context helper"
```

---

## Chunk 5: CLAUDE.md Update

### Task 5: Document Plan D

- [ ] **Step 1: Update `docs/phase2-plans.md`**

Change Plan D status:
```
| **Plan D** | Chat & Context Integration | ✅ Fertig |
```

- [ ] **Step 2: Update `CLAUDE.md` Migrations-Tabelle**

No new migrations in Plan D — no change needed.

- [ ] **Step 3: Add Plan D section to CLAUDE.md**

Under the Guided Workflows section, add:

```markdown
### Chat & Context Integration (Plan D — Stand 2026-03-17)

| Datei | Änderung |
|-------|----------|
| `supabase/functions/ai-chat/index.ts` | project_memory Injection + workflow_plan Parameter + memory_warning |
| `src/app/api/chat/stream/route.ts` | Auth-Fix (userId aus getAuthUser, nicht Body) + Capability-Routing |
| `src/lib/project-context.ts` | `loadProjectContext()` — project instructions + memory für Node.js-Routen |

**Wichtige Regeln:**
- `workflow_plan` wird vom Client pre-resolved via `/api/capabilities/resolve` — ai-chat macht keine eigene Resolution
- `memory_warning: true` wenn approximierte Tokens > 85% des context_window (4 chars/token)
- `chat/stream` nimmt `userId` NICHT aus dem Request-Body — immer aus `getAuthUser()`
```

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add CLAUDE.md docs/phase2-plans.md
git commit -m "docs: update CLAUDE.md + phase2-plans — Plan D complete"
```

---

## Definition of Done

- [ ] `project_memory` entries erscheinen im System-Prompt von `ai-chat`
- [ ] `workflow_plan` Parameter wird von `ai-chat` akzeptiert und verwendet
- [ ] `done` Event enthält `memory_warning` + `memory_usage_ratio`
- [ ] `chat/stream` nimmt `userId` aus Auth, nicht aus Body
- [ ] `chat/stream` verwendet Capability-Modell wenn `capabilityId` + `outcomeId` übergeben
- [ ] `loadProjectContext()` Unit-Tests grün
- [ ] `pnpm exec tsc --noEmit` sauber
- [ ] CLAUDE.md aktualisiert
