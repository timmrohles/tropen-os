# AI SDK Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct `@anthropic-ai/sdk` usage across 10 files with AI SDK (`ai` + `@ai-sdk/anthropic`) to achieve model-agnosticism (Principle #1: kein Lock-in auf ein Modell).

**Architecture:** Create a single shared provider at `src/lib/llm/anthropic.ts`, then migrate all callers to `generateText` (non-streaming) or `streamText` (streaming). Token usage field names change (`input_tokens` → `promptTokens`, `output_tokens` → `completionTokens`). No functional changes to streaming behaviour or DB writes.

**Tech Stack:** `ai` ^4.x, `@ai-sdk/anthropic` ^1.x, TypeScript, pnpm

### Why `@ai-sdk/anthropic` and not Vercel AI Gateway

A post-validation hook recommends routing through the Vercel AI Gateway with OIDC auth instead of `ANTHROPIC_API_KEY`. That recommendation is valid for Vercel-hosted projects, but Tropen OS is **not yet configured for Vercel deployment** (no `vercel link`, no OIDC token). Migrating to Gateway requires:

1. Vercel project linking (`vercel link`)
2. AI Gateway enabled in Vercel dashboard
3. `vercel env pull` to provision `VERCEL_OIDC_TOKEN`
4. Replacing `@ai-sdk/anthropic` with `@ai-sdk/gateway` and model string format `'anthropic/claude-sonnet-4.6'`

This is tracked as a future step. **Today's plan** delivers the first 80%: abstracting all AI calls behind AI SDK so that swapping from `@ai-sdk/anthropic` to `@ai-sdk/gateway` later is a one-file change in `src/lib/llm/anthropic.ts`.

### Model ID format note

The hook suggests using dots (e.g. `claude-sonnet-4.6`). The Anthropic provider for AI SDK uses the **exact Anthropic API model IDs with hyphens** (e.g. `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`) — these are what the existing codebase already uses. When/if we switch to AI Gateway the format changes to `'anthropic/claude-sonnet-4.6'` — that is a one-line change per call site.

---

## File Map

| Status | File | Change |
|--------|------|--------|
| Create | `src/lib/llm/anthropic.ts` | Shared provider (replaces all `new Anthropic()` instances) |
| Modify | `src/actions/chat.ts` | `messages.create` → `generateText` |
| Modify | `src/actions/chat-stream.ts` | `messages.stream` → `streamText` |
| Modify | `src/app/api/chat/stream/route.ts` | `messages.stream` → `streamText` |
| Modify | `src/app/api/projects/[id]/memory/summary/route.ts` | `messages.create` → `generateText` |
| Modify | `src/app/api/transformations/analyze/route.ts` | `messages.create` → `generateText` |
| Modify | `src/app/api/workspaces/[id]/briefing/route.ts` | `messages.create` → `generateText` |
| Modify | `src/app/api/workspaces/[id]/chat/route.ts` | `messages.create` → `generateText` |
| Modify | `src/lib/agent-engine.ts` | `messages.create` → `generateText` (dynamic model) |
| Modify | `src/lib/feeds/pipeline.ts` | `messages.create` → `generateText` (lazy-init, cost tracking) |
| Modify | `src/lib/workspace/briefing.ts` | `messages.create` → `generateText` |
| Modify | `package.json` | add `ai`, `@ai-sdk/anthropic`; remove `@anthropic-ai/sdk` |
| Modify | `CLAUDE.md` | Update AI-Modelle section to reflect new SDK |

---

## API Cheat Sheet (memorise before starting)

```typescript
// BEFORE (Anthropic SDK)
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const response = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',
  system: 'System prompt',
  messages: [{ role: 'user', content: 'Hello' }],
  max_tokens: 300,
})
const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
const tokensIn = response.usage.input_tokens
const tokensOut = response.usage.output_tokens

// AFTER (AI SDK)
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
const { text, usage } = await generateText({
  model: anthropic('claude-haiku-4-5-20251001'),
  system: 'System prompt',
  messages: [{ role: 'user', content: 'Hello' }],
  maxTokens: 300,
})
const tokensIn = usage.promptTokens
const tokensOut = usage.completionTokens
```

