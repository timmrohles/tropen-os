# Chat-Interaktions-System Implementation Plan (Plan L)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three layers of chat intelligence — Projekt-Einstieg (contextual project intro), Quick-Chips (post-response action chips), and Prompt-Builder (guided prompt refinement modal).

**Architecture:** Projekt-Einstieg fires a Haiku call after messages load empty for a project conversation. Quick-Chips fires a separate POST after the stream ends — no JSON in the stream, no fragile parsing. Prompt-Builder is a modal-based multi-turn dialog using a local state machine, with `conversation_type: 'prompt_builder'` in the DB.

**Tech Stack:** Next.js App Router, AI SDK `generateText()`, Haiku (`claude-haiku-4.5`), Supabase, TypeScript strict, Phosphor Icons, CSS vars only.

---

## File Map

### New Files
| File | Responsibility |
|------|----------------|
| `src/app/api/chat/project-intro/route.ts` | Generate contextual intro message for project conversations |
| `src/app/api/chat/generate-chips/route.ts` | Generate 3–4 action chips from last Toro response |
| `src/app/api/chat/prompt-builder/route.ts` | Run one step of the prompt-builder dialog |
| `src/components/workspace/QuickChips.tsx` | Chips bar rendered below last assistant message |
| `src/components/workspace/PromptBuilderModal.tsx` | Guided prompt refinement modal |
| `supabase/migrations/20260320000061_chat_prompt_builder.sql` | Add `prompt_builder` to conversation_type CHECK |

### Modified Files
| File | Change |
|------|--------|
| `src/lib/model-selector.ts` | Add `project_intro` and `chips` task types |
| `src/lib/workspace-types.ts` | Add `ChipItem` type + chips/promptBuilder fields to `WorkspaceState` |
| `src/hooks/useWorkspaceState.ts` | Chips state, project-intro trigger after messages load |
| `src/lib/workspace-chat.ts` | Fire generate-chips after stream ends; clear chips on new send |
| `src/components/workspace/ChatArea.tsx` | Render `<QuickChips>` + `<PromptBuilderModal>` |

---

## Phase A — Projekt-Einstieg

### Task 1: Model types + API route `/api/chat/project-intro`

**Files:**
- Modify: `src/lib/model-selector.ts`
- Create: `src/app/api/chat/project-intro/route.ts`

- [ ] **Step 1: Add task types to model-selector**

In `src/lib/model-selector.ts`, add two entries to `TaskType` and `MODEL_ROUTING`:

```typescript
// In TaskType union — add after 'transformation':
| 'project_intro'    // context-aware opening message for project chats
| 'chips'            // quick-action chip generation after responses
| 'prompt_builder'   // guided prompt refinement dialog

// In MODEL_ROUTING — add after feed_stage2:
project_intro:  { modelId: HAIKU, tier: 'fast', maxTokens: 512 },
chips:          { modelId: HAIKU, tier: 'fast', maxTokens: 256 },
prompt_builder: { modelId: HAIKU, tier: 'fast', maxTokens: 512 },
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors (new union members are additive).

- [ ] **Step 3: Write failing test for project-intro prompt builder**

Create `src/app/api/chat/project-intro/project-intro.unit.test.ts`:

```typescript
import { buildProjectIntroPrompt } from './project-intro-prompt'

