# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dschungel-Farbsystem, konsistente Navigation, Phosphor Icons, bessere Typografie und Chat-UX – kein neues Feature, nur Konsistenz und Charakter.

**Architecture:** Alle Stile bleiben als inline `s`-Objekte (CLAUDE.md Konvention). CSS-Variablen in `globals.css` als Quelle der Wahrheit. Keine Tailwind-Klassen in Workspace-Komponenten.

**Tech Stack:** Next.js 15, React 19, `@phosphor-icons/react` (bereits installiert), inline CSS-in-JS

**Priorität:** 1 → 4 → 2 → 6 → 3 → 5 → 7 → 8

---

## Task 1: Neues Farbsystem in globals.css

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx` (body-Style auf CSS-Vars umstellen)

**Step 1: CSS-Variablen einfügen**

Ersetze `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Hintergründe */
  --bg-base:     #0d1f16;
  --bg-surface:  #134e3a;
  --bg-elevated: #1a5c45;
  --bg-input:    #0f3d2a;

  /* Akzent */
  --accent:       #a3b554;
  --accent-hover: #b8cc5f;
  --accent-muted: #6b7a38;

  /* Schrift */
  --text-primary:   #f0f7f0;
  --text-secondary: #9dbfa9;
  --text-muted:     #5a8a6a;

  /* Borders */
  --border:       #1f6b4a;
  --border-muted: #174d35;
}

html { font-size: 16px; }

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
}
```

**Step 2: layout.tsx Body-Style entfernen** (CSS erledigt das jetzt)

```tsx
// src/app/layout.tsx
// body style={{ margin, fontFamily, background, color }} → löschen
// body bekommt keine style-Prop mehr
```

**Step 3: TypeScript-Check**
```bash
pnpm tsc --noEmit
```
Erwartet: keine Fehler

---

## Task 4: Sidebar-Navigation Redesign

**Files:**
- Modify: `src/components/workspace/LeftNav.tsx`

**Step 1: Neue Styles mit CSS-Variablen**

Ersetze das gesamte `s`-Objekt in LeftNav.tsx:

```ts
const s: Record<string, React.CSSProperties> = {
  leftNav: {
    width: 240, flexShrink: 0,
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-muted)',
    display: 'flex', flexDirection: 'column',
    height: '100%', overflow: 'hidden',
  },
  navLogo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 16px', height: 64,
    borderBottom: '1px solid var(--border-muted)', flexShrink: 0,
  },
  navLogoText: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  navSection: { padding: '10px 8px', borderBottom: '1px solid var(--border-muted)', flexShrink: 0 },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', padding: '4px 10px 6px', display: 'block',
  },
  newChatBtn: {
    width: '100%', background: 'var(--accent)', color: '#0d1f16',
    border: 'none', borderRadius: 8, padding: '9px 0',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 10px', borderRadius: 6, fontSize: 14,
    fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none',
    transition: 'color 0.15s, background 0.15s',
  },
  navItemActive: {
    color: 'var(--text-primary)', background: 'var(--bg-elevated)',
    borderLeft: '3px solid var(--accent)', paddingLeft: 7,
  },
  navDivider: { height: 1, background: 'var(--border-muted)', margin: '0 8px', flexShrink: 0 },
  navConvList: { flex: 1, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const },
  navUser: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', borderTop: '1px solid var(--border-muted)', flexShrink: 0,
  },
  navUserAvatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'var(--accent-muted)', color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  navUserInfo: { flex: 1, minWidth: 0 },
  navUserName: {
    fontSize: 13, color: 'var(--text-primary)', display: 'block',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  navUserSub: { fontSize: 11, color: 'var(--text-muted)', display: 'block' },
  navLogoutBtn: {
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
  },
  settingsBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', borderRadius: 6, fontSize: 13,
    color: 'var(--text-muted)', textDecoration: 'none',
    transition: 'color 0.15s',
  },
}
```

**Step 2: Imports erweitern**

```ts
import {
  Folder, ChartBar, Robot, CurrencyEur, ClipboardText,
  Users, Plus, TreePalm, SignOut, Gear
} from '@phosphor-icons/react'
import Link from 'next/link'
```

**Step 3: JSX der LeftNav-Komponente**

```tsx
<nav style={s.leftNav}>
  {/* Logo */}
  <div style={s.navLogo}>
    <TreePalm size={22} color="var(--accent)" weight="fill" />
    <span style={s.navLogoText}>Tropen OS</span>
  </div>

  {/* New Chat Button */}
  <div style={s.navSection}>
    <button style={s.newChatBtn} onClick={onNewConversation}>
      <Plus size={16} weight="bold" />
      Neuer Chat
    </button>
  </div>

  {/* Navigation */}
  <div style={s.navSection}>
    <span style={s.sectionLabel}>Navigation</span>
    <NavItem href="/dashboard" icon={<ChartBar size={16} />} label="Dashboard" />
    <NavItem href="/workspaces" icon={<Folder size={16} />} label="Workspaces" />
  </div>

  {/* Admin (nur für admins) */}
  {isAdmin && (
    <div style={s.navSection}>
      <span style={s.sectionLabel}>Admin</span>
      <NavItem href="/admin/models" icon={<Robot size={16} />} label="Modelle" />
      <NavItem href="/admin/budget" icon={<CurrencyEur size={16} />} label="Budget" />
      <NavItem href="/admin/logs" icon={<ClipboardText size={16} />} label="Logs" />
      <NavItem href="/admin/users" icon={<Users size={16} />} label="User" />
    </div>
  )}

  <div style={s.navDivider} />

  {/* Chats */}
  <div style={s.navConvList}>
    <span style={{ ...s.sectionLabel, padding: '10px 10px 6px' }}>Chats</span>
    <ProjectSidebar {...projectSidebarProps} />
    <Papierkorb
      trashCount={trashCount}
      trashOpen={trashOpen}
      trashConvs={trashConvs}
      trashLoading={trashLoading}
      onToggle={onToggleTrash}
      onRestore={onRestoreConv}
      onHardDelete={onHardDeleteConv}
    />
  </div>

  {/* User + Settings */}
  <div>
    <div style={{ padding: '4px 8px' }}>
      <Link href="/settings" style={s.settingsBtn}>
        <Gear size={15} />
        Einstellungen
      </Link>
    </div>
    <div style={s.navUser}>
      <div style={s.navUserAvatar}>{userInitial}</div>
      <div style={s.navUserInfo}>
        <span style={s.navUserName}>{userFullName || userEmail}</span>
        <span style={s.navUserSub}>{userEmail}</span>
      </div>
      <button style={s.navLogoutBtn} onClick={handleLogout} title="Abmelden">
        <SignOut size={15} />
      </button>
    </div>
  </div>