```typescript
// BEFORE (streaming — Anthropic SDK)
const stream = client.messages.stream({ model, system, messages, max_tokens: 2048 })
for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    controller.enqueue(encoder.encode(event.delta.text))
  }
}
const finalMessage = await stream.finalMessage()
const tokensIn = finalMessage.usage?.input_tokens ?? null
const tokensOut = finalMessage.usage?.output_tokens ?? null

// AFTER (streaming — AI SDK)
import { streamText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
const result = streamText({ model: anthropic(modelId), system, messages, maxTokens: 2048 })
for await (const chunk of result.textStream) {
  controller.enqueue(encoder.encode(chunk))
}
const usage = await result.usage
const tokensIn = usage.promptTokens
const tokensOut = usage.completionTokens
```

---

## Task 1: Install Packages + Create Shared Provider

**Files:**
- Modify: `package.json`
- Create: `src/lib/llm/anthropic.ts`
- Create: `src/lib/llm/anthropic.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/llm/anthropic.test.ts
import { describe, it, expect } from 'vitest'

describe('anthropic provider', () => {
  it('exports an anthropic function', async () => {
    const { anthropic } = await import('./anthropic')
    expect(typeof anthropic).toBe('function')
  })

  it('returns a model when called with a model ID', async () => {
    const { anthropic } = await import('./anthropic')
    const model = anthropic('claude-haiku-4-5-20251001')
    expect(model).toBeDefined()
    expect(typeof model).toBe('object')
  })
})
```

Run: `pnpm test src/lib/llm/anthropic.test.ts`
Expected: FAIL — module not found

- [ ] **Step 2: Install packages**

```bash
cd "C:/Users/timmr/tropenOS"
pnpm add ai @ai-sdk/anthropic
```

Expected: packages installed, `ai` and `@ai-sdk/anthropic` appear in `package.json` dependencies.

- [ ] **Step 3: Create the shared provider**

```typescript
// src/lib/llm/anthropic.ts
import { createAnthropic } from '@ai-sdk/anthropic'

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/llm/anthropic.test.ts`
Expected: PASS

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: no new errors from the new file

- [ ] **Step 6: Commit**

```bash
git add src/lib/llm/anthropic.ts src/lib/llm/anthropic.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add AI SDK provider + shared anthropic instance"
```

---

## Task 2: Migrate Simple Non-Streaming API Routes (4 files)

The four simplest files — all call `messages.create` with no streaming, no lazy-init, no cost tracking. Migrate all four in one task since they're mechanical and low-risk.

**Files:**
- Modify: `src/app/api/projects/[id]/memory/summary/route.ts`
- Modify: `src/app/api/transformations/analyze/route.ts`
- Modify: `src/app/api/workspaces/[id]/briefing/route.ts`
- Modify: `src/app/api/workspaces/[id]/chat/route.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/app/api/projects/[id]/memory/summary/route.test.ts
import { describe, it, vi, expect } from 'vitest'

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: '[Erkenntnis] Test summary',
    usage: { promptTokens: 100, completionTokens: 50 },
  }),
}))

describe('memory summary route', () => {
  it('does not import @anthropic-ai/sdk', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('./src/app/api/projects/[id]/memory/summary/route.ts', 'utf8')
    )
    expect(source).not.toContain('@anthropic-ai/sdk')
    expect(source).toContain('@/lib/llm/anthropic')
  })
})
```

Run: `pnpm test src/app/api/projects`
Expected: FAIL — still contains `@anthropic-ai/sdk`

- [ ] **Step 2: Migrate `memory/summary/route.ts`**

Replace:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```
With:
```typescript
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

