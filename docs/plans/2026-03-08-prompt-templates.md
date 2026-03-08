# Prompt-Bibliothek Phase 2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Guided template drawer for the 5 core task pills — user fills 2–4 fields, Toro assembles the optimal prompt, user accepts and edits before sending.

**Architecture:** Three new files only. `prompt-templates.ts` holds hardcoded template definitions with `assemble()` functions. `TemplateDrawer.tsx` is a self-contained form+preview component. `EmptyState.tsx` gains state for active template and renders the drawer between input and pills. No DB, no API, no new routes.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS classes in `globals.css`, Phosphor icons (`@phosphor-icons/react`). No new dependencies.

**Design doc:** `docs/plans/2026-03-08-prompt-templates-design.md`

---

### Task 1: Template definitions (`src/lib/prompt-templates.ts`)

**Files:**
- Create: `src/lib/prompt-templates.ts`

**Step 1: Create the file**

```ts
export type FieldType = 'text' | 'textarea' | 'select'

export interface FieldDef {
  id: string
  label: string
  type: FieldType
  options?: string[]      // required when type === 'select'
  placeholder?: string
  optional?: boolean
}

export interface Template {
  id: 'chat' | 'research' | 'create' | 'summarize' | 'extract'
  label: string
  fields: FieldDef[]
  assemble: (values: Record<string, string>) => string
}

export const TEMPLATES: Template[] = [
  // ── 1. Ich habe eine Frage ───────────────────────────────────
  {
    id: 'chat',
    label: 'Ich habe eine Frage',
    fields: [
      {
        id: 'frage',
        label: 'Was möchtest du wissen?',
        type: 'text',
        placeholder: 'Deine Frage…',
      },
      {
        id: 'tiefe',
        label: 'Wie tief soll die Antwort gehen?',
        type: 'select',
        options: ['Kurz & knapp', 'Ausführlich mit Erklärung', 'Mit konkreten Beispielen'],
      },
    ],
    assemble: (v) => {
      const tiefe =
        v.tiefe === 'Kurz & knapp'
          ? 'kurz und präzise'
          : v.tiefe === 'Ausführlich mit Erklärung'
          ? 'ausführlich mit Erklärungen'
          : 'mit konkreten Beispielen'
      return `Beantworte folgende Frage ${tiefe}: ${v.frage}`
    },
  },

  // ── 2. Erkläre mir ein Thema ─────────────────────────────────
  {
    id: 'research',
    label: 'Erkläre mir ein Thema',
    fields: [
      {
        id: 'thema',
        label: 'Was soll erklärt werden?',
        type: 'text',
        placeholder: 'Thema oder Begriff…',
      },
      {
        id: 'vorwissen',
        label: 'Was weißt du bereits darüber?',
        type: 'select',
        options: ['Nichts', 'Grundlagen', 'Fortgeschritten'],
      },
      {
        id: 'zweck',
        label: 'Wozu brauchst du es?',
        type: 'select',
        options: ['Zum Lernen', 'Für eine Präsentation', 'Für eine Entscheidung'],
      },
    ],
    assemble: (v) =>
      `Erkläre mir ${v.thema}. Mein Vorwissensstand: ${v.vorwissen}. Ich brauche es für: ${v.zweck}.`,
  },

  // ── 3. Schreib mir etwas ─────────────────────────────────────
  {
    id: 'create',
    label: 'Schreib mir etwas',
    fields: [
      {
        id: 'was',
        label: 'Was soll geschrieben werden?',
        type: 'text',
        placeholder: 'z.B. eine E-Mail, ein Konzept, einen Post…',
      },
      {
        id: 'fuer_wen',
        label: 'Für wen? (Zielgruppe)',
        type: 'text',
        placeholder: 'z.B. Kunden, Kollegen, Management…',
      },
      {
        id: 'ton',
        label: 'Ton',
        type: 'select',
        options: ['Formell', 'Locker', 'Überzeugend', 'Sachlich'],
      },
      {
        id: 'laenge',
        label: 'Länge',
        type: 'select',
        options: ['Kurz', 'Mittel', 'Lang'],
        optional: true,
      },
    ],
    assemble: (v) =>
      `Schreibe ${v.was} für ${v.fuer_wen} in einem ${v.ton.toLowerCase()}en Ton.${v.laenge ? ` Länge: ${v.laenge}.` : ''}`,
  },

  // ── 4. Fasse zusammen ────────────────────────────────────────
  {
    id: 'summarize',
    label: 'Fasse zusammen',
    fields: [
      {
        id: 'text',
        label: 'Füge hier den Text ein, den Toro zusammenfassen soll',
        type: 'textarea',
        placeholder: 'Text hier einfügen…',
      },
      {
        id: 'fokus',
        label: 'Was ist das Wichtigste?',
        type: 'select',
        options: ['Kernaussagen', 'Handlungsempfehlungen', 'Zahlen & Fakten'],
      },
      {
        id: 'fuer_wen',
        label: 'Für wen ist die Zusammenfassung?',
        type: 'text',
        placeholder: 'z.B. Management, Team, Kunde…',
        optional: true,
      },
    ],
    assemble: (v) =>
      `Fasse folgenden Text zusammen. Fokus auf: ${v.fokus}.${v.fuer_wen ? ` Für: ${v.fuer_wen}.` : ''}\n\n${v.text}`,
  },

  // ── 5. Hilf mir beim Denken ──────────────────────────────────
  {
    id: 'extract',
    label: 'Hilf mir beim Denken',
    fields: [
      {
        id: 'thema',
        label: 'Worum geht es?',
        type: 'text',
        placeholder: 'Beschreibe die Situation oder das Thema…',
      },
      {
        id: 'ziel',
        label: 'Was ist das Ziel?',
        type: 'select',
        options: [
          'Entscheidung treffen',
          'Ideen sammeln',
          'Problem lösen',
          'Vor- und Nachteile abwägen',
        ],
      },
      {
        id: 'hindernis',
        label: 'Was hält dich zurück?',
        type: 'text',
        placeholder: 'Optional…',
        optional: true,
      },
    ],
    assemble: (v) =>
      `Hilf mir beim ${v.ziel} zu folgendem Thema: ${v.thema}.${v.hindernis ? ` Was mich dabei zurückhält: ${v.hindernis}.` : ''} Denke strukturiert mit und stelle mir die richtigen Gegenfragen.`,
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd "C:\Users\timmr\tropen OS"
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/lib/prompt-templates.ts
git commit -m "feat: add prompt template definitions for 5 core tasks"
```

