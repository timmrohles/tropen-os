# Design System & Navigation Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Tropen OS from a dark-green theme to a light, SugarCRM-inspired design with correct semantic navigation, WCAG-compliant landmarks, and server-side auth guards.

**Architecture:** CSS variables in `globals.css` are replaced first — all components consume them. Nav components are then restructured for correct HTML semantics (`<header>`, `<nav>`, `<ul>/<li>`, `aria-current`). Auth guards live in a shared `guards.ts` plus a new `src/app/admin/layout.tsx` (since all `/admin/*` pages are `'use client'` and cannot hold server-side guards themselves).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS (utility only), `@supabase/ssr`, `@phosphor-icons/react`, `next/font/google`

---

## Design Tokens (reference for all tasks)

```
Background:  radial-gradient(ellipse at 65% 0%, #BEE3CA 0%, transparent 42%),
             radial-gradient(ellipse at 5% 90%, #BEE3CA 0%, transparent 42%),
             #EAE9E5
NavBar bg:   rgba(255,255,255,0.72)  backdrop-filter: blur(20px) saturate(180%)
LeftNav bg:  rgba(255,255,255,0.70)
Card bg:     rgba(255,255,255,0.80)

--text-primary:   #1A1714
--text-secondary: #6B6560
--text-tertiary:  #A09A93
--accent:         #2D7A50       (green text / borders)
--accent-light:   #D4EDDE       (green badge bg / avatar bg / "Neuer Chat" bg)
--accent-subtle:  rgba(45,122,80,0.08)

Active nav pill (Variant D):
  background:    #1A2E23       (dark green-black, NOT pure black)
  color:         #fff
  padding:       7px 18px
  border-radius: 999px
  font-weight:   600
  box-shadow:    0 3px 10px rgba(26,46,35,0.30)

Font display:     Instrument Serif (headlines/page titles)
Font UI:          Inter          (everything else — closest free match to Söhne)
Font mono:        JetBrains Mono (code)
```

---

## Chunk 1: CSS Foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

### Task 1: Replace CSS variables + add sr-only

- [ ] **Open `src/app/globals.css`.** Find the entire `:root { … }` block (lines 5–44) and replace it:

```css
:root {
  /* ─── Fundament ─────────────────────────────────────── */
  --bg-base:        #F2F1EE;
  --bg-surface:     rgba(255, 255, 255, 0.80);
  --bg-surface-solid: #FFFFFF;
  --bg-surface-2:   rgba(26, 23, 20, 0.03);
  --bg-nav:         rgba(255, 255, 255, 0.88);
  --bg-leftnav:     rgba(255, 255, 255, 0.70);

  /* ─── Typografie ────────────────────────────────────── */
  --text-primary:   #1A1714;
  --text-secondary: #6B6560;
  --text-tertiary:  #A09A93;
  --text-inverse:   #FFFFFF;

  /* ─── Akzent (helles Grün) ──────────────────────────── */
  --accent:         #2D7A50;
  --accent-light:   #D4EDDE;
  --accent-subtle:  rgba(45, 122, 80, 0.08);
  --accent-dark:    #1A3D29;

  /* ─── Active/Selected (dunkelgrüne Pill, Variant D) ─── */
  --active-bg:      #1A2E23;
  --active-text:    #FFFFFF;

  /* ─── Semantische Farben ────────────────────────────── */
  --success:        #2D7A50;
  --success-bg:     #D4EDDE;
  --warning:        #C07A2A;
  --warning-bg:     #FEF4E7;
  --error:          #C0392B;
  --error-bg:       #FDECEA;
  --info:           #2D7A50;
  --info-bg:        #D4EDDE;

  /* ─── Borders ───────────────────────────────────────── */
  --border:         rgba(26, 23, 20, 0.08);
  --border-medium:  rgba(26, 23, 20, 0.13);
  --border-strong:  rgba(26, 23, 20, 0.22);

  /* ─── Schatten ──────────────────────────────────────── */
  --shadow-xs: 0 1px 2px rgba(26, 23, 20, 0.04);
  --shadow-sm: 0 2px 8px rgba(26, 23, 20, 0.06), 0 1px 2px rgba(26, 23, 20, 0.04);
  --shadow-md: 0 4px 16px rgba(26, 23, 20, 0.08), 0 2px 4px rgba(26, 23, 20, 0.05);
  --shadow-lg: 0 8px 32px rgba(26, 23, 20, 0.10), 0 2px 8px rgba(26, 23, 20, 0.06);

  /* ─── Radien ─────────────────────────────────────────── */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   18px;
  --radius-full: 999px;

  /* ─── Spacing ────────────────────────────────────────── */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px;

  /* ─── Transitions ────────────────────────────────────── */
  --t-fast: 120ms ease;
  --t-base: 200ms ease;
  --t-slow: 320ms ease;

  /* ─── Backwards-compat aliases (remove after full migration) ── */
  --bg-chat:            #F2F1EE;
  --bg-sidebar:         rgba(255,255,255,0.70);
  --bg-input:           #FFFFFF;
  --dropdown-bg:        #FFFFFF;
  --bubble-user:        #1A1714;
  --bubble-user-text:   #FFFFFF;
  --bubble-toro:        rgba(255,255,255,0.82);
  --bubble-toro-text:   #1A1714;
  --text-on-green-primary:   #1A1714;
  --text-on-green-secondary: #6B6560;
  --text-on-green-muted:     #A09A93;
  --color-danger:  #C0392B;
  --color-warning: #C07A2A;
  --color-success: #2D7A50;
  --color-info:    #2D7A50;
  --bg-elevated:   #FFFFFF;
  --border-muted:  rgba(26,23,20,0.08);
  --accent-muted:  rgba(45,122,80,0.5);
}
```