Replace the `anthropic.messages.create(...)` call:
```typescript
// BEFORE
const response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 400,
  messages: [{ role: 'user', content: `Analysiere...${convText}` }],
})
const firstBlock = response.content[0]
if (!firstBlock || firstBlock.type !== 'text')
  return NextResponse.json({ error: 'AI-Zusammenfassung fehlgeschlagen' }, { status: 500 })
const summary = firstBlock.text.trim()

// AFTER
const { text: summary } = await generateText({
  model: anthropic('claude-haiku-4-5-20251001'),
  maxTokens: 400,
  messages: [{ role: 'user', content: `Analysiere...${convText}` }],
})
if (!summary)
  return NextResponse.json({ error: 'AI-Zusammenfassung fehlgeschlagen' }, { status: 500 })
```

- [ ] **Step 3: Migrate `transformations/analyze/route.ts`**

Replace:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```
With:
```typescript
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

Replace the `anthropic.messages.create(...)` call:
```typescript
// BEFORE
const msg = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 512,
  messages: [{ role: 'user', content: prompt }],
})
const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'

// AFTER
const { text: raw } = await generateText({
  model: anthropic('claude-haiku-4-5-20251001'),
  maxTokens: 512,
  messages: [{ role: 'user', content: prompt }],
})
```

- [ ] **Step 4: Migrate `workspaces/[id]/briefing/route.ts`**

Replace:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```
With:
```typescript
import { generateText } from 'ai'
import { anthropic as anthropicProvider } from '@/lib/llm/anthropic'
```

> Note: use alias `anthropicProvider` because the route already has a local `briefingProposalSchema` and a `const log` — avoid naming collision with any variable named `anthropic`.

Replace the `anthropic.messages.create(...)` call:
```typescript
// BEFORE
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: BRIEFING_SYSTEM,
  messages: [...body.history.map(...), { role: 'user', content: body.message }],
})
const content = response.content[0].type === 'text' ? response.content[0].text : ''
const tokenUsage = { input: response.usage.input_tokens, output: response.usage.output_tokens }

// AFTER
const { text: content, usage } = await generateText({
  model: anthropicProvider('claude-sonnet-4-6'),
  maxTokens: 1024,
  system: BRIEFING_SYSTEM,
  messages: [...body.history.map(...), { role: 'user', content: body.message }],
})
const tokenUsage = { input: usage.promptTokens, output: usage.completionTokens }
```

- [ ] **Step 5: Migrate `workspaces/[id]/chat/route.ts`**

Replace:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```
With:
```typescript
import { generateText } from 'ai'
import { anthropic as anthropicProvider } from '@/lib/llm/anthropic'
```

Replace the `anthropic.messages.create(...)` call:
```typescript
// BEFORE
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  system: systemPrompt,
  messages: [...history, { role: 'user', content: body.content }],
})
assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
tokenUsage = { input: response.usage.input_tokens, output: response.usage.output_tokens }

// AFTER
const { text, usage } = await generateText({
  model: anthropicProvider('claude-sonnet-4-6'),
  maxTokens: 2048,
  system: systemPrompt,
  messages: [...history, { role: 'user', content: body.content }],
})
assistantContent = text
tokenUsage = { input: usage.promptTokens, output: usage.completionTokens }
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: no errors in any of the 4 modified files

- [ ] **Step 7: Run test to verify**

Run: `pnpm test src/app/api`
Expected: PASS (or no relevant failures)

- [ ] **Step 8: Commit**

```bash
git add src/app/api/projects/\[id\]/memory/summary/route.ts \
        src/app/api/transformations/analyze/route.ts \
        src/app/api/workspaces/\[id\]/briefing/route.ts \
        src/app/api/workspaces/\[id\]/chat/route.ts