</nav>
```

**Step 4: TypeScript-Check**
```bash
pnpm tsc --noEmit
```

---

## Task 2: Phosphor Icons in restlichen Komponenten

**Files:**
- Modify: `src/components/workspace/ChatInput.tsx`
- Modify: `src/components/workspace/ChatArea.tsx`
- Modify: `src/components/workspace/EmptyState.tsx`
- Modify: `src/components/workspace/SessionPanel.tsx`

**Mapping:**
```ts
import { PaperPlaneRight, Plus, Sparkle } from '@phosphor-icons/react'

// ChatInput: send-Button '↑' → <PaperPlaneRight size={18} weight="fill" />
// EmptyState: + → <Plus />
// SessionPanel: Emoji-Labels in SectionLabel → Text bleibt (kein Icon-Import nötig)
```

**ChatInput Send-Button:**
```tsx
import { PaperPlaneRight } from '@phosphor-icons/react'

<button
  style={s.sendBtn}
  type="submit"
  disabled={sending || !input.trim()}
>
  {sending
    ? <span style={{ opacity: 0.5 }}>…</span>
    : <PaperPlaneRight size={18} weight="fill" />
  }
</button>
```

---

## Task 6: Intelligenter Conversation-Titel

**Files:**
- Modify: `src/hooks/useWorkspaceState.ts`

**Step 1: `newConversation()` Default-Titel ändern**

Suche: `title: 'Neue Unterhaltung'` → Ersetze durch: dynamischen Titel-Helper

```ts
function defaultConvTitle(): string {
  const now = new Date()
  const hhmm = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `Chat · ${hhmm}`
}
```

Ersetze im `newConversation()`-Handler:
```ts
// Alt:
title: 'Neue Unterhaltung'
// Neu:
title: defaultConvTitle()
```
Und im Insert:
```ts
title: defaultConvTitle()
```

**Step 2: Erste Nachricht → Titel aus ersten 4 Wörtern**

Im `sendMessage()` done-Handler, ersetze die Titellogik:

```ts
// Alt:
const conv = conversations.find((c) => c.id === convId)
if (conv?.title === 'Neue Unterhaltung') {
  const title = currentInput.slice(0, 40)
  ...
}