- [ ] **Replace the `body` block** in `globals.css`:

```css
body {
  margin: 0;
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  background:
    radial-gradient(ellipse at 65% 0%, #BEE3CA 0%, transparent 42%),
    radial-gradient(ellipse at 5% 90%, #BEE3CA 0%, transparent 42%),
    #EAE9E5;
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Replace text-utility classes** (`.t-primary`, `.t-secondary`, `.t-dezent`):

```css
.t-primary   { color: var(--text-primary)   !important; }
.t-secondary { color: var(--text-secondary) !important; }
.t-tertiary  { color: var(--text-tertiary)  !important; }
.t-dezent    { color: var(--text-tertiary)  !important; }

.t-display {
  font-family: var(--font-display, 'Instrument Serif', serif);
  font-weight: 400;
}

.t-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.t-mono {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 12px;
}
```

- [ ] **Replace `.chip` classes**:

```css
.chip {
  display: inline-flex; align-items: center;
  padding: 5px 12px;
  background: var(--bg-surface-solid);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all var(--t-fast); white-space: nowrap;
  box-shadow: var(--shadow-xs);
}
.chip:hover { border-color: var(--border-strong); color: var(--text-primary); }
.chip--active {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent-dark);
}
```

- [ ] **Replace `.dropdown` classes**:

```css
.dropdown {
  background: var(--bg-surface-solid);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
}
.dropdown-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 14px; background: none; border: none;
  color: var(--text-secondary); font-size: 13px; text-align: left;
  cursor: pointer; text-decoration: none; transition: background var(--t-fast);
  font-family: var(--font-sans, system-ui, sans-serif);
}
.dropdown-item:hover { background: var(--bg-surface-2); color: var(--text-primary); }
.dropdown-item--active { background: var(--accent-subtle); color: var(--accent); }
.dropdown-item--danger { color: var(--error); }
.dropdown-item--danger:hover { background: var(--error-bg); }
.dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }
```

- [ ] **Add `sr-only` and `h1`–`h2` typography after the dropdown classes**:

```css
/* ─── Accessibility ──────────────────────────────────── */
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0;
  margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border-width: 0;
}

/* ─── Typografie-Skala ───────────────────────────────── */
h1 {
  font-family: var(--font-display, 'Instrument Serif', serif);
  font-size: 28px; font-weight: 400; line-height: 1.2;
  letter-spacing: -0.02em; color: var(--text-primary);
}
h2 {
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: 18px; font-weight: 500; line-height: 1.3;
  letter-spacing: -0.01em; color: var(--text-primary);
}
h3 {
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: 15px; font-weight: 500; line-height: 1.4;
  color: var(--text-primary);
}
```

- [ ] **Add card, btn, badge, input systems** at the end of globals.css:

```css
/* ─── Card-System ────────────────────────────────────── */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  transition: box-shadow var(--t-base);
}
.card:hover { box-shadow: var(--shadow-md); }
.card--flat { box-shadow: none; border-color: var(--border-medium); }
.card--interactive { cursor: pointer; }
.card--interactive:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
  transition: box-shadow var(--t-base), transform var(--t-base);
}