git commit -m "migrate: api routes to AI SDK generateText (memory, transformations, briefing, chat)"
```

---

## Task 3: Migrate Non-Streaming Lib + Actions (3 files)

These three files have more complex patterns: `chat.ts` has validation + mapping logic around the AI call, `workspace/briefing.ts` has JSON extraction fallback, `agent-engine.ts` uses a dynamic model string.

**Files:**
- Modify: `src/actions/chat.ts`
- Modify: `src/lib/workspace/briefing.ts`
- Modify: `src/lib/agent-engine.ts`

- [ ] **Step 1: Write failing test for agent-engine (dynamic model is the tricky part)**

```typescript
// src/lib/agent-engine.test.ts
import { describe, it, vi, expect } from 'vitest'

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'Test output',
    usage: { promptTokens: 100, completionTokens: 50 },
  }),
}))

describe('agent-engine migration', () => {
  it('does not import @anthropic-ai/sdk', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('./src/lib/agent-engine.ts', 'utf8')
    )
    expect(source).not.toContain('@anthropic-ai/sdk')
    expect(source).toContain('@/lib/llm/anthropic')
  })
})
```

Run: `pnpm test src/lib/agent-engine.test.ts`
Expected: FAIL

- [ ] **Step 2: Migrate `src/actions/chat.ts`**

Replace:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```
With:
```typescript
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

Replace the `anthropic.messages.create(...)` call in `sendMessage()`:
```typescript
// BEFORE
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  system: systemPrompt,
  messages: apiMessages,
  max_tokens: 2048,
})
const assistantText = response.content
  .filter((block) => block.type === 'text')
  .map((block) => (block as { type: 'text'; text: string }).text)
  .join('')
const tokensInput = response.usage?.input_tokens ?? null
const tokensOutput = response.usage?.output_tokens ?? null

// AFTER
const { text: assistantText, usage } = await generateText({
  model: anthropic('claude-sonnet-4-6'),
  system: systemPrompt,
  messages: apiMessages,
  maxTokens: 2048,
})
const tokensInput = usage.promptTokens ?? null
const tokensOutput = usage.completionTokens ?? null
```

- [ ] **Step 3: Migrate `src/lib/workspace/briefing.ts`**

Replace:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```
With:
```typescript
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

Replace the `anthropic.messages.create(...)` call:
```typescript
// BEFORE
response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  system: `Du bist Toro...`,
  messages: [{ role: 'user', content: userPrompt }],
})
// ...
const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

// AFTER
const { text } = await generateText({
  model: anthropic('claude-haiku-4-5-20251001'),
  maxTokens: 1024,
  system: `Du bist Toro...`,
  messages: [{ role: 'user', content: userPrompt }],
})
```

Remove the `let response` declaration and the surrounding try/catch for the API call — simplify to:
```typescript
export async function generateCardSuggestions(
  input: BriefingInput,
): Promise<CardSuggestion[]> {
  const userPrompt = `Ziel: ${input.goal}\n...`

  let text: string
  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      maxTokens: 1024,
      system: `Du bist Toro...`,
      messages: [{ role: 'user', content: userPrompt }],
    })
    text = result.text.trim()
  } catch (apiErr) {
    log.error('[briefing] AI SDK error:', apiErr)
    throw apiErr
  }

  // JSON extraction fallback (unchanged)
  const validate = (arr: unknown[]): CardSuggestion[] => ...
  try {
    return validate(JSON.parse(text) as unknown[])
  } catch { /* fall through */ }
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    try { return validate(JSON.parse(match[0]) as unknown[]) } catch { /* fall through */ }
  }
  log.error('[briefing] Could not parse JSON. Raw text:', text)
  return []
}
```

- [ ] **Step 4: Migrate `src/lib/agent-engine.ts`**

Remove:
```typescript
import Anthropic from '@anthropic-ai/sdk'
function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}
```

Add:
```typescript
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

Replace `executeStep()` body:
```typescript
// BEFORE
const client = getAnthropicClient()
// ...
const response = await client.messages.create({
  model,
  max_tokens: 2048,
  system: systemPrompt,
  messages: [{ role: 'user', content: userContent }],
})
const text = response.content
  .filter((b) => b.type === 'text')
  .map((b) => (b as { type: 'text'; text: string }).text)
  .join('\n')
return {
  success: true,
  output: text,
  tokenUsage: {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  },
}

// AFTER
const { text, usage } = await generateText({
  model: anthropic(model),
  maxTokens: 2048,
  system: systemPrompt,
  messages: [{ role: 'user', content: userContent }],
})
return {
  success: true,
  output: text,
  tokenUsage: {
    input_tokens: usage.promptTokens,
    output_tokens: usage.completionTokens,
  },
}
```