describe('buildProjectIntroPrompt', () => {
  it('includes project title and memory entries', () => {
    const result = buildProjectIntroPrompt({
      projectTitle: 'Buchhandlung Businessplan',
      instructions: 'Fokus auf KMU-Zielgruppe.',
      memoryEntries: '[fact] Zielgruppe: 35-55 Jahre\n[fact] Budget: 50k EUR',
      lastMessages: [],
    })
    expect(result).toContain('Buchhandlung Businessplan')
    expect(result).toContain('Zielgruppe')
  })

  it('mentions last session context when provided', () => {
    const result = buildProjectIntroPrompt({
      projectTitle: 'Test',
      instructions: null,
      memoryEntries: null,
      lastMessages: [
        { role: 'user', content: 'Lass uns die Zielgruppe definieren.' },
        { role: 'assistant', content: 'Die Hauptzielgruppe sind 35-55-Jährige.' },
      ],
    })
    expect(result).toContain('letzte')
  })

  it('handles empty context gracefully', () => {
    const result = buildProjectIntroPrompt({
      projectTitle: 'Neues Projekt',
      instructions: null,
      memoryEntries: null,
      lastMessages: [],
    })
    expect(result.length).toBeGreaterThan(50)
    expect(result).toContain('Neues Projekt')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd "C:/Users/timmr/tropenOS" && npx vitest run src/app/api/chat/project-intro/project-intro.unit.test.ts 2>&1 | tail -10
```
Expected: FAIL — module not found.

- [ ] **Step 5: Create prompt builder helper**

Create `src/app/api/chat/project-intro/project-intro-prompt.ts`:

```typescript
interface BuildPromptArgs {
  projectTitle: string
  instructions: string | null
  memoryEntries: string | null
  lastMessages: Array<{ role: string; content: string }>
}

export function buildProjectIntroPrompt(args: BuildPromptArgs): string {
  const { projectTitle, instructions, memoryEntries, lastMessages } = args

  const parts: string[] = [
    `Du hilfst bei einem Projekt: "${projectTitle}".`,
  ]

  if (instructions) {
    parts.push(`Projekt-Kontext: ${instructions}`)
  }

  if (memoryEntries) {
    parts.push(`Bisherige Erkenntnisse:\n${memoryEntries}`)
  }

  if (lastMessages.length > 0) {
    const lastUserMsg = [...lastMessages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      parts.push(`Letztes Thema: "${lastUserMsg.content.slice(0, 200)}"`)
    }
  }

  parts.push(
    'Erstelle eine kurze, kontextuelle Begrüßungsnachricht (2-4 Sätze).',
    'Fasse zusammen was bisher erarbeitet wurde und frage womit der Nutzer weitermachen möchte.',
    'Antworte auf Deutsch. Kein Intro wie "Hallo!" — direkt zur Sache.',
    'Wenn kein Kontext vorhanden: frage freundlich womit gestartet werden soll.',
  )

  return parts.join('\n\n')
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd "C:/Users/timmr/tropenOS" && npx vitest run src/app/api/chat/project-intro/project-intro.unit.test.ts 2>&1 | tail -10
```
Expected: 3/3 PASS.

- [ ] **Step 7: Create API route**

Create `src/app/api/chat/project-intro/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { loadProjectContext } from '@/lib/project-context'
import { modelFor } from '@/lib/model-selector'
import { buildProjectIntroPrompt } from './project-intro-prompt'
import { createLogger } from '@/lib/logger'

const log = createLogger('project-intro')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let conversationId: string
  try {
    const body = await req.json() as { conversationId: string }
    conversationId = body.conversationId
    if (!conversationId) throw new Error('missing conversationId')
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Load conversation + project
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, project_id, workspace_id')
    .eq('id', conversationId)
    .single()

  if (!conv?.project_id) {
    return NextResponse.json({ error: 'Not a project conversation' }, { status: 400 })
  }

  // Load project title
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('title')
    .eq('id', conv.project_id)
    .is('deleted_at', null)
    .single()

  // Load project context + last conversation messages in parallel
  const [projectCtx, { data: lastConvMessages }] = await Promise.all([
    loadProjectContext(conv.project_id),
    supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const prompt = buildProjectIntroPrompt({
    projectTitle: project?.title ?? 'Projekt',
    instructions: projectCtx.instructions,
    memoryEntries: projectCtx.memoryEntries,
    lastMessages: (lastConvMessages ?? []).reverse() as Array<{ role: string; content: string }>,
  })

  try {
    const { text } = await generateText({
      model: anthropic(modelFor('project_intro')),
      prompt,
      maxOutputTokens: 512,
    })
    return NextResponse.json({ message: text })
  } catch (err) {
    log.error('project-intro generation failed', { error: String(err) })
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 8: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add src/lib/model-selector.ts src/app/api/chat/project-intro/ && git commit -m "feat: add project-intro API route + model task types"
```

---

### Task 2: Trigger project-intro in `useWorkspaceState`

**Files:**
- Modify: `src/hooks/useWorkspaceState.ts`

- [ ] **Step 1: Add intro state and trigger logic**

In `useWorkspaceState.ts`, after the existing `[messages, setMessages]` state declaration, add:

```typescript
const introCheckedRef = useRef<Set<string>>(new Set())
```

Then in the messages load `useEffect` (around line 250), replace:

```typescript
.then(({ data }) => setMessages((data ?? []) as ChatMessage[]))
```

with:

```typescript
.then(({ data }) => {
  const loaded = (data ?? []) as ChatMessage[]
  setMessages(loaded)

  // Projekt-Einstieg: fire once per new conversation with no messages
  const conv = conversations.find(c => c.id === activeConvId)
  if (
    loaded.length === 0 &&
    conv?.project_id &&
    activeConvId &&
    !introCheckedRef.current.has(activeConvId)
  ) {
    introCheckedRef.current.add(activeConvId)
    fetch('/api/chat/project-intro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConvId }),
    })
      .then(r => r.ok ? r.json() as Promise<{ message: string }> : null)
      .then(res => {
        if (res?.message) {
          setMessages([{
            id: `intro-${activeConvId}`,
            role: 'assistant',
            content: res.message,
            model_used: 'claude-haiku-4.5',
            cost_eur: null,
            tokens_input: null,
            tokens_output: null,
          }])
        }
      })
      .catch(() => {/* non-blocking */})
  }
})
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 3: Manual smoke test**

1. Start dev server: `pnpm dev`
2. Open a project → create new chat → navigate to it
3. Expected: Toro's intro message appears within ~2 seconds
4. Close and reopen the same chat
5. Expected: No second intro (introCheckedRef prevents repeat — note: resets on page reload, which is acceptable since empty-messages check also prevents re-firing on page reload once messages are DB-persisted)

> Note: The intro message is NOT saved to the DB — it disappears on reload. The next task could add persistence if needed, but the spec says "nur beim ersten Message in einem neuen Chat" which implies it's ephemeral.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add src/hooks/useWorkspaceState.ts && git commit -m "feat: trigger project-intro on empty project conversations"
```

---

## Phase B — Quick-Chips

### Task 3: API route `/api/chat/generate-chips`

**Files:**
- Create: `src/app/api/chat/generate-chips/route.ts`
- Create: `src/app/api/chat/generate-chips/chips-prompt.ts`

- [ ] **Step 1: Write failing test for chips prompt**

Create `src/app/api/chat/generate-chips/chips-prompt.unit.test.ts`:

```typescript
import { buildChipsPrompt, parseChipsResponse } from './chips-prompt'

describe('buildChipsPrompt', () => {
  it('includes truncated response in prompt', () => {
    const prompt = buildChipsPrompt('Hier sind 5 Newsletter-Ideen: 1. Tipp ...')
    expect(prompt).toContain('Newsletter')
  })

  it('truncates long responses to 500 chars', () => {
    const longText = 'a'.repeat(1000)
    const prompt = buildChipsPrompt(longText)
    expect(prompt).toContain('a'.repeat(500))
    expect(prompt).not.toContain('a'.repeat(501))
  })
})

describe('parseChipsResponse', () => {
  it('parses valid JSON chips', () => {
    const raw = '{"chips":[{"label":"Mehr Ideen","prompt":"Gib mir 5 weitere"},{"label":"Ausarbeiten","prompt":"Arbeite Idee 1 aus"}]}'
    const chips = parseChipsResponse(raw)
    expect(chips).toHaveLength(2)
    expect(chips[0].label).toBe('Mehr Ideen')
  })

  it('returns empty array on invalid JSON', () => {
    expect(parseChipsResponse('not json')).toEqual([])
  })

  it('caps at 4 chips', () => {
    const raw = JSON.stringify({ chips: Array(6).fill({ label: 'x', prompt: 'y' }) })
    expect(parseChipsResponse(raw)).toHaveLength(4)
  })

  it('filters chips with empty label or prompt', () => {
    const raw = JSON.stringify({ chips: [{ label: '', prompt: 'x' }, { label: 'ok', prompt: 'do it' }] })
    expect(parseChipsResponse(raw)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/timmr/tropenOS" && npx vitest run src/app/api/chat/generate-chips/chips-prompt.unit.test.ts 2>&1 | tail -10
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement chips-prompt helper**

Create `src/app/api/chat/generate-chips/chips-prompt.ts`:

> Note: `ChipItem` will be the canonical export from `src/lib/workspace-types.ts` (added in Task 4). Here we define a local-only type for this file; Task 4 will migrate to import from workspace-types.

```typescript
// Local type — replaced by workspace-types import in Task 4
interface ChipItem {
  label: string
  prompt: string
}

export function buildChipsPrompt(lastResponse: string): string {
  const truncated = lastResponse.slice(0, 500)
  return [
    'Du bist ein Assistent der kontextuelle Quick-Actions vorschlägt.',
    '',
    `Letzte Antwort (gekürzt):\n"""${truncated}"""`,
    '',
    'Schlage 3-4 sinnvolle nächste Aktionen vor. Antworte NUR mit validem JSON:',
    '{"chips":[{"label":"Kurzes Label (max 25 Zeichen)","prompt":"Vollständige Aufforderung die der User senden würde"}]}',
    '',
    'Chip-Typen je nach Kontext: Mehr davon | Vertiefen | Format ändern | Ausformulieren | Nächster Schritt | Hinterfragen',
    'Keine generischen Chips wie "Mehr Infos" — immer konkret zur Antwort.',
    'Antworte auf Deutsch. Nur JSON — kein Text davor oder danach.',
  ].join('\n')
}

export function parseChipsResponse(raw: string): ChipItem[] {
  try {
    const parsed = JSON.parse(raw) as { chips?: unknown }
    if (!Array.isArray(parsed.chips)) return []
    return (parsed.chips as ChipItem[])
      .filter(c => typeof c.label === 'string' && typeof c.prompt === 'string')
      .filter(c => c.label.trim().length > 0 && c.prompt.trim().length > 0)
      .slice(0, 4)
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "C:/Users/timmr/tropenOS" && npx vitest run src/app/api/chat/generate-chips/chips-prompt.unit.test.ts 2>&1 | tail -10
```
Expected: All PASS.

- [ ] **Step 5: Create API route**

Create `src/app/api/chat/generate-chips/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { modelFor } from '@/lib/model-selector'
import { buildChipsPrompt, parseChipsResponse } from './chips-prompt'
import { createLogger } from '@/lib/logger'

const log = createLogger('generate-chips')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let lastMessage: string
  try {
    const body = await req.json() as { lastMessage: string }
    lastMessage = body.lastMessage
    if (!lastMessage?.trim()) throw new Error('missing lastMessage')
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const { text } = await generateText({
      model: anthropic(modelFor('chips')),
      prompt: buildChipsPrompt(lastMessage),
      maxOutputTokens: 256,
    })
    const chips = parseChipsResponse(text)
    return NextResponse.json({ chips })
  } catch (err) {
    log.error('chips generation failed', { error: String(err) })
    return NextResponse.json({ chips: [] }) // graceful degradation — empty chips
  }
}
```

- [ ] **Step 6: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add src/app/api/chat/generate-chips/ && git commit -m "feat: add generate-chips API route with prompt + parser"
```

---

### Task 4: Chips state + trigger in workspace-types and workspace-chat

**Files:**
- Modify: `src/lib/workspace-types.ts`
- Modify: `src/hooks/useWorkspaceState.ts`
- Modify: `src/lib/workspace-chat.ts`

- [ ] **Step 1: Export ChipItem from workspace-types**

In `src/lib/workspace-types.ts`, add after the `ChatMessage` interface:

```typescript
export interface ChipItem {
  label: string
  prompt: string
}
```

Also update `src/app/api/chat/generate-chips/chips-prompt.ts` to import from workspace-types instead of the local definition:
```typescript
// Remove the local ChipItem definition and replace with:
import type { ChipItem } from '@/lib/workspace-types'
```
(Note: `parseChipsResponse` returns `ChipItem[]`, so update its return type annotation too.)

And add these two fields to the `WorkspaceState` interface (after `memoryExtracting: boolean`):

```typescript
chips: ChipItem[]
setChips: React.Dispatch<React.SetStateAction<ChipItem[]>>
promptBuilderOpen: boolean
setPromptBuilderOpen: React.Dispatch<React.SetStateAction<boolean>>
```

- [ ] **Step 2: Add chips state to useWorkspaceState**

In `src/hooks/useWorkspaceState.ts`, add after the `memoryExtracting` state:

```typescript
const [chips, setChips] = useState<ChipItem[]>([])
const [promptBuilderOpen, setPromptBuilderOpen] = useState(false)
```

Also import `ChipItem` at the top:

```typescript
import type { ..., ChipItem } from '@/lib/workspace-types'
```

Add `chips, setChips, promptBuilderOpen, setPromptBuilderOpen` to the returned state object (near the end of the hook, where all other state is spread).

- [ ] **Step 3: Fire generate-chips after stream ends**

In `src/lib/workspace-chat.ts`, in the `sendMessage` function, add to the `ChatActionsCtx` interface:

```typescript
setChips: React.Dispatch<React.SetStateAction<ChipItem[]>>
```

Import `ChipItem` at the top:
```typescript
import type { ..., ChipItem } from './workspace-types'
```

**At the start of `sendMessage`**, before the fetch, add two things:
1. Declare an accumulator: `let accumulatedContent = ''`
2. Clear chips from previous response: `ctx.setChips([])`

**In the streaming chunk handler** (where `parsed.type === 'chunk'`), append to the accumulator:
```typescript
accumulatedContent += parsed.content
```

**After the `parsed.type === 'done'` block**, fire chips generation using the accumulator:
```typescript
// Fire-and-forget chips generation
if (accumulatedContent.trim().length > 20) {
  fetch('/api/chat/generate-chips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastMessage: accumulatedContent }),
  })
    .then(r => r.ok ? r.json() as Promise<{ chips: ChipItem[] }> : null)
    .then(res => { if (res?.chips?.length) ctx.setChips(res.chips) })
    .catch(() => {/* non-blocking */})
}
```

> The accumulator pattern avoids race conditions with React state — `accumulatedContent` is a plain closure variable that is fully populated by the time `done` fires.

- [ ] **Step 4: Pass setChips through createChatActions call**

In `useWorkspaceState.ts`, the `createChatActions` call needs `setChips` passed through the context. Add it to the ctx object passed to `createChatActions`.

- [ ] **Step 5: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -30
```
Fix any type errors. Common issue: `setChips` missing from the `ChatActionsCtx` passed in `useWorkspaceState`.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add src/lib/workspace-types.ts src/hooks/useWorkspaceState.ts src/lib/workspace-chat.ts && git commit -m "feat: chips state + post-stream generate-chips trigger"
```

---

### Task 5: QuickChips UI component + ChatArea integration

**Files:**
- Create: `src/components/workspace/QuickChips.tsx`
- Modify: `src/components/workspace/ChatArea.tsx`

- [ ] **Step 1: Create QuickChips component**

Create `src/components/workspace/QuickChips.tsx`:

```typescript
'use client'

import type { ChipItem } from '@/lib/workspace-types'

interface QuickChipsProps {
  chips: ChipItem[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export default function QuickChips({ chips, onSelect, disabled }: QuickChipsProps) {
  if (chips.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      padding: '8px 16px 4px',
    }}>
      {chips.map((chip, i) => (
        <button
          key={i}
          className="chip"
          onClick={() => onSelect(chip.prompt)}
          disabled={disabled}
          style={{ cursor: disabled ? 'default' : 'pointer' }}
          title={chip.prompt}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Integrate QuickChips into ChatArea**

In `src/components/workspace/ChatArea.tsx`:

1. Import `QuickChips`:
```typescript
import QuickChips from './QuickChips'
```

2. Add `chips`, `setChips`, `promptBuilderOpen`, `setPromptBuilderOpen` to `ChatAreaProps` interface (matching WorkspaceState).

3. In the JSX, after the `</div>` that closes `carea-messages` and before the routing meta div, add:

```tsx
<QuickChips
  chips={chips}
  onSelect={(prompt) => {
    onSetInput(prompt)
    // Auto-submit: create a synthetic form event
    onSendMessage({ preventDefault: () => {} } as React.FormEvent)
  }}
  disabled={sending}
/>
```

4. Pass `chips`, `setChips`, `promptBuilderOpen`, `setPromptBuilderOpen` from `WorkspaceLayout` → `ChatArea`. Update `WorkspaceLayout.tsx` to destructure and pass these props.

- [ ] **Step 3: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -30
```
Expected: No errors.

- [ ] **Step 4: Manual smoke test**

1. Start dev server: `pnpm dev`
2. Send a message to Toro (any chat)
3. Expected: 3-4 chips appear below the response within ~1-2 seconds
4. Click a chip
5. Expected: The chip's prompt is sent as a user message; chips disappear while sending

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add src/components/workspace/QuickChips.tsx src/components/workspace/ChatArea.tsx src/components/workspace/WorkspaceLayout.tsx && git commit -m "feat: QuickChips UI — action chips appear after each Toro response"
```

---

## Phase C — Prompt-Builder

### Task 6: DB migration + API route

**Files:**
- Create: `supabase/migrations/20260320000061_chat_prompt_builder.sql`
- Create: `src/app/api/chat/prompt-builder/route.ts`
- Create: `src/app/api/chat/prompt-builder/builder-prompt.ts`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/20260320000061_chat_prompt_builder.sql`:

```sql
-- 20260320000061_chat_prompt_builder.sql
-- Plan L: Add prompt_builder conversation type

-- Drop existing CHECK constraint and re-add with prompt_builder
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_conversation_type_check
  CHECK (conversation_type IN (
    'chat',
    'workspace_briefing',
    'workspace_silo',
    'workspace_card',
    'prompt_builder'
  ));
```

- [ ] **Step 2: Push migration**

```bash
cd "C:/Users/timmr/tropenOS" && supabase db push
```
Expected: Migration applied successfully.

- [ ] **Step 3: Write failing test for builder prompt**

Create `src/app/api/chat/prompt-builder/builder-prompt.unit.test.ts`:

```typescript
import { buildBuilderStep } from './builder-prompt'

describe('buildBuilderStep', () => {
  it('builds initial step with empty history', () => {
    const result = buildBuilderStep({
      originalPrompt: 'Schreib einen Newsletter',
      history: [],
    })
    expect(result).toContain('Newsletter')
    expect(result).toContain('Ergebnis')
  })

  it('includes conversation history in step 2+', () => {
    const result = buildBuilderStep({
      originalPrompt: 'Schreib einen Newsletter',
      history: [
        { role: 'assistant', content: 'Was genau soll das Ergebnis sein?' },
        { role: 'user', content: 'Ein E-Mail-Text für Bestandskunden' },
      ],
    })
    expect(result).toContain('Bestandskunden')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd "C:/Users/timmr/tropenOS" && npx vitest run src/app/api/chat/prompt-builder/builder-prompt.unit.test.ts 2>&1 | tail -10
```
Expected: FAIL — module not found.

- [ ] **Step 5: Implement builder-prompt helper**

Create `src/app/api/chat/prompt-builder/builder-prompt.ts`:

```typescript
interface BuilderStep {
  originalPrompt: string
  history: Array<{ role: string; content: string }>
}

export function buildBuilderStep({ originalPrompt, history }: BuilderStep): string {
  const isFirst = history.length === 0

  if (isFirst) {
    return [
      'Du bist ein Experte für präzise KI-Prompts.',
      `Nutzer-Anfrage: "${originalPrompt}"`,
      '',
      'Stelle genau EINE Frage um die Anfrage zu präzisieren.',
      'Frag nach: Was soll das Ergebnis sein? (Dokument, Liste, Analyse, Text?)',
      'Kurz und direkt. Auf Deutsch.',
    ].join('\n')
  }

  const historyText = history
    .map(m => `${m.role === 'user' ? 'Nutzer' : 'Toro'}: ${m.content}`)
    .join('\n')

  const turnCount = history.filter(m => m.role === 'user').length

  if (turnCount >= 2) {
    return [
      'Du bist ein Experte für präzise KI-Prompts.',
      `Original: "${originalPrompt}"`,
      '',
      'Bisheriges Gespräch:',
      historyText,
      '',
      'Erstelle jetzt den finalen, präzisen Prompt. Format:',
      '{"type":"final","prompt":"[vollständiger optimierter Prompt]"}',
      'Nur JSON — kein Text.',
    ].join('\n')
  }

  return [
    'Du bist ein Experte für präzise KI-Prompts.',
    `Original: "${originalPrompt}"`,
    '',
    'Bisheriges Gespräch:',
    historyText,
    '',
    'Stelle noch genau EINE weitere Frage oder erstelle den finalen Prompt wenn du genug Kontext hast.',
    'Für weitere Frage: normaler Text.',
    'Für finalen Prompt: {"type":"final","prompt":"[vollständiger Prompt]"}',
  ].join('\n')
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd "C:/Users/timmr/tropenOS" && npx vitest run src/app/api/chat/prompt-builder/builder-prompt.unit.test.ts 2>&1 | tail -10
```
Expected: All PASS.

- [ ] **Step 7: Create API route**

Create `src/app/api/chat/prompt-builder/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { modelFor } from '@/lib/model-selector'
import { buildBuilderStep } from './builder-prompt'
import { createLogger } from '@/lib/logger'

const log = createLogger('prompt-builder')

interface BuilderMessage { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let originalPrompt: string
  let history: BuilderMessage[]
  try {
    const body = await req.json() as { originalPrompt: string; history: BuilderMessage[] }
    originalPrompt = body.originalPrompt
    history = body.history ?? []
    if (!originalPrompt?.trim()) throw new Error('missing originalPrompt')
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const prompt = buildBuilderStep({ originalPrompt, history })

  try {
    const { text } = await generateText({
      model: anthropic(modelFor('prompt_builder')),
      prompt,
      maxOutputTokens: 512,
    })

    // Check if this is a final prompt response
    try {
      const parsed = JSON.parse(text) as { type?: string; prompt?: string }
      if (parsed.type === 'final' && parsed.prompt) {
        return NextResponse.json({ type: 'final', refinedPrompt: parsed.prompt })
      }
    } catch {
      // Not JSON — it's a clarifying question
    }

    return NextResponse.json({ type: 'question', message: text })
  } catch (err) {
    log.error('prompt-builder step failed', { error: String(err) })
    return NextResponse.json({ error: 'Step failed' }, { status: 500 })
  }
}
```

- [ ] **Step 8: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add supabase/migrations/20260320000061_chat_prompt_builder.sql src/app/api/chat/prompt-builder/ && git commit -m "feat: prompt-builder API route + migration for conversation_type"
```

---

### Task 7: PromptBuilderModal component

**Files:**
- Create: `src/components/workspace/PromptBuilderModal.tsx`

- [ ] **Step 1: Create modal component**

Create `src/components/workspace/PromptBuilderModal.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { X, ArrowRight, Sparkle } from '@phosphor-icons/react'

interface BuilderMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PromptBuilderModalProps {
  open: boolean
  originalPrompt: string
  onClose: () => void
  onAccept: (refinedPrompt: string) => void
}

export default function PromptBuilderModal({
  open,
  originalPrompt,
  onClose,
  onAccept,
}: PromptBuilderModalProps) {
  const [history, setHistory] = useState<BuilderMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [input, setInput] = useState('')
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null)

  async function runStep(userAnswer?: string) {
    const newHistory = userAnswer
      ? [...history, { role: 'user' as const, content: userAnswer }]
      : history

    setHistory(newHistory)
    setLoading(true)

    try {
      const res = await fetch('/api/chat/prompt-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt, history: newHistory }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json() as
        | { type: 'question'; message: string }
        | { type: 'final'; refinedPrompt: string }

      if (data.type === 'final') {
        setFinalPrompt(data.refinedPrompt)
      } else {
        setHistory(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler. Versuche es erneut.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    setStarted(true)
    runStep()
  }

  function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const answer = input.trim()
    setInput('')
    runStep(answer)
  }

  function handleAccept() {
    if (finalPrompt) {
      onAccept(finalPrompt)
      handleClose()
    }
  }

  function handleClose() {
    setHistory([])
    setStarted(false)
    setInput('')
    setFinalPrompt(null)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Prompt verfeinern"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, 90vw)',
          background: 'var(--bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: 24,
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkle size={18} color="var(--accent)" weight="fill" aria-hidden="true" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              Prompt verfeinern
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClose}
            aria-label="Schließen"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Original prompt */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-base)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          {originalPrompt}
        </div>

        {/* Conversation */}
        {history.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflowY: 'auto',
            maxHeight: 240,
          }}>
            {history.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--active-bg)' : 'var(--bg-base)',
                  color: msg.role === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  maxWidth: '85%',
                }}
              >
                {msg.content}
              </div>
            ))}
          </div>
        )}

        {/* Final prompt result */}
        {finalPrompt && (
          <div style={{
            padding: '12px 14px',
            background: 'var(--accent-light)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text-primary)',
            border: '1px solid var(--accent)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: 4 }}>
              VERFEINERTER PROMPT
            </span>
            {finalPrompt}
          </div>
        )}

        {/* Actions */}
        {!started && (
          <button className="btn btn-primary" onClick={handleStart}>
            <Sparkle size={14} weight="fill" /> Verfeinern starten
          </button>
        )}

        {started && !finalPrompt && (
          <form onSubmit={handleAnswer} style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={loading ? 'Toro denkt…' : 'Deine Antwort…'}
              disabled={loading}
              autoFocus
              style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || !input.trim()}
              aria-label="Senden"
            >
              <ArrowRight size={14} weight="bold" />
            </button>
          </form>
        )}

        {finalPrompt && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleClose} style={{ flex: 1 }}>
              Abbrechen
            </button>
            <button className="btn btn-primary" onClick={handleAccept} style={{ flex: 1 }}>
              Prompt verwenden
            </button>
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add src/components/workspace/PromptBuilderModal.tsx && git commit -m "feat: PromptBuilderModal — guided prompt refinement dialog"
```

---

### Task 8: Wire Prompt-Builder into ChatArea

**Files:**
- Modify: `src/components/workspace/ChatArea.tsx`
- Modify: `src/components/workspace/QuickChips.tsx`

- [ ] **Step 1: Add always-present Prompt-Builder chip to QuickChips**

In `QuickChips.tsx`, add a "Prompt verfeinern" chip that is always shown when there are chips (it's added to the rendered list separately, NOT generated by the AI):

Actually — the spec says "Ein spezieller Chip der immer verfügbar ist". The simplest approach: in `ChatArea.tsx`, always append a `{ label: 'Prompt verfeinern', prompt: '__prompt_builder__' }` sentinel to the chips array before rendering. When `onSelect` receives `__prompt_builder__`, open the modal instead of sending.

> Design system rule: Chips contain only text — no icons, no emoji (`CLAUDE.md: "Chips: nur Text, KEINE Icons in Chips"`). The label must be plain text only.

In `ChatArea.tsx`, modify the `onSelect` handler:

```tsx
<QuickChips
  chips={[...chips, { label: 'Prompt verfeinern', prompt: '__prompt_builder__' }]}
  onSelect={(prompt) => {
    if (prompt === '__prompt_builder__') {
      setPromptBuilderOpen(true)
      return
    }
    onSetInput(prompt)
    onSendMessage({ preventDefault: () => {} } as React.FormEvent)
  }}
  disabled={sending}
/>
```

- [ ] **Step 2: Add PromptBuilderModal to ChatArea**

Import and render `PromptBuilderModal` in `ChatArea.tsx`:

```typescript
import PromptBuilderModal from './PromptBuilderModal'
```

Render below `ShareModal`:
```tsx
<PromptBuilderModal
  open={promptBuilderOpen}
  originalPrompt={input}
  onClose={() => setPromptBuilderOpen(false)}
  onAccept={(refined) => {
    onSetInput(refined)
    setPromptBuilderOpen(false)
  }}
/>
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd "C:/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

- [ ] **Step 4: Manual smoke test — full flow**

1. Start dev server: `pnpm dev`
2. Send a message → wait for chips to appear
3. Click "Prompt verfeinern"
4. Expected: modal opens, shows original prompt
5. Click "Verfeinern starten" → Toro asks one clarifying question
6. Type an answer → Toro asks another or shows final prompt
7. Click "Prompt verwenden" → modal closes, refined prompt appears in input

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/timmr/tropenOS" && git add src/components/workspace/ChatArea.tsx src/components/workspace/QuickChips.tsx && git commit -m "feat: wire Prompt-Builder chip + modal into ChatArea"
```

---

## Final Checks

- [ ] **TypeScript:** `npx tsc --noEmit` — zero errors
- [ ] **Lint:** `node scripts/ci/lint-design-system.mjs` — zero design system violations
- [ ] **Tests:** `npx vitest run` — all unit tests pass
- [ ] **Smoke test Projekt-Einstieg:** New chat in project → intro message appears
- [ ] **Smoke test Chips:** Send message → chips appear ~1-2s later → chip click sends message
- [ ] **Smoke test Prompt-Builder:** Chips → "Prompt verfeinern" → dialog → refined prompt in input

## Update CLAUDE.md after completion

Add to "Letzte relevante Migrationen":
```
| 20260320000061_chat_prompt_builder.sql | conversations: 'prompt_builder' added to conversation_type CHECK |
```

Add to Feature-Dokumentation section or feature-registry.md:
- Projekt-Einstieg: `/api/chat/project-intro` — einmalig pro neuem Projekt-Chat, Haiku, lädt project_memory
- Quick-Chips: `/api/chat/generate-chips` — fire-and-forget nach Stream-Ende, 3-4 Chips als JSON
- Prompt-Builder: `/api/chat/prompt-builder` — max 2 Fragen, dann finaler Prompt, conversation_type 'prompt_builder'