/* ─── Button-System ──────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: 7px var(--space-4); border-radius: var(--radius-md);
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: 13px; font-weight: 500; line-height: 1;
  cursor: pointer; transition: all var(--t-fast);
  border: none; white-space: nowrap; text-decoration: none;
}
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.btn--primary { background: var(--active-bg); color: var(--active-text); box-shadow: var(--shadow-sm); }
.btn--primary:hover { background: #2d2a27; box-shadow: var(--shadow-md); transform: translateY(-1px); }

.btn--secondary {
  background: var(--bg-surface-solid); color: var(--text-primary);
  border: 1px solid var(--border-medium); box-shadow: var(--shadow-xs);
}
.btn--secondary:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }

.btn--ghost { background: transparent; color: var(--text-secondary); }
.btn--ghost:hover { background: var(--bg-surface-2); color: var(--text-primary); }

.btn--accent { background: var(--accent-light); color: var(--accent-dark); font-weight: 600; }
.btn--accent:hover { background: #C0E4CF; }

.btn--danger { background: var(--error-bg); color: var(--error); }
.btn--danger:hover { background: var(--error); color: var(--text-inverse); }

.btn--sm { padding: 4px 10px; font-size: 12px; border-radius: var(--radius-sm); }
.btn--lg { padding: 10px var(--space-6); font-size: 15px; border-radius: var(--radius-lg); }
.btn--icon { padding: 7px; aspect-ratio: 1; border-radius: var(--radius-md); }

/* ─── Badge-System ───────────────────────────────────── */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: var(--radius-full);
  font-size: 11px; font-weight: 500; line-height: 1.4; white-space: nowrap;
}
.badge--success { background: var(--success-bg); color: var(--success); }
.badge--warning { background: var(--warning-bg); color: var(--warning); }
.badge--error   { background: var(--error-bg);   color: var(--error);   }
.badge--info    { background: var(--info-bg);     color: var(--info);    }
.badge--neutral { background: var(--bg-surface-2); color: var(--text-secondary); }

/* ─── Input-System ───────────────────────────────────── */
.input {
  width: 100%; padding: 9px var(--space-4);
  border-radius: var(--radius-md); border: 1px solid var(--border-medium);
  background: var(--bg-surface-solid); color: var(--text-primary);
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: 14px; line-height: 1.5; outline: none;
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
}
.input::placeholder { color: var(--text-tertiary); }
.input:hover  { border-color: var(--border-strong); }
.input:focus  { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); }
.input:disabled { background: var(--bg-surface-2); color: var(--text-tertiary); cursor: not-allowed; }

.input--chat {
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-xl);
  border: 1px solid var(--border-medium); box-shadow: var(--shadow-sm);
  font-size: 14px; resize: none;
}
.input--chat:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle), var(--shadow-md);
}