> Note: `StepResult` interface uses `input_tokens` / `output_tokens` in `tokenUsage` — keep these field names unchanged since they're consumed by `executeAgentSteps()` cost calculation.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 6: Run tests**

Run: `pnpm test src/lib/agent-engine.test.ts src/lib/workspace`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/actions/chat.ts src/lib/workspace/briefing.ts src/lib/agent-engine.ts
git commit -m "migrate: actions + lib to AI SDK generateText (chat, briefing, agent-engine)"
```

---

## Task 4: Migrate Streaming Files (2 files)

These are the most critical files — they power the live chat experience. The streaming API changes from event-iteration to `textStream` iteration. **Do not break the accumulation pattern** (for DB save) or the token tracking.

**Files:**
- Modify: `src/actions/chat-stream.ts`
- Modify: `src/app/api/chat/stream/route.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/actions/chat-stream.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

describe('chat-stream migration', () => {
  it('does not import @anthropic-ai/sdk', () => {
    const source = readFileSync('./src/actions/chat-stream.ts', 'utf8')
    expect(source).not.toContain('@anthropic-ai/sdk')
    expect(source).toContain('streamText')
    expect(source).toContain('@/lib/llm/anthropic')
  })

  it('api/chat/stream/route.ts does not import @anthropic-ai/sdk', () => {
    const source = readFileSync('./src/app/api/chat/stream/route.ts', 'utf8')
    expect(source).not.toContain('@anthropic-ai/sdk')
    expect(source).toContain('streamText')
  })
})
```

Run: `pnpm test src/actions/chat-stream.test.ts`
Expected: FAIL

- [ ] **Step 2: Migrate `src/actions/chat-stream.ts`**

Replace imports at top:
```typescript
// REMOVE:
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ADD:
import { streamText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

Replace the streaming block inside `ReadableStream.start()`:
```typescript
// BEFORE
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  system: systemPrompt,
  messages: apiMessages,
  max_tokens: 2048,
})

for await (const event of stream) {
  if (
    event.type === 'content_block_delta' &&
    event.delta.type === 'text_delta'
  ) {
    const chunk = event.delta.text
    accumulatedText += chunk
    controller.enqueue(new TextEncoder().encode(chunk))
  }
}

const finalMessage = await stream.finalMessage()
tokensInput = finalMessage.usage?.input_tokens ?? null
tokensOutput = finalMessage.usage?.output_tokens ?? null

// AFTER
const result = streamText({
  model: anthropic('claude-sonnet-4-6'),
  system: systemPrompt,
  messages: apiMessages,
  maxTokens: 2048,
})

for await (const chunk of result.textStream) {
  accumulatedText += chunk
  controller.enqueue(new TextEncoder().encode(chunk))
}

const usage = await result.usage
tokensInput = usage.promptTokens ?? null
tokensOutput = usage.completionTokens ?? null
```

- [ ] **Step 3: Migrate `src/app/api/chat/stream/route.ts`**

Replace imports at top:
```typescript
// REMOVE:
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ADD:
import { streamText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

Replace the streaming block inside `ReadableStream.start()`:
```typescript
// BEFORE
const stream = anthropic.messages.stream({
  model: modelId,
  system: systemPrompt,
  messages: apiMessages,
  max_tokens: 2048,
})

for await (const event of stream) {
  if (
    event.type === 'content_block_delta' &&
    event.delta.type === 'text_delta'
  ) {
    const chunk = event.delta.text
    accumulatedText += chunk
    controller.enqueue(encoder.encode(chunk))
  }
}

const finalMessage = await stream.finalMessage()
tokensInput = finalMessage.usage?.input_tokens ?? null
tokensOutput = finalMessage.usage?.output_tokens ?? null

// AFTER
const result = streamText({
  model: anthropic(modelId),
  system: systemPrompt,
  messages: apiMessages,
  maxTokens: 2048,
})

for await (const chunk of result.textStream) {
  accumulatedText += chunk
  controller.enqueue(encoder.encode(chunk))
}

const usage = await result.usage
tokensInput = usage.promptTokens ?? null
tokensOutput = usage.completionTokens ?? null
```

> Note: `modelId` is determined earlier in the route by `resolveWorkflow()`. The AI SDK wraps it via `anthropic(modelId)`. The model string format is the same (e.g. `'claude-sonnet-4-20250514'`).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 5: Run tests**

Run: `pnpm test src/actions/chat-stream.test.ts`
Expected: PASS

- [ ] **Step 6: Quick smoke test — start dev server and send a chat message**

Run: `pnpm dev` (in a separate terminal)
Open: the chat interface and send one message
Verify: response streams in correctly, no console errors

- [ ] **Step 7: Commit**

```bash
git add src/actions/chat-stream.ts src/app/api/chat/stream/route.ts
git commit -m "migrate: streaming chat to AI SDK streamText (chat-stream, api/chat/stream)"
```

---

## Task 5: Migrate Feeds Pipeline

This file has a unique pattern: lazy-init (`_anthropic` singleton), two AI calls (Stage 2 + Stage 3), and manual cost calculation using raw token counts. The cost calculation fields (`input_tokens`, `output_tokens`) flow to the DB and **must stay named that way** — only the source changes from `response.usage` to `usage`.

**Files:**
- Modify: `src/lib/feeds/pipeline.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/feeds/pipeline.test.ts (add to existing or create new)
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

describe('feeds pipeline migration', () => {
  it('does not import @anthropic-ai/sdk', () => {
    const source = readFileSync('./src/lib/feeds/pipeline.ts', 'utf8')
    expect(source).not.toContain('@anthropic-ai/sdk')
    expect(source).toContain('generateText')
  })
})
```

Run: `pnpm test src/lib/feeds/pipeline.test.ts`
Expected: FAIL

- [ ] **Step 2: Replace the Anthropic singleton with AI SDK**

Replace:
```typescript
import Anthropic from '@anthropic-ai/sdk'

let _anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}
```

With:
```typescript
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
```

> The lazy-init pattern is no longer needed — `createAnthropic()` in the shared provider does not make any network calls at module load time.

- [ ] **Step 3: Update `runStage2()` body**

```typescript
// BEFORE
const response = await getAnthropic().messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 300,
  system: systemPrompt,
  messages: [{ role: 'user', content: `Titel: ${item.title}\n\nAuszug: ${excerpt}` }],
})
tokensIn = response.usage.input_tokens
tokensOut = response.usage.output_tokens