// Neu:
const conv = conversations.find((c) => c.id === convId)
const isDefaultTitle = conv?.title?.startsWith('Chat · ')
if (isDefaultTitle) {
  const words = currentInput.trim().split(/\s+/).slice(0, 4).join(' ')
  const title = words.length > 0 ? words : currentInput.slice(0, 40)
  await supabase.from('conversations').update({ title }).eq('id', convId)
  setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title } : c)))
}
```

---

## Task 3: Typografie

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Typo-Klassen ergänzen** (nach den `:root` Vars)

```css
.text-nav   { font-size: 15px; font-weight: 500; }
.text-label { font-size: 13px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }
.text-body  { font-size: 16px; line-height: 1.6; }
.text-small { font-size: 14px; }
```

---

## Task 5: Chat-Bubbles vergrößern

**Files:**
- Modify: `src/components/workspace/ChatMessage.tsx`

**Step 1: Neue Styles**

```ts
const s: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', flexDirection: 'column' },
  msg: { borderRadius: 10, padding: '16px 20px' },
  msgUser: {
    maxWidth: '70%', alignSelf: 'flex-end',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  msgAssistant: {
    maxWidth: '85%', alignSelf: 'flex-start',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-muted)',
    color: 'var(--text-secondary)',
  },
  msgContent: { fontSize: 16, lineHeight: 1.6 },
  inlineCode: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 4, padding: '1px 5px',
    fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)',
  },
  msgMeta: { fontSize: 11, color: 'var(--text-muted)', marginTop: 8 },
}
```

---

## Task 7: Settings-Seite `/settings`

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: Seite erstellen**

```tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type ChatStyle = 'clear' | 'structured' | 'detailed'

const STYLE_LABELS: Record<ChatStyle, string> = {
  clear: 'Klar',
  structured: 'Strukturiert',
  detailed: 'Ausführlich',
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 600, margin: '0 auto', padding: '48px 24px' },
  heading: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 32 },
  section: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-muted)',
    borderRadius: 10, padding: '20px 24px', marginBottom: 20,
  },
  sectionTitle: { fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 },
  row: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: { fontSize: 13, color: 'var(--text-secondary)' },
  input: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 6, padding: '8px 12px',
    fontSize: 14, outline: 'none', width: '100%',
  },
  select: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 6, padding: '8px 12px',
    fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer',
  },
  btn: {
    background: 'var(--accent)', color: '#0d1f16',
    border: 'none', borderRadius: 6, padding: '8px 20px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  toggleLabel: { fontSize: 13, color: 'var(--text-secondary)' },
  comingSoon: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
}