/* ─── Animationen ────────────────────────────────────── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeIn 200ms ease forwards; }

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-dropdown { animation: slideDown 150ms ease forwards; }

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--bg-surface-2) 25%, #fff 50%, var(--bg-surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

/* ─── Reduced Motion ─────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Commit:**
```bash
git add src/app/globals.css
git commit -m "nav: replace CSS variables with light design system + add card/btn/badge/input/animation classes"
```

---

### Task 2: Switch fonts in layout.tsx

- [ ] **Open `src/app/layout.tsx`.** Replace the existing font import (currently none / system-ui) with:

```tsx
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})
```

- [ ] **Update the `<html>` and `<body>` tags** — remove `className="dark"` and add font variables:

```tsx
// Before:
<html lang="de" className="dark">
  <body style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>

// After:
<html lang="de">
  <body
    className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    style={{ minHeight: '100vh' }}
  >
```

The background is now set via `body` in `globals.css`; the inline style is no longer needed.

- [ ] **Build check:**
```bash
cd "C:/Users/timmr/tropen OS" && pnpm tsc --noEmit 2>&1 | head -30
```
Expected: no errors related to these changes.

- [ ] **Commit:**
```bash
git add src/app/layout.tsx
git commit -m "nav: add Instrument Serif + Inter + JetBrains Mono fonts, remove dark class"
```

---

## Chunk 2: NavBar — Semantik + Active State + AccountSwitcher

**Files:**
- Create: `src/components/AccountSwitcher.tsx`
- Modify: `src/components/NavBar.tsx`

### Task 3: AccountSwitcher component

- [ ] **Create `src/components/AccountSwitcher.tsx`:**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'

export type AccountRole = 'superadmin' | 'org_admin' | 'solo'

interface AccountSwitcherProps {
  current: AccountRole
  onChange: (role: AccountRole) => void
}

const ACCOUNTS = [
  { role: 'superadmin' as const, label: 'Superadmin', shortLabel: 'Super',
    description: 'Vollzugriff auf alle Organisationen' },
  { role: 'org_admin'  as const, label: 'Admin',      shortLabel: 'Admin',
    description: 'Organisations-Administrator' },
  { role: 'solo'       as const, label: 'Solo',        shortLabel: 'Solo',
    description: 'Einzelnutzer-Modus' },
]

// TODO: Account-Switcher Backend
// Wenn echter Multi-Account: onChange ruft Supabase setSession() mit dem
// entsprechenden User-Token auf. Bis dahin: lokaler State via sessionStorage.

export function AccountSwitcher({ current, onChange }: AccountSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentAccount = ACCOUNTS.find(a => a.role === current)!

  // Escape closes dropdown
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Click outside closes
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Konto wechseln — aktuell: ${currentAccount.label}`}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'rgba(26,23,20,0.06)',
          color: 'var(--text-primary)', fontSize: 12, fontWeight: 500,
          fontFamily: 'var(--font-sans, system-ui)',
          transition: 'background var(--t-fast)',
        }}
      >
        <span aria-hidden="true">{currentAccount.shortLabel}</span>
        <CaretDown size={11} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div
            role="presentation"
            aria-hidden="true"
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label="Konto wechseln"
            className="animate-dropdown"
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 20,
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: 200, padding: 4,
              listStyle: 'none', margin: 0,
            }}
          >
            {ACCOUNTS.map(account => (
              <li
                key={account.role}
                role="option"
                aria-selected={account.role === current}
              >
                <button
                  type="button"
                  onClick={() => { onChange(account.role); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '8px 12px', border: 'none', cursor: 'pointer',
                    borderRadius: 8, textAlign: 'left',
                    fontFamily: 'var(--font-sans, system-ui)',
                    background: account.role === current ? 'var(--active-bg)' : 'transparent',
                    color: account.role === current ? 'var(--active-text)' : 'var(--text-primary)',
                    transition: 'background var(--t-fast)',
                  }}
                  onMouseEnter={e => {
                    if (account.role !== current)
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-2)'
                  }}
                  onMouseLeave={e => {
                    if (account.role !== current)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{account.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{account.description}</div>
                  </div>
                  {account.role === current && (
                    <span aria-hidden="true" style={{ fontSize: 12 }}>✓</span>
                  )}
                  <span className="sr-only">{account.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
```

- [ ] **TypeScript check:**
```bash
cd "C:/Users/timmr/tropen OS" && pnpm tsc --noEmit 2>&1 | grep AccountSwitcher
```
Expected: no errors.

- [ ] **Commit:**
```bash
git add src/components/AccountSwitcher.tsx
git commit -m "nav: add AccountSwitcher component with role=listbox and aria-selected"
```

---

### Task 4: Rewrite NavBar.tsx

- [ ] **Replace `src/components/NavBar.tsx`** entirely:

```tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { AccountSwitcher, type AccountRole } from './AccountSwitcher'

const VIEW_AS_KEY = 'tropen_view_as'

interface OrgBranding {
  logo_url: string | null
  primary_color: string
  organization_display_name: string | null
  ai_guide_name: string
}

export default function NavBar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [viewAs, setViewAs] = useState<AccountRole>('superadmin')

  const isActive = (path: string) => pathname.startsWith(path)

  useEffect(() => {
    const stored = sessionStorage.getItem(VIEW_AS_KEY) as AccountRole | null
    if (stored) setViewAs(stored)
  }, [])

  useEffect(() => {
    supabase
      .from('organization_settings')
      .select('logo_url, primary_color, organization_display_name, ai_guide_name')
      .maybeSingle()
      .then(({ data }) => { if (data) setBranding(data) })

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoggedIn(false); return }
      setLoggedIn(true)
      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).maybeSingle()
      if (profile?.role === 'superadmin') setIsSuperadmin(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleViewAsChange(role: AccountRole) {
    setViewAs(role)
    sessionStorage.setItem(VIEW_AS_KEY, role)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    router.push('/login')
  }

  const displayName = branding?.organization_display_name
  const logoUrl = branding?.logo_url
  const showSuperadminNav = isSuperadmin && viewAs === 'superadmin'
  const showAdminNav = !showSuperadminNav && viewAs === 'org_admin'

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 13, fontWeight: active ? 600 : 400,
    textDecoration: 'none',
    padding: active ? '7px 18px' : '7px 14px',
    borderRadius: 999,
    transition: 'all var(--t-fast)',
    background: active ? 'var(--active-bg)' : 'transparent',
    color: active ? 'var(--active-text)' : 'rgba(26,23,20,0.50)',
    boxShadow: active ? '0 3px 10px rgba(26,46,35,0.30)' : 'none',
    display: 'block',
  })

  return (
    <header role="banner">
      <nav
        aria-label="Hauptnavigation"
        style={{
          height: 52, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 4,
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Tropen OS — Startseite"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 14 }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl} alt={displayName ?? 'Logo'}
              width={100} height={28}
              style={{ maxHeight: 28, width: 'auto', objectFit: 'contain' }}
              unoptimized
            />
          ) : (
            <div style={{
              width: 28, height: 28, background: 'var(--active-bg)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>
              🦜
            </div>
          )}
          {!logoUrl && (
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName ?? 'Tropen OS'}
            </span>
          )}
          {logoUrl && displayName && (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName}
            </span>
          )}
        </Link>

        {/* Contextual nav links */}
        <ul role="list" style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
          {showSuperadminNav && (
            <>
              <li>
                <Link href="/superadmin/clients" style={navLinkStyle(isActive('/superadmin'))}
                  aria-current={isActive('/superadmin') ? 'page' : undefined}>
                  Superadmin
                </Link>
              </li>
              <li>
                <Link href="/admin/qa" style={navLinkStyle(isActive('/admin/qa'))}
                  aria-current={isActive('/admin/qa') ? 'page' : undefined}>
                  QA
                </Link>
              </li>
              <li>
                <Link href="/admin/todos" style={navLinkStyle(isActive('/admin/todos'))}
                  aria-current={isActive('/admin/todos') ? 'page' : undefined}>
                  To-Dos
                </Link>
              </li>
            </>
          )}

          {showAdminNav && (
            <>
              <li>
                <Link href="/workspaces" style={navLinkStyle(isActive('/workspaces'))}
                  aria-current={isActive('/workspaces') ? 'page' : undefined}>
                  Workspaces
                </Link>
              </li>
              <li>
                <Link href="/dashboard" style={navLinkStyle(isActive('/dashboard') && !isActive('/admin'))}
                  aria-current={isActive('/dashboard') && !isActive('/admin') ? 'page' : undefined}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/models" style={navLinkStyle(isActive('/admin/models'))}
                  aria-current={isActive('/admin/models') ? 'page' : undefined}>
                  Modelle
                </Link>
              </li>
              <li>
                <Link href="/admin/budget" style={navLinkStyle(isActive('/admin/budget'))}
                  aria-current={isActive('/admin/budget') ? 'page' : undefined}>
                  Budget
                </Link>
              </li>
              <li>
                <Link href="/admin/logs" style={navLinkStyle(isActive('/admin/logs'))}
                  aria-current={isActive('/admin/logs') ? 'page' : undefined}>
                  Logs
                </Link>
              </li>
              <li>
                <Link href="/admin/users" style={navLinkStyle(isActive('/admin/users'))}
                  aria-current={isActive('/admin/users') ? 'page' : undefined}>
                  User
                </Link>
              </li>
              <li>
                <Link href="/admin/branding" style={navLinkStyle(isActive('/admin/branding'))}
                  aria-current={isActive('/admin/branding') ? 'page' : undefined}>
                  Branding
                </Link>
              </li>
            </>
          )}

          {!showSuperadminNav && !showAdminNav && (
            <>
              <li>
                <Link href="/workspaces" style={navLinkStyle(isActive('/workspaces'))}
                  aria-current={isActive('/workspaces') ? 'page' : undefined}>
                  Workspaces
                </Link>
              </li>
              <li>
                <Link href="/dashboard" style={navLinkStyle(isActive('/dashboard'))}
                  aria-current={isActive('/dashboard') ? 'page' : undefined}>
                  Dashboard
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSuperadmin && (
            <AccountSwitcher current={viewAs} onChange={handleViewAsChange} />
          )}
          {loggedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                fontSize: 12, padding: '5px 12px', borderRadius: 8,
                border: '1px solid var(--border-medium)',
                background: 'transparent', color: 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-sans, system-ui)',
                transition: 'all var(--t-fast)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-medium)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
              }}
            >
              Abmelden
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
```

- [ ] **TypeScript check:**
```bash
cd "C:/Users/timmr/tropen OS" && pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Commit:**
```bash
git add src/components/NavBar.tsx
git commit -m "nav: semantic header/nav, aria-current active links, AccountSwitcher, black pill active state"
```

