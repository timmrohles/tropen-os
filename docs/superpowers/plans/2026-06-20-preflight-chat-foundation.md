# Pre-Flight-Chat-Fundament Implementation Plan (Companion MVP, Sub-Plan 1/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein chat-first Pre-Flight-Surface (`/preflight/[id]`), auf dem man frei mit Toro (Pre-Flight-Persona) chattet; Nachrichten persistieren, der Thread hängt an einer `conversation` (type='preflight'), die mit dem `preflight_project` verknüpft ist.

**Architecture:** Wiederverwendung der bestehenden Infrastruktur: `conversations` + `messages`-Tabellen (B-Recycling, kein neues Message-Schema), das `streamText`+`ReadableStream`-Primitive aus `/api/chat/stream`, der `withPreflightProjectAccess`-Wrapper (ADR-032). Neu sind nur: zwei kleine Schema-Zusätze, ein Toro-Pre-Flight-Prompt-Modul, eine Preflight-Chat-Stream-Route und das Chat-Surface-UI. Lebt im `/preflight`-Surface, NICHT in der eingefrorenen Workspace-`ChatArea`.

**Tech Stack:** Next.js 15 App Router, AI SDK (`ai` `streamText` + `@/lib/llm/anthropic`), Supabase (`supabaseAdmin`), vitest. Spec: `docs/superpowers/specs/2026-06-15-guided-companion-chat-consolidation-design.md` (Phase 1, Komponenten „Pre-Flight-Chat-Surface", „Toro-Pre-Flight-Prompt", „Conversation↔preflight_project-Link").

**Scope dieses Sub-Plans:** NUR der freie Chat + Persistenz + Verknüpfung. **NICHT** enthalten (= Sub-Plan 2): „Schärfen"-Umschalter, Concept-Extractor, `intention='guided'`-Übergang, Anbindung an `analyzePreflight`/Lücken/`generate`. **NICHT** (= Sub-Plan 3): Drift. **NICHT** (= Sub-Plan 4): Stilllegung A.

---

## File Structure

- **Create** `supabase/migrations/20260620000001_preflight_conversation_link.sql` — `conversation_type` CHECK um `'preflight'` erweitern + `preflight_projects.conversation_id` + Index.
- **Create** `src/lib/preflight/system-prompt.ts` — `buildPreflightSystemPrompt(project)` (reine Funktion, Toro-Pre-Flight-Persona, 4-Dimensionen-Agenda).
- **Create** `src/lib/preflight/__tests__/system-prompt.unit.test.ts`.
- **Modify** `src/lib/api/preflight.ts` — `ensurePreflightConversation(project, userId)` ergänzen.
- **Create** `src/app/api/preflight/projects/[id]/chat/route.ts` — POST: Streaming-Chat (reuse `streamText`-Pattern, `withPreflightProjectAccess`), GET: History.
- **Create** `src/app/[locale]/(app)/preflight/[id]/chat/_components/PreflightChat.tsx` — Client-Chat-Surface (Stream konsumieren, Nachrichten rendern).
- **Modify** `src/app/[locale]/(app)/preflight/[id]/...` — Einstieg zur Chat-Ansicht (Server-Page, die `PreflightChat` mountet).

> **Konventionen, die der Engineer kennen muss:** API-Routen folgen dem Build-Template in `CLAUDE.md` (Auth-Wrapper → kein `getAuthUser()` direkt; `apiError`; `supabaseAdmin` server-only, immer org/project-scoped). UI folgt `CLAUDE.md` → „⚠️ VOR JEDEM UI-BUILD" + `src/components/_DESIGN_REFERENCE.tsx` (nur `var(--…)`-Farben, Phosphor-Icons, `content-*`-Klassen). Tests = vitest, `pnpm exec vitest run <pfad>`.

---

## Task 1: Schema — Conversation-Link

**Files:**
- Create: `supabase/migrations/20260620000001_preflight_conversation_link.sql`

> Migrationen haben keine Unit-Tests (SQL). Verifikation = Folge-Tasks kompilieren/laufen gegen die neue Spalte. CLAUDE.md-Regel „Git zuerst, dann DB": Datei committen, **dann** `supabase db push`.

- [ ] **Step 1: Migration schreiben**

```sql
-- 20260620000001_preflight_conversation_link.sql
-- Companion MVP Sub-Plan 1: Pre-Flight-Chat lebt in einer conversation (type='preflight'),
-- verknüpft mit dem preflight_project. B-Recycling: nutzt conversations + messages.

-- 1) conversation_type um 'preflight' erweitern (bisher: chat/workspace_briefing/workspace_silo/workspace_card)
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_conversation_type_check
  CHECK (conversation_type IN ('chat','workspace_briefing','workspace_silo','workspace_card','preflight'));

-- 2) Brücke preflight_project → conversation (der einzige echte Schema-Zusatz, Spec §6)
ALTER TABLE public.preflight_projects
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_preflight_projects_conversation
  ON public.preflight_projects(conversation_id)
  WHERE conversation_id IS NOT NULL;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260620000001_preflight_conversation_link.sql
git commit -m "feat(preflight): Schema — conversation_type 'preflight' + preflight_projects.conversation_id"
```

- [ ] **Step 3: Anwenden** (nach Commit)

Run: `supabase db push`
Expected: Migration applied, keine Fehler. (Bei MCP-Apply: History-Version an Dateiversion angleichen — CLAUDE.md.)

---

## Task 2: Toro-Pre-Flight-Prompt (reine Funktion, TDD)

**Files:**
- Create: `src/lib/preflight/system-prompt.ts`
- Test: `src/lib/preflight/__tests__/system-prompt.unit.test.ts`

- [ ] **Step 1: Failing test**

```ts
// src/lib/preflight/__tests__/system-prompt.unit.test.ts
import { describe, it, expect } from 'vitest'
import { buildPreflightSystemPrompt } from '../system-prompt'

describe('buildPreflightSystemPrompt', () => {
  it('nennt Toro + alle 4 Konzept-Dimensionen als Agenda', () => {
    const p = buildPreflightSystemPrompt({ name: 'MeinShop', pivots: { branche: 'Handel' } })
    expect(p).toMatch(/Toro/)
    expect(p).toMatch(/was.*für wen/i)
    expect(p).toMatch(/Kern-?Funktionen/i)
    expect(p).toMatch(/Nutzer.*Daten/i)
    expect(p).toMatch(/Verkauf|Geschäftsmodell/i)
  })

  it('bettet den Projektnamen ein', () => {
    expect(buildPreflightSystemPrompt({ name: 'MeinShop', pivots: null })).toMatch(/MeinShop/)
  })

  it('verlangt Nachfragen bei dünnem Input statt Weiterreichen (ADR-030)', () => {
    expect(buildPreflightSystemPrompt({ name: 'X', pivots: null })).toMatch(/nachfrag|dünn|unklar/i)
  })
})
```

- [ ] **Step 2: Run, verify FAIL**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/system-prompt.unit.test.ts`
Expected: FAIL — `Cannot find module '../system-prompt'`

- [ ] **Step 3: Implementieren**

```ts
// src/lib/preflight/system-prompt.ts
// Toro-Persona fürs chat-first Pre-Flight (ADR-033). Coacht aufs Konzept (4 Dimensionen
// als Agenda, kein Formular), zielt aufs Starterpaket. Dünn-Input-Ehrlichkeit (ADR-030).

export interface PreflightPromptProject {
  name: string
  pivots: unknown
}

export function buildPreflightSystemPrompt(project: PreflightPromptProject): string {
  const pivots = project.pivots && typeof project.pivots === 'object'
    ? JSON.stringify(project.pivots)
    : '—'
  return `Du bist Toro, der Pre-Flight-Coach von Tropen OS. Du hilfst beim Schärfen einer Projektidee, BEVOR Code entsteht — im Gespräch, nicht per Formular.

Projekt: "${project.name}". Bekannte Eckdaten: ${pivots}.

Deine Agenda (decke diese 4 Dimensionen im Gespräch implizit ab — frage natürlich, nicht als Checkliste):
1. Was & für wen — was wird gebaut, für welche Nutzer, welches Problem.
2. Kern-Funktionen — die 2–4 Dinge, die das Produkt können muss.
3. Nutzer & Daten — wer loggt sich ein, welche (sensiblen) Daten, Auth nötig?
4. Verkauf / Geschäftsmodell — kostenlos, Abo, Einmalkauf, B2B?

Regeln:
- Stelle EINE fokussierte Rückfrage pro Antwort, baue auf dem Gesagten auf.
- Wenn der Input zu dünn oder unklar ist, frage nach — reiche niemals ein halbgares Konzept weiter (Dünn-Input-Ehrlichkeit).
- Sprich Deutsch, knapp, konkret, ohne Floskeln. Kein Markdown-Wust.
- Ziel ist, gemeinsam ein tragfähiges Konzept zu erreichen, aus dem später ein Starterpaket entsteht. Dränge nicht — coache.`
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `pnpm exec vitest run src/lib/preflight/__tests__/system-prompt.unit.test.ts`
Expected: PASS (3 Tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/preflight/system-prompt.ts src/lib/preflight/__tests__/system-prompt.unit.test.ts
git commit -m "feat(preflight): buildPreflightSystemPrompt (Toro Pre-Flight-Persona)"
```

---

## Task 3: `ensurePreflightConversation`-Helfer

**Files:**
- Modify: `src/lib/api/preflight.ts`

Stellt sicher, dass ein Preflight-Projekt eine verknüpfte `conversation` (type='preflight') hat. Idempotent: existiert `project.conversation_id`, gib sie zurück; sonst lege eine an und verknüpfe.

- [ ] **Step 1: Funktion ergänzen** (ans Ende von `src/lib/api/preflight.ts`, neben `getPreflightProjectForUser`)

```ts
/**
 * Stellt sicher, dass ein Preflight-Projekt eine verknüpfte Pre-Flight-Conversation hat.
 * Idempotent. Gibt die conversation_id zurück.
 */
export async function ensurePreflightConversation(
  project: { id: string; name: string; conversation_id?: string | null },
  userId: string,
): Promise<string> {
  if (project.conversation_id) return project.conversation_id

  const { data: conv, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      user_id: userId,
      workspace_id: null,
      conversation_type: 'preflight',
      title: project.name,
      intention: null, // 'frei' = NULL; Sub-Plan 2 setzt 'guided' beim Schärfen
    })
    .select('id')
    .single()
  if (error || !conv) throw error ?? new Error('Conversation konnte nicht erstellt werden')

  await supabaseAdmin
    .from('preflight_projects')
    .update({ conversation_id: conv.id })
    .eq('id', project.id)

  return conv.id
}
```

> `getPreflightProjectForUser` muss `conversation_id` mitselektieren. In `src/lib/api/preflight.ts` die `.select(...)`-Spaltenliste von `getPreflightProjectForUser` um `conversation_id` erweitern (Step 2).

- [ ] **Step 2: Select erweitern**

Ändere in `getPreflightProjectForUser` die Select-Zeile von
`.select('id, organization_id, name, pivots, latest_run_id, decisions')`
auf
`.select('id, organization_id, name, pivots, latest_run_id, decisions, conversation_id')`
und ergänze `conversation_id: string | null` im Rückgabe-Typ-Literal.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: keine neuen Fehler.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/preflight.ts
git commit -m "feat(preflight): ensurePreflightConversation + conversation_id in getPreflightProjectForUser"
```

---

## Task 4: Preflight-Chat-Stream-Route

**Files:**
- Create: `src/app/api/preflight/projects/[id]/chat/route.ts`

Reuse des `streamText`+`ReadableStream`-Patterns aus `src/app/api/chat/stream/route.ts`, aber Preflight-scoped: Auth via `withPreflightProjectAccess` (injiziert `preflightProject`), Persistenz in `messages` (conversation-scoped), System-Prompt via `buildPreflightSystemPrompt`.

- [ ] **Step 1: Route implementieren**

```ts
// src/app/api/preflight/projects/[id]/chat/route.ts
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { withPreflightProjectAccess } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ensurePreflightConversation } from '@/lib/api/preflight'
import { buildPreflightSystemPrompt } from '@/lib/preflight/system-prompt'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { selectModel } from '@/lib/model-selector'
import { apiError } from '@/lib/api-error'

const { modelId: MODEL } = selectModel('chat')

// GET — Verlauf der Pre-Flight-Conversation (für initiales Laden des Surface)
export const GET = withPreflightProjectAccess(async (_req, { preflightProject: project }) => {
  if (!project.conversation_id) return NextResponse.json({ messages: [] })
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', project.conversation_id)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) return apiError(error)
  return NextResponse.json({ messages: data ?? [] })
})

// POST — eine User-Nachricht → Toro streamt; beide Nachrichten persistiert
export const POST = withPreflightProjectAccess(async (req, { auth, preflightProject: project }) => {
  let body: { content?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 }) }
  const content = (body.content ?? '').trim()
  if (!content) return NextResponse.json({ error: 'content fehlt' }, { status: 400 })

  const budget = await checkBudget(auth.organization_id, 'claude-sonnet')
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  const conversationId = await ensurePreflightConversation(
    { id: project.id, name: project.name, conversation_id: project.conversation_id }, auth.id,
  )

  // User-Nachricht speichern
  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId, role: 'user', content, task_type: 'chat',
  })

  // Verlauf laden (letzte 20)
  const { data: hist } = await supabaseAdmin
    .from('messages').select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true }).limit(20)
  const apiMessages = (hist ?? []).map((m: { role: string; content: string }) => ({
    role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
  }))

  const system = buildPreflightSystemPrompt({ name: project.name, pivots: project.pivots })
  const encoder = new TextEncoder()
  let acc = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const result = streamText({ model: anthropic(MODEL), system, messages: apiMessages, maxOutputTokens: 2048 })
        for await (const chunk of result.textStream) { acc += chunk; controller.enqueue(encoder.encode(chunk)) }
        const usage = await result.usage
        await supabaseAdmin.from('messages').insert({
          conversation_id: conversationId, role: 'assistant', content: acc, model_used: MODEL,
          task_type: 'chat', tokens_input: usage.inputTokens ?? null, tokens_output: usage.outputTokens ?? null,
        })
        controller.close()
      } catch (err) { controller.error(err) }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' },
  })
})
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: keine neuen Fehler. (Falls `checkBudget`-Signatur abweicht: an `src/app/api/chat/stream/route.ts:147` orientieren.)

- [ ] **Step 3: Realer Smoke-Test** (nach `supabase db push` aus Task 1)

Run (Dev-Server läuft, eingeloggt, gültige preflight-project-id `<PID>`):
```bash
curl -N -X POST http://localhost:3000/api/preflight/projects/<PID>/chat \
  -H 'Content-Type: application/json' -H 'Cookie: <session>' \
  -d '{"content":"Ich will einen Online-Shop für Vintage-Möbel bauen."}'
```
Expected: gestreamter Text (Toro fragt nach einer der 4 Dimensionen). Danach `GET` derselben Route → 2 Nachrichten (user+assistant). 401 ohne Session, 404 bei fremder PID.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/preflight/projects/[id]/chat/route.ts
git commit -m "feat(preflight): Chat-Stream-Route (Toro streamt, messages-persistiert, withPreflightProjectAccess)"
```

---

## Task 5: Chat-Surface-UI

**Files:**
- Create: `src/app/[locale]/(app)/preflight/[id]/chat/_components/PreflightChat.tsx`
- Create/Modify: `src/app/[locale]/(app)/preflight/[id]/chat/page.tsx` (Server-Page, mountet `PreflightChat`)

> **Vor dem Bau:** `CLAUDE.md` → „⚠️ VOR JEDEM UI-BUILD" + `src/components/_DESIGN_REFERENCE.tsx` lesen. Nur `var(--…)`-Farben, Phosphor-Icons (`weight="bold"|"fill"`), `content-*`-Klassen, `.btn`/`.card`. Bestehende `/preflight`-Seiten (`src/app/[locale]/(app)/preflight/`) als Layout-Vorbild nehmen.

- [ ] **Step 1: Client-Chat-Komponente** (`PreflightChat.tsx`, `'use client'`)

Kernlogik (Streaming konsumieren, an `_DESIGN_REFERENCE` ausrichten):
```tsx
'use client'
import { useState, useEffect, useRef } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

export function PreflightChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/preflight/projects/${projectId}/chat`)
      .then(r => r.json())
      .then(d => setMessages((d.messages ?? []).map((m: Msg) => ({ role: m.role, content: m.content }))))
      .catch(() => {})
  }, [projectId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const content = input.trim()
    if (!content || streaming) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content }, { role: 'assistant', content: '' }])
    setStreaming(true)
    try {
      const res = await fetch(`/api/preflight/projects/${projectId}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
      })
      if (!res.body) throw new Error('kein Stream')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: c[c.length - 1].content + chunk }; return c })
      }
    } catch {
      setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: 'Es ist ein Fehler aufgetreten. Bitte erneut versuchen.' }; return c })
    } finally { setStreaming(false) }
  }

  // Rendering: Nachrichtenliste + Eingabe — Klassen/Styling am _DESIGN_REFERENCE ausrichten
  // (Chat-Bubbles, .carea-input-inner-Muster, btn-primary „Senden"). Enter sendet, Shift+Enter = Zeilenumbruch.
  return (/* ... JSX nach Design-System ... */ null as unknown as JSX.Element)
}
```
> Der Engineer baut das JSX nach `_DESIGN_REFERENCE.tsx` aus (Bubble-Liste + Eingabe). Die **Logik oben ist verbindlich** (Initial-GET, optimistic user+leerer assistant, Stream-Append auf letzte Assistant-Bubble, Fehlerpfad).

- [ ] **Step 2: Server-Page**

```tsx
// src/app/[locale]/(app)/preflight/[id]/chat/page.tsx
import { PreflightChat } from './_components/PreflightChat'

export default async function PreflightChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="content-max">
      <PreflightChat projectId={id} />
    </div>
  )
}
```
> Falls die `/preflight`-Seiten ein anderes Layout/Header-Muster nutzen (page-header etc.), daran angleichen — bestehende Seite als Vorbild lesen.

- [ ] **Step 3: Typecheck + visuelle Prüfung**

Run: `pnpm exec tsc --noEmit` → keine neuen Fehler.
Dann Dev-Server: `/preflight/<PID>/chat` öffnen, Nachricht senden, Streaming + Persistenz (Reload zeigt Verlauf) prüfen. (preview-Tools nutzen, siehe Verifikations-Workflow.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/[id]/chat"
git commit -m "feat(preflight): Chat-Surface UI (/preflight/[id]/chat, Streaming-Konsum)"
```

---

## Task 6: Einstieg verdrahten

**Files:**
- Modify: bestehende Preflight-Projekt-Ansicht (`src/app/[locale]/(app)/preflight/[id]/...`) — Link/Button „Im Chat öffnen" → `/preflight/[id]/chat`.

- [ ] **Step 1: Einstiegspunkt finden + Link ergänzen**

Lies die bestehende Projekt-Detail-/Listen-Seite unter `src/app/[locale]/(app)/preflight/`. Ergänze einen `Link` (Next `Link`, `.btn btn-primary`, Phosphor `ChatCircle`-Icon) zu `/<locale>/preflight/[id]/chat`. Kein neues Layout erfinden — in das bestehende `page-header-actions`-Muster einfügen.

- [ ] **Step 2: Typecheck + Klick-Test**

Run: `pnpm exec tsc --noEmit`. Dev-Server: vom Projekt zur Chat-Ansicht navigieren.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/preflight"
git commit -m "feat(preflight): Einstieg zur Chat-Ansicht verdrahtet"
```

---

## Self-Review (Plan-Autor)

- **Spec-Abdeckung (Phase 1, dieser Sub-Plan):** Pre-Flight-Chat-Surface (Task 5/6) ✓ · Toro-Pre-Flight-Prompt (Task 2) ✓ · Conversation↔preflight_project-Link (Task 1/3) ✓ · Streaming-Primitive reused (Task 4) ✓ · freier Chat + Persistenz (Task 4/5) ✓. **Bewusst NICHT hier:** Schärfen/Concept-Extractor/intention='guided' (Sub-Plan 2), Drift (3), Stilllegung A (4) — siehe Scope.
- **Typ-Konsistenz:** `buildPreflightSystemPrompt({ name, pivots })` identisch in Task 2 (Def) + Task 4 (Aufruf). `ensurePreflightConversation({ id, name, conversation_id }, userId)` Task 3 (Def) + Task 4 (Aufruf). `messages`-Spalten (`conversation_id, role, content, model_used, task_type, tokens_input, tokens_output`) gegen 001_initial.sql geprüft.
- **No-Placeholder:** Einzige bewusste Auslassung ist das Chat-**JSX** in Task 5 (an `_DESIGN_REFERENCE` delegiert) — die verbindliche Stream-Logik ist vollständig angegeben; visuelles Chrome aus dem Design-System zu holen ist korrekt, kein Platzhalter für Verhalten.
- **Reihenfolge/Abhängigkeit:** Task 1 (Schema) muss vor Task 3/4-Laufzeittest `db push`. Task 2 ist unabhängig (reine Funktion). Task 4 hängt an 1+2+3. Task 5 an 4. Task 6 an 5.