const raw = response.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')

// AFTER
const { text: raw, usage } = await generateText({
  model: anthropic('claude-haiku-4-5-20251001'),
  maxTokens: 300,
  system: systemPrompt,
  messages: [{ role: 'user', content: `Titel: ${item.title}\n\nAuszug: ${excerpt}` }],
})
tokensIn = usage.promptTokens
tokensOut = usage.completionTokens
```

- [ ] **Step 4: Update `runStage3()` body**

```typescript
// BEFORE
const response = await getAnthropic().messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 600,
  system: `Du fasst...`,
  messages: [{ role: 'user', content: `Titel: ${item.title}\n\nInhalt: ${item.content ?? '(kein Inhalt)'}` }],
})
tokensIn = response.usage.input_tokens
tokensOut = response.usage.output_tokens

const raw = response.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')

// AFTER
const { text: raw, usage } = await generateText({
  model: anthropic('claude-sonnet-4-6'),
  maxTokens: 600,
  system: `Du fasst...`,
  messages: [{ role: 'user', content: `Titel: ${item.title}\n\nInhalt: ${item.content ?? '(kein Inhalt)'}` }],
})
tokensIn = usage.promptTokens
tokensOut = usage.completionTokens
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: no errors in `pipeline.ts`

- [ ] **Step 6: Run tests**