---

## Chunk 3: LeftNav — Bereinigung + Semantik + CSS

**Files:**
- Modify: `src/components/workspace/LeftNav.tsx`
- Modify: `src/app/globals.css` (`.lnav-*` classes)

### Task 5: Remove admin links + workspaces placeholder from LeftNav

- [ ] **In `src/components/workspace/LeftNav.tsx`:**

  1. Remove these imports (no longer used after this task):
     ```tsx
     // Remove these from the import line:
     Robot, CurrencyEur, ClipboardText, Users
     ```

  2. In the user-dropdown menu block, **delete the entire `{isAdmin && ( … )}` block** (lines 274–290 in the current file — the block that renders `/admin/models`, `/admin/budget`, `/admin/logs`, `/admin/users`). Keep the divider only between settings and logout if still needed — if no admin links remain, remove the divider above settings too.

  3. **Delete the Workspaces dropdown button and its conditional block** — remove the entire `<button className="lnav-item" onClick={() => setWsOpen(v => !v)}>…</button>` and the `{wsOpen && (<div className="lnav-ws-indent">…</div>)}` below it. Remove the `wsOpen` state and the `Folders` and `CaretDown` imports if no longer used elsewhere.

  4. The result: the user dropdown only shows Einstellungen + Abmelden. The nav section only shows Dashboard, Projekte, Wissen — no Workspaces dropdown.