export default function SettingsPage() {
  const supabase = useRef(createClient()).current
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [chatStyle, setChatStyle] = useState<ChatStyle>('structured')
  const [memoryWindow, setMemoryWindow] = useState(20)
  const [thinkingMode, setThinkingMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase.from('users').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('user_preferences')
          .select('chat_style, memory_window, thinking_mode')
          .eq('user_id', user.id).maybeSingle(),
      ])
      if (profile) setFullName((profile as { full_name?: string }).full_name ?? '')
      if (prefs) {
        setChatStyle((prefs as { chat_style?: ChatStyle }).chat_style ?? 'structured')
        setMemoryWindow((prefs as { memory_window?: number }).memory_window ?? 20)
        setThinkingMode((prefs as { thinking_mode?: boolean }).thinking_mode ?? false)
      }
    })
  }, [])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await Promise.all([
      supabase.from('users').update({ full_name: fullName }).eq('id', user.id),
      supabase.from('user_preferences').update({
        chat_style: chatStyle,
        memory_window: memoryWindow,
        thinking_mode: thinkingMode,
      }).eq('user_id', user.id),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Einstellungen</h1>

      {/* Mein Konto */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Mein Konto</p>
        <div style={s.row}>
          <label style={s.label}>Name</label>
          <input style={s.input} value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div style={s.row}>
          <label style={s.label}>E-Mail (nicht änderbar)</label>
          <input style={{ ...s.input, opacity: 0.5 }} value={email} readOnly />
        </div>
      </div>

      {/* Präferenzen */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Präferenzen</p>
        <div style={s.row}>
          <label style={s.label}>Antwort-Stil</label>
          <select style={s.select} value={chatStyle} onChange={e => setChatStyle(e.target.value as ChatStyle)}>
            {(Object.keys(STYLE_LABELS) as ChatStyle[]).map(k => (
              <option key={k} value={k}>{STYLE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div style={s.row}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label style={s.label}>Gesprächsgedächtnis</label>
            <span style={{ ...s.label, color: 'var(--text-primary)', fontWeight: 600 }}>{memoryWindow}</span>
          </div>
          <input type="range" min={5} max={50} step={5} value={memoryWindow}
            onChange={e => setMemoryWindow(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
        </div>
        <div style={s.toggleRow}>
          <span style={s.toggleLabel}>🧠 Toro denkt laut nach (experimentell)</span>
          <button
            onClick={() => setThinkingMode(v => !v)}
            style={{
              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: thinkingMode ? 'var(--accent)' : '#252525', position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', left: thinkingMode ? 18 : 2,
            }} />
          </button>
        </div>
      </div>

      {/* Datenschutz */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Datenschutz</p>
        <p style={s.comingSoon}>Meine Daten exportieren — demnächst verfügbar</p>
        <p style={{ ...s.comingSoon, marginTop: 8 }}>Konto löschen — demnächst verfügbar</p>
      </div>

      <button style={s.btn} onClick={save} disabled={saving}>
        {saved ? '✓ Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
      </button>
    </div>
  )
}
```

---

## Task 8: CO₂-Berechnung korrigieren

**Files:**
- Modify: `src/components/workspace/SessionPanel.tsx`

**Step 1: Funktion `calcCO2` ersetzen**

```ts
// Alt (falsch – gibt sehr kleine Zahlen oder negativ):
function calcCO2(tokens: number): string {
  if (tokens === 0) return '—'
  const min = (tokens * 0.002) / 1000
  const max = (tokens * 0.006) / 1000
  ...
}

// Neu (korrekte physikalische Schätzung):
function calcCO2(tokens: number): string {
  if (tokens === 0) return '—'
  // ~0.8 kWh/1M tokens (GPU), 0.33 kgCO₂/kWh EU-Mix
  const mid = (tokens / 1_000_000) * 0.8 * 0.33 * 1000  // Gramm
  const min = Math.max(0, mid * 0.6)
  const max = Math.max(0, mid * 1.4)
  if (max < 0.0001) return '<0.0001g'
  return `~${min.toFixed(4)}g – ${max.toFixed(4)}g`
}
```

---

## Commit-Strategie

```bash
# Nach Task 1+3:
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: Dschungel-Farbsystem und Typografie-Vars in globals.css"

# Nach Task 4:
git add src/components/workspace/LeftNav.tsx
git commit -m "feat: Sidebar-Redesign mit Dschungel-Farben und Sections"

# Nach Task 2+5+6:
git add src/components/workspace/ src/hooks/useWorkspaceState.ts
git commit -m "feat: Phosphor Icons, Chat-Bubbles, intelligente Konversationsnamen"

# Nach Task 7:
git add src/app/settings/
git commit -m "feat: /settings Seite für Konto und Präferenzen"

# Nach Task 8:
git add src/components/workspace/SessionPanel.tsx
git commit -m "fix: CO₂-Berechnung korrigiert (physikalische Einheit)"
```