---

### Task 2: CSS für TemplateDrawer (`src/app/globals.css`)

**Files:**
- Modify: `src/app/globals.css` — append new section after the EmptyState section

**Context:** The project uses a single `globals.css` for all component styles. No Tailwind in components. Colors use CSS variables from `:root`: `var(--dropdown-bg)` = `#071510`, `var(--accent)` = `#a3b554`. Text hierarchy classes `.t-primary`, `.t-secondary`, `.t-dezent` already defined.

**Step 1: Find the end of the EmptyState section**

Look for the line:
```css
.es-footer { font-size: 12px; color: rgba(255,255,255,0.45); max-width: 520px; line-height: 1.6; }
```

**Step 2: Add the TemplateDrawer CSS block immediately after**

```css
/* ─────────────────────────────────────────────────────────────────────────
   TemplateDrawer
   ───────────────────────────────────────────────────────────────────────── */
.tdrawer { width: 100%; max-width: 680px; background: var(--dropdown-bg); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; animation: tdrawer-in 0.18s ease; }
@keyframes tdrawer-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.tdrawer-header { display: flex; align-items: center; justify-content: space-between; }
.tdrawer-title { font-size: 14px; font-weight: 600; color: #ffffff; }
.tdrawer-close { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 2px; display: flex; align-items: center; border-radius: 4px; transition: color 0.15s; }
.tdrawer-close:hover { color: #ffffff; }
.tdrawer-fields { display: flex; flex-direction: column; gap: 10px; }
.tdrawer-field { display: flex; flex-direction: column; gap: 4px; }
.tdrawer-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; }
.tdrawer-optional { font-size: 10px; color: rgba(255,255,255,0.25); text-transform: none; letter-spacing: 0; font-weight: 400; margin-left: 4px; }
.tdrawer-input, .tdrawer-select, .tdrawer-textarea { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px 12px; color: #ffffff; font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.15s; box-sizing: border-box; }
.tdrawer-input:focus, .tdrawer-select:focus, .tdrawer-textarea:focus { border-color: rgba(255,255,255,0.4); }
.tdrawer-input::placeholder, .tdrawer-textarea::placeholder { color: rgba(255,255,255,0.25); }
.tdrawer-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; cursor: pointer; }
.tdrawer-select option { background: #071510; color: #ffffff; }
.tdrawer-textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
.tdrawer-preview { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.tdrawer-preview-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em; }
.tdrawer-preview-text { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5; margin: 0; white-space: pre-wrap; }
.tdrawer-accept { width: 100%; padding: 10px; background: var(--accent); border: none; border-radius: 8px; color: #1a2e1a; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.tdrawer-accept:hover:not(:disabled) { background: #b8cc5f; }
.tdrawer-accept:disabled { opacity: 0.35; cursor: not-allowed; }
```