- [ ] **TypeScript check:**
```bash
cd "C:/Users/timmr/tropen OS" && pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit:**
```bash
git add src/components/workspace/LeftNav.tsx
git commit -m "nav: remove admin links from LeftNav dropdown, remove empty Workspaces placeholder"
```

---

### Task 6: Update .lnav-* CSS classes to light theme

- [ ] **In `src/app/globals.css`**, find and replace the entire LeftNav section (everything between `/* ─────── LeftNav ─────── */` and the next major section comment). Replace with:

```css
/* ─────────────────────────────────────────────────────────────────────────
   LeftNav
   ───────────────────────────────────────────────────────────────────────── */
.lnav {
  width: 220px; flex-shrink: 0;
  background: var(--bg-leftnav);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; height: 100%; overflow: hidden;
}

.lnav-logo { display: none; } /* Logo now in NavBar only */

.lnav-section { padding: 10px 8px; flex-shrink: 0; }

.lnav-section-label {
  font-size: 10px; font-weight: 500; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgba(26,23,20,0.25);
  padding: 8px 10px 4px; display: block;
}

/* Nav items — aktiv: schwarze Pill */
.lnav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 11px; border-radius: 9px;
  font-size: 13px; color: rgba(26,23,20,0.45);
  text-decoration: none; transition: all var(--t-fast);
  background: none; border: none; cursor: pointer; width: 100%;
  font-family: var(--font-sans, system-ui);
}
.lnav-item:hover { background: rgba(26,23,20,0.05); color: var(--text-primary); }
.lnav-item--active { background: var(--active-bg); color: var(--active-text); }
.lnav-item--active svg { color: var(--active-text) !important; opacity: 1; }
.lnav-item svg { color: rgba(26,23,20,0.45); }
.lnav-item-inner { display: flex; align-items: center; gap: 9px; }
.lnav-item-expand { margin-left: auto; transition: transform 0.2s; }
.lnav-item-expand--open { transform: rotate(180deg); }

.lnav-divider { height: 1px; background: var(--border); margin: 6px 8px; flex-shrink: 0; }

.lnav-conv-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.sidebar-scroll::-webkit-scrollbar { width: 4px; }
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
.sidebar-scroll::-webkit-scrollbar-thumb { background: var(--border-medium); border-radius: 999px; }

.lnav-chats-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 10px 0 0; flex-shrink: 0; height: 38px;
}

.lnav-edit-btn {
  background: none; border: none; font-size: 11px;
  color: var(--accent); cursor: pointer;
  padding: 2px 4px; border-radius: 4px;
  transition: color var(--t-fast);
  font-family: var(--font-sans, system-ui); font-weight: 500;
}
.lnav-edit-btn:hover { color: var(--accent-dark); }

/* Edit mode */
.lnav-action-area {
  display: flex; flex-direction: column; gap: 4px;
  padding: 8px 10px; flex-shrink: 0;
  border-top: 1px solid var(--border);
}
.lnav-action-btn {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--border-medium);
  background: var(--bg-surface); color: var(--text-primary);
  transition: all var(--t-fast); text-align: left;
  font-family: var(--font-sans, system-ui);
}
.lnav-action-btn:hover { border-color: var(--border-strong); box-shadow: var(--shadow-xs); }
.lnav-action-btn--active { background: var(--accent-light); border-color: var(--accent); color: var(--accent-dark); }
.lnav-action-btn--disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
.lnav-action-btn--danger { color: var(--error); border-color: rgba(192,57,43,0.2); }
.lnav-action-btn--danger:hover { background: var(--error-bg); }

.lnav-move-list { display: flex; flex-direction: column; gap: 2px; padding: 4px 0 0; }
.lnav-move-item {
  width: 100%; padding: 7px 12px; background: transparent; border: none;
  border-radius: 6px; font-size: 13px; color: var(--text-secondary);
  cursor: pointer; text-align: left; transition: background var(--t-fast), color var(--t-fast);
  font-family: var(--font-sans, system-ui);
}
.lnav-move-item:hover { background: var(--bg-surface-2); color: var(--text-primary); }