Run: `pnpm test src/lib/feeds/pipeline.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/feeds/pipeline.ts
git commit -m "migrate: feeds pipeline to AI SDK generateText (stage2 + stage3)"
```

---

## Task 6: Cleanup + Update Docs

Remove the old SDK dependency, update CLAUDE.md to reflect the new SDK, and verify the full build passes.

**Files:**
- Modify: `package.json`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Verify no remaining @anthropic-ai/sdk imports**

Run: `grep -r "@anthropic-ai/sdk" src/`
Expected: no output (zero matches)

If there are any matches — fix them before continuing.

- [ ] **Step 2: Remove @anthropic-ai/sdk from package.json**

```bash
cd "C:/Users/timmr/tropenOS"
pnpm remove @anthropic-ai/sdk
```

- [ ] **Step 3: Verify the build still compiles after removal**

Run: `pnpm typecheck`
Expected: PASS — no errors

Run: `pnpm build 2>&1 | tail -20` (optional, skip if slow)
Expected: BUILD successful

- [ ] **Step 4: Update CLAUDE.md — AI-Modelle section**

In `CLAUDE.md`, find the section:
```markdown
SDK: Anthropic SDK direkt (`ANTHROPIC_API_KEY`) — kein Dify für neue Features.
```

Replace with:
```markdown
SDK: **AI SDK** (`ai` + `@ai-sdk/anthropic`) — Provider-Instanz via `@/lib/llm/anthropic`. Nie `@anthropic-ai/sdk` direkt importieren.
```

Also update the table header comment under `### AI-Modelle` to:
```markdown
Alle Modell-Calls gehen über `src/lib/llm/anthropic.ts` → `generateText()` oder `streamText()`.
```

- [ ] **Step 5: Verify full test suite**

Run: `pnpm test`
Expected: all tests PASS (or same failures as before this migration — no regressions)

- [ ] **Step 6: Final commit**

```bash
git add package.json pnpm-lock.yaml CLAUDE.md
git commit -m "chore: remove @anthropic-ai/sdk, update CLAUDE.md to AI SDK"
```

---

## Verification Checklist (run after all tasks)

```bash
# 1. No direct Anthropic SDK imports remain
grep -r "@anthropic-ai/sdk" src/   # → zero results

# 2. TypeScript compiles cleanly
pnpm typecheck                      # → no errors

# 3. Tests pass
pnpm test                           # → no regressions

# 4. Shared provider is used everywhere
grep -r "from '@/lib/llm/anthropic'" src/  # → should appear in ~10 files
grep -r "generateText\|streamText" src/lib src/actions src/app/api  # → should appear in all migrated files

# 5. Design system lint still passes
pnpm lint:design                    # → no errors
```

---

## Notes for Implementer

1. **The `anthropic()` call wraps the model string** — `anthropic('claude-haiku-4-5-20251001')` returns a model object, not a string. TypeScript will catch misuse.

2. **Token field rename** — `response.usage.input_tokens` → `usage.promptTokens`, `response.usage.output_tokens` → `usage.completionTokens`. The DB column names (`tokens_input`, `tokens_output`) and the `StepResult` interface fields (`input_tokens`, `output_tokens`) are **unchanged** — only the source variable changes.

3. **`usage` in `streamText` is a Promise** — must `await result.usage` after the stream is consumed. Don't access it during streaming.

4. **No `max_tokens` → `maxTokens`** — the AI SDK uses camelCase. This will be a TypeScript error if missed.

5. **`messages` format is compatible** — `{ role: 'user' | 'assistant', content: string }[]` works the same in both SDKs.

6. **System prompt** — both SDKs take `system` as a top-level string parameter. No change needed.