**Step 3: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors (CSS changes don't affect TS).

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add TemplateDrawer CSS"
```

---

### Task 3: TemplateDrawer component (`src/components/workspace/TemplateDrawer.tsx`)

**Files:**
- Create: `src/components/workspace/TemplateDrawer.tsx`

**Context:**
- Receives `template: Template | null` — when null, renders nothing
- Receives `onClose: () => void` — close without accepting
- Receives `onAccept: (prompt: string) => void` — called with assembled prompt
- Select fields initialize to first option automatically
- Text/textarea fields start empty
- "Prompt übernehmen →" button disabled until all required fields have non-empty values
- Live preview appears once all required fields are filled
- `X` icon from `@phosphor-icons/react`

**Step 1: Create the file**

```tsx
'use client'

import React, { useEffect, useState } from 'react'
import { X } from '@phosphor-icons/react'
import type { Template } from '@/lib/prompt-templates'

interface TemplateDrawerProps {
  template: Template | null
  onClose: () => void
  onAccept: (prompt: string) => void
}

export default function TemplateDrawer({ template, onClose, onAccept }: TemplateDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  // Reset values whenever the active template changes
  useEffect(() => {
    if (!template) return
    const initial: Record<string, string> = {}
    template.fields.forEach((f) => {
      initial[f.id] = f.type === 'select' && f.options ? f.options[0] : ''
    })
    setValues(initial)
  }, [template?.id])

  if (!template) return null

  const requiredFilled = template.fields
    .filter((f) => !f.optional)
    .every((f) => (values[f.id] ?? '').trim().length > 0)

  const preview = requiredFilled ? template.assemble(values) : null

  function set(id: string, val: string) {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  return (
    <div className="tdrawer">
      <div className="tdrawer-header">
        <span className="tdrawer-title">{template.label}</span>
        <button className="tdrawer-close" onClick={onClose} title="Schließen">
          <X size={16} />
        </button>
      </div>

      <div className="tdrawer-fields">
        {template.fields.map((field) => (
          <div key={field.id} className="tdrawer-field">
            <label className="tdrawer-label">
              {field.label}
              {field.optional && <span className="tdrawer-optional">optional</span>}
            </label>

            {field.type === 'select' && field.options ? (
              <select
                className="tdrawer-select"
                value={values[field.id] ?? field.options[0]}
                onChange={(e) => set(field.id, e.target.value)}
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                className="tdrawer-textarea"
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => set(field.id, e.target.value)}
                rows={5}
              />
            ) : (
              <input
                className="tdrawer-input"
                type="text"
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => set(field.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {preview && (
        <div className="tdrawer-preview">
          <span className="tdrawer-preview-label">Vorschau</span>
          <p className="tdrawer-preview-text">{preview}</p>
        </div>
      )}

      <button
        className="tdrawer-accept"
        disabled={!requiredFilled}
        onClick={() => onAccept(template.assemble(values))}
      >
        Prompt übernehmen →
      </button>
    </div>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/workspace/TemplateDrawer.tsx
git commit -m "feat: add TemplateDrawer component"
```

---

### Task 4: Wire TemplateDrawer into EmptyState

**Files:**
- Modify: `src/components/workspace/EmptyState.tsx`

**Context:** Current state: `activePill: number | null` drives pill highlight and shows a `es-pill-desc` below the input. Replace this with `activeTemplateId: string | null` that drives the drawer. The `PILLS` array currently has `prefix` and `desc` — these are replaced by the template system. The pill IDs map to template IDs: `chat`, `research`, `create`, `summarize`, `extract` in order.

**Step 1: Rewrite EmptyState.tsx**

```tsx
'use client'

import React, { useState } from 'react'
import ChatInput from './ChatInput'
import TemplateDrawer from './TemplateDrawer'
import { TEMPLATES } from '@/lib/prompt-templates'

interface EmptyStateProps {
  onNewConversation?: () => void
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function EmptyState({ input, setInput, sending, onSubmit }: EmptyStateProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeTemplate = TEMPLATES.find((t) => t.id === activeId) ?? null

  function handlePill(id: string) {
    setActiveId((prev) => (prev === id ? null : id)) // toggle off if same pill clicked again
  }

  function handleAccept(prompt: string) {
    setInput(prompt)
    setActiveId(null)
  }

  return (
    <div className="es">
      <video
        src="/parrot.webm"
        autoPlay loop muted playsInline
        style={{ width: 64, height: 64, objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
      />
      <h1 className="es-title">TROPEN OS</h1>
      <p className="es-sub">Was möchtest du heute erkunden?</p>

      <div className="es-input-wrap">
        <ChatInput input={input} setInput={setInput} sending={sending} onSubmit={onSubmit} />
      </div>

      {activeTemplate && (
        <TemplateDrawer
          template={activeTemplate}
          onClose={() => setActiveId(null)}
          onAccept={handleAccept}
        />
      )}

      <div className="es-pills">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={`es-pill${activeId === t.id ? ' es-pill--active' : ''}`}
            onClick={() => handlePill(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="es-footer">
        Toro wählt immer das sparsamste Modell das deine Aufgabe erfüllt. Ab der zweiten Nachricht erkennt er den Kontext automatisch – du musst nichts mehr auswählen.
      </p>
    </div>
  )
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Manual smoke test**

1. Open the app and navigate to an empty chat screen
2. Click "Schreib mir etwas" → Drawer appears below input, pill turns accent-green
3. Fill "Was?" with "eine E-Mail" and "Für wen?" with "Kunden" → Vorschau appears
4. Change Ton dropdown → Vorschau updates live
5. Click "Prompt übernehmen →" → Drawer closes, assembled prompt in input field
6. Click same pill again → Drawer closes (toggle)
7. Click different pill → Drawer switches to new template, values reset
8. Click ✕ → Drawer closes, input unchanged

**Step 4: Commit**

```bash
git add src/components/workspace/EmptyState.tsx
git commit -m "feat: wire TemplateDrawer into EmptyState — pill click opens guided template"
```

---

### Task 5: Cleanup — remove unused `es-pill-desc` CSS

**Files:**
- Modify: `src/app/globals.css`

**Context:** The old `.es-pill-desc` class (description shown below input after pill click) is no longer used — the drawer replaced it.

**Step 1: Remove the line**

Find and delete:
```css
.es-pill-desc { margin: 8px 0 0; font-size: 13px; color: #fff; opacity: 0.75; line-height: 1.5; text-align: left; }
```

**Step 2: Verify**

```bash
npx tsc --noEmit
```

**Step 3: Final commit**

```bash
git add src/app/globals.css
git commit -m "chore: remove unused es-pill-desc CSS"
```