.lnav-delete-confirm {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--error-bg); border: 1px solid rgba(192,57,43,0.15);
}
.lnav-delete-confirm-label { font-size: 12px; color: var(--error); flex: 1; font-weight: 500; }
.lnav-delete-confirm-yes {
  padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer;
  background: var(--error); color: #fff; font-size: 12px; font-weight: 500;
  font-family: var(--font-sans, system-ui); transition: opacity var(--t-fast);
}
.lnav-delete-confirm-yes:hover { opacity: 0.85; }
.lnav-delete-confirm-no {
  padding: 4px 10px; border-radius: 6px; cursor: pointer;
  background: transparent; border: 1px solid var(--border-medium);
  color: var(--text-secondary); font-size: 12px;
  font-family: var(--font-sans, system-ui); transition: all var(--t-fast);
}
.lnav-delete-confirm-no:hover { border-color: var(--border-strong); }

/* New chat button */
.lnav-new-chat-btn {
  display: flex; align-items: center; gap: 7px; width: 100%;
  padding: 8px 12px; border-radius: 10px;
  background: var(--accent-light); color: var(--accent-dark);
  font-size: 12px; font-weight: 600; font-family: var(--font-sans, system-ui);
  border: none; cursor: pointer;
  transition: background var(--t-fast); text-align: left;
}
.lnav-new-chat-btn:hover { background: #C0E4CF; }

/* User bar */
.lnav-user-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 8px; cursor: pointer;
  transition: background var(--t-fast);
}
.lnav-user-bar:hover { background: rgba(26,23,20,0.05); }

.lnav-user-avatar {
  width: 26px; height: 26px; background: var(--accent-light);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--accent); flex-shrink: 0;
}
.lnav-user-info { display: flex; flex-direction: column; min-width: 0; }
.lnav-user-name { font-size: 12px; color: var(--text-primary); font-weight: 500; truncate: true; }
.lnav-user-sub { font-size: 10px; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lnav-user-chevron { margin-left: auto; font-size: 10px; color: var(--text-tertiary); flex-shrink: 0; }

/* User menu dropdown */
.lnav-user-menu {
  position: absolute; bottom: calc(100% + 6px); left: 8px; right: 8px;
  background: var(--bg-surface-solid); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
  padding: 4px; z-index: 50;
}
.lnav-menu-link {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 12px; border-radius: 8px;
  font-size: 13px; color: var(--text-secondary);
  text-decoration: none; transition: background var(--t-fast), color var(--t-fast);
}
.lnav-menu-link:hover { background: var(--bg-surface-2); color: var(--text-primary); }
.lnav-menu-divider { height: 1px; background: var(--border); margin: 4px 0; }
.lnav-menu-logout {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 8px 12px; border-radius: 8px; border: none; cursor: pointer;
  background: transparent; color: var(--error); font-size: 13px;
  font-family: var(--font-sans, system-ui); transition: background var(--t-fast);
  text-align: left;
}
.lnav-menu-logout:hover { background: var(--error-bg); }
```

- [ ] **Commit:**
```bash
git add src/app/globals.css
git commit -m "nav: update .lnav-* CSS to light theme — black pill active, green accent, transparent backgrounds"
```

---

## Chunk 4: Superadmin Layout Nav

**Files:**
- Modify: `src/app/superadmin/layout.tsx`

### Task 7: Semantic header/nav + aria-current

- [ ] **Replace `src/app/superadmin/layout.tsx`** — the nav section only, keep the auth guard logic intact:

```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'superadmin') redirect('/workspaces')

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="content-wide" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <header role="banner" style={{
          borderBottom: '1px solid var(--border)',
          marginBottom: 24, paddingBottom: 14,
          display: 'flex', alignItems: 'center', gap: 32,
        }}>
          <p style={{
            fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase',
            letterSpacing: '0.08em', margin: 0, fontWeight: 600,
          }}>
            <span aria-hidden="true">🦜</span>{' '}
            Tropen Superadmin
          </p>
          <nav aria-label="Superadmin-Navigation">
            <ul role="list" style={{ display: 'flex', gap: 20, listStyle: 'none', margin: 0, padding: 0 }}>
              {[
                { href: '/superadmin/clients', label: 'Clients' },
                { href: '/admin/todos', label: 'To-Dos & Compliance' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        {children}
      </div>
    </div>
  )
}
```

Note: `aria-current` requires `usePathname()` which is client-side. Since this is a Server Component, we omit it here — the NavBar already handles `aria-current` for the top-level nav. If needed, this layout can be enhanced with a client wrapper later.

- [ ] **Commit:**
```bash
git add src/app/superadmin/layout.tsx
git commit -m "nav: superadmin layout — semantic header/nav with aria-label, emoji aria-hidden"
```

---

## Chunk 5: Auth Guards

**Files:**
- Create: `src/lib/auth/guards.ts`
- Create: `src/app/admin/layout.tsx`

### Task 8: Create guards.ts

- [ ] **Create `src/lib/auth/guards.ts`:**

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Require the current user to be a superadmin.
 * Call at the top of any async Server Component or layout.
 * Returns the authenticated user on success.
 */
export async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/workspaces')

  return user
}

/**
 * Require the current user to be an org admin or superadmin.
 * Returns the authenticated user on success.
 */
export async function requireOrgAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['superadmin', 'org_admin'].includes(profile?.role ?? '')) {
    redirect('/workspaces')
  }

  return user
}
```

- [ ] **TypeScript check:**
```bash
cd "C:/Users/timmr/tropen OS" && pnpm tsc --noEmit 2>&1 | grep guards
```
Expected: no errors.

---

### Task 9: Create src/app/admin/layout.tsx

Both `/admin/qa` and `/admin/todos` are `'use client'` pages — they cannot hold server-side auth guards themselves. A server-side layout wrapping all `/admin/*` routes is the clean solution.

- [ ] **Create `src/app/admin/layout.tsx`:**

```tsx
import type { ReactNode } from 'react'
import { requireSuperadmin } from '@/lib/auth/guards'

/**
 * Server-side auth guard for all /admin/* routes.
 * Redirects non-superadmins to /workspaces.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSuperadmin()
  return <>{children}</>
}
```

- [ ] **Build check** (verifies server/client boundary is correct):
```bash
cd "C:/Users/timmr/tropen OS" && pnpm build 2>&1 | tail -20
```
Expected: build succeeds, no "async Server Component" errors.

- [ ] **Commit:**
```bash
git add src/lib/auth/guards.ts src/app/admin/layout.tsx
git commit -m "nav: auth guards for /admin/* routes — requireSuperadmin via layout.tsx"
```

---

## Chunk 6: LeftNav Logo + remaining CSS cleanup

**Files:**
- Modify: `src/app/globals.css` (remaining dark-theme remnants)

### Task 10: Remove hardcoded dark colours from globals.css

- [ ] **Search for remaining dark values:**
```bash
grep -n "#163d2a\|#0d2418\|#1e3828\|#204a35\|rgba(255,255,255,0\." "C:/Users/timmr/tropen OS/src/app/globals.css" | head -30
```

- [ ] For each match, replace with the appropriate new variable from the design tokens table above. Common substitutions:
  - `#163d2a` → `var(--bg-leftnav)` or `var(--bg-surface-solid)`
  - `#0d2418` → `var(--bg-base)`
  - `rgba(255,255,255,0.1)` borders → `var(--border)`
  - `rgba(255,255,255,0.4)` text → `var(--text-tertiary)`
  - `#ffffff` text on dark bg → `var(--text-primary)` (now dark)
  - `var(--text-on-green-primary)` → `var(--text-primary)`

- [ ] **Check for remaining dark Tailwind classes in NavBar / LeftNav:**
```bash
grep -rn "bg-zinc-900\|bg-zinc-800\|border-zinc-800\|text-zinc-4" "C:/Users/timmr/tropen OS/src/components" --include="*.tsx"
```
Remove or replace any found.

- [ ] **Final TypeScript + build check:**
```bash
cd "C:/Users/timmr/tropen OS" && pnpm tsc --noEmit && echo "TS OK"
```

- [ ] **Commit:**
```bash
git add src/app/globals.css src/components/
git commit -m "nav: remove remaining hardcoded dark colours, migrate to CSS variables"
```

---

## Acceptance Checklist

After all chunks — verify manually in browser at `http://localhost:3000`:

```
[ ] Body has warm gradient background (not dark green)
[ ] NavBar: white/translucent, border bottom, no dark background
[ ] Active NavBar link: black pill (dark bg, white text)
[ ] Inactive NavBar links: semi-transparent, hover reveals pill
[ ] AccountSwitcher: dropdown opens, active role has ✓ and black bg
[ ] Escape closes AccountSwitcher dropdown
[ ] LeftNav: off-white/translucent, NOT dark green
[ ] LeftNav active item: black pill
[ ] LeftNav user dropdown: ONLY Einstellungen + Abmelden (no admin links)
[ ] No "Module folgen…" placeholder in LeftNav
[ ] /superadmin/* : semantic header + nav with correct links
[ ] /admin/qa : redirects non-superadmin to /workspaces
[ ] /admin/todos : redirects non-superadmin to /workspaces
[ ] pnpm tsc --noEmit → 0 errors
[ ] pnpm build → succeeds
```
