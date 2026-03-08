# Workspace Redesign – Component Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the monolithic workspace page.tsx (~1600 lines) into 8 focused components + a central state hook, then apply the Kimi-inspired redesign.

**Architecture:**
`page.tsx` becomes a ~100-line orchestrator. All state + handlers live in `useWorkspace` (custom hook). Components receive only what they need via props. No context needed – props drilling is explicit and readable at this scale.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase client-side, Phosphor Icons (`@phosphor-icons/react`), inline `s: Record<string, React.CSSProperties>` pattern

---

## File Structure

```
src/
├── app/
│   └── workspaces/
│       └── [id]/
│           ├── layout.tsx          ← UPDATE: position fixed fullscreen
│           └── page.tsx            ← REWRITE: ~100 lines, orchestration only
├── components/
│   └── workspace/
│       ├── useWorkspace.ts         ← NEW: all state + handlers
│       ├── WorkspaceShell.tsx      ← NEW: three-column layout wrapper
│       ├── LeftNav.tsx             ← NEW: 240px left navigation
│       ├── ProjectSidebar.tsx      ← NEW: project list + conversations + drag&drop
│       ├── EmptyState.tsx          ← NEW: centered Toro start screen
│       ├── ChatArea.tsx            ← NEW: message list + scroll
│       ├── ChatInput.tsx           ← NEW: textarea + send + tool chips
│       ├── ChatMessage.tsx         ← NEW: single message bubble + routing badges
│       └── Papierkorb.tsx          ← NEW: trash slide-over modal
└── components/
    ├── ConditionalNavBar.tsx       ← NEW: hides NavBar on /workspaces/*
    └── NavBar.tsx                  ← MODIFY: add logout cookie cleanup (already done)
```

---

## Shared Types

These types are used across multiple components. Define them once in `src/lib/types.ts` (check if already exists – add to it, don't duplicate).

```ts
// Add to src/lib/types.ts if not already present:
export interface Conversation {
  id: string
  title: string | null
  created_at: string
  task_type: string | null
  project_id: string | null
  deleted_at: string | null
}

export interface Project {
  id: string
  name: string
  display_order: number
}

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  model_used?: string | null
  cost_eur?: number | null
  pending?: boolean
}

export interface RoutingInfo {
  task_type: string
  agent: string
  model_class: string
  model: string
}
```

---

## Task 1: ConditionalNavBar + Layout Updates

**Files:**
- Create: `src/components/ConditionalNavBar.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/workspaces/[id]/layout.tsx`

**Step 1: Create ConditionalNavBar.tsx**

```tsx
'use client'
import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

export default function ConditionalNavBar() {
  const pathname = usePathname()
  if (pathname.startsWith('/workspaces/')) return null
  return <NavBar />
}
```

**Step 2: Update src/app/layout.tsx**

Replace `import NavBar from '@/components/NavBar'` with `import ConditionalNavBar from '@/components/ConditionalNavBar'`.
Replace `<NavBar />` with `<ConditionalNavBar />`.

Full file:
```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import ConditionalNavBar from '@/components/ConditionalNavBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tropen OS',
  description: 'Responsible AI Workspace für den Mittelstand'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f0f0f', color: '#e5e5e5' }}>
        <ConditionalNavBar />
        <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  )
}
```

**Step 3: Update src/app/workspaces/[id]/layout.tsx**

```tsx
import type { ReactNode } from 'react'

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', overflow: 'hidden' }}>
      {children}
    </div>
  )
}
```

`position: fixed; inset: 0` breaks completely out of root layout's padding/maxWidth. Cleaner than the old `margin: -32px` hack.

**Step 4: Verify mentally**
- `/` → ConditionalNavBar renders NavBar ✓
- `/workspaces/abc` → ConditionalNavBar returns null ✓
- Workspace layout is fullscreen ✓

**Step 5: Commit**
```bash
git add src/components/ConditionalNavBar.tsx src/app/layout.tsx "src/app/workspaces/[id]/layout.tsx"
git commit -m "feat: hide navbar on workspace routes, fullscreen workspace layout"
```

---

## Task 2: useWorkspace Hook – All State + Handlers

**Files:**
- Create: `src/components/workspace/useWorkspace.ts`

**Context:**
This is the central brain. It extracts ALL state variables and ALL handler functions from the current `page.tsx`. Components import this hook and receive exactly what they need. The hook takes `workspaceId: string` as parameter.

**Read the current page.tsx carefully before writing this.** The hook must include:
- All `useState` declarations (lines ~100-170 of current page.tsx)
- All `useRef` declarations
- All `useEffect` hooks
- All handler functions (`newConversation`, `deleteConversation`, `createProject`, `deleteProject`, `renameProject`, `renameConversation`, `assignToProject`, `loadTrash`, `restoreConv`, `hardDeleteConv`, `openJungleModal`, `jungleApply`, `openMergeModal`, `applyMerge`, `toggleSelect`, `bulkSoftDelete`, `handleResizeStart`, `sendMessage`)

**Return shape:**
```ts
return {
  // Data
  workspaceName, conversations, projects, messages, routing, trashCount, trashConvs,
  // Active state
  activeConvId, setActiveConvId,
  // Input
  input, setInput,
  // UI state
  search, setSearch, periodFilter, setPeriodFilter, taskFilter, setTaskFilter,
  dropdownOpen, setDropdownOpen, hoveredId, setHoveredId,
  confirmDeleteId, setConfirmDeleteId, deleting, sending, error, setError,
  // Sidebar
  selectMode, setSelectMode, selectedIds, setSelectedIds,
  jungleLoading, projectAssignOpen, setProjectAssignOpen,
  jungleModal, setJungleModal, mergeModal, setMergeModal,
  // Trash
  trashOpen, setTrashOpen, trashLoading,
  // Merge
  mergeLoading, mergeTitle, setMergeTitle, mergeContent, mergeProjectId,
  setMergeProjectId, mergeAfterAction, setMergeAfterAction,
  mergeReady, mergeProjectDropOpen, setMergeProjectDropOpen, toastMsg,
  // Projects
  collapsedProjects, setCollapsedProjects, editingConvId, setEditingConvId,
  editingTitle, setEditingTitle, contextMenuId, setContextMenuId,
  contextMenuSubmenu, setContextMenuSubmenu, dragConvId, setDragConvId,
  dragOverId, setDragOverId, creatingProject, setCreatingProject,
  newProjectName, setNewProjectName, editingProjectId, setEditingProjectId,
  editingProjectName, setEditingProjectName, menuAnchor, setMenuAnchor,
  hoveredProjectId, setHoveredProjectId,
  // Jungle
  jungleSummary, jungleProjects, setJungleProjects, jungleEditName, setJungleEditName,
  jungleDragConv, setJungleDragConv, jungleSaving,
  jungleAddConvOpen, setJungleAddConvOpen, jungleProjectName,
  // Refs
  messagesEndRef, searchWrapRef, contextMenuRef, renameInputRef,
  projectRenameInputRef, escapeEditRef, escapeProjectEditRef,
  // User
  userEmail, userFullName, userInitial, isAdmin,
  // Handlers
  newConversation, deleteConversation, createProject, deleteProject,
  renameProject, renameConversation, assignToProject,
  loadTrash, restoreConv, hardDeleteConv,
  openJungleModal, jungleMoveConv, jungleRemoveConv, jungleRemoveProject, jungleApply,
  openMergeModal, applyMerge,
  toggleSelect, bulkSoftDelete,
  sendMessage, handleLogout,
}
```

**Additional state to add (not in current page.tsx):**
```ts
const [userEmail, setUserEmail] = useState('')
const [userFullName, setUserFullName] = useState('')
const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (!user) return
    setUserEmail(user.email ?? '')
    const { data: profile } = await supabase
      .from('users').select('full_name, role').eq('id', user.id).maybeSingle()
    if (profile) {
      setUserFullName(profile.full_name ?? '')
      setIsAdmin(['owner', 'admin'].includes(profile.role))
    }
  })
}, [supabase])

const userInitial = (userFullName || userEmail).charAt(0).toUpperCase()

async function handleLogout() {
  await supabase.auth.signOut()
  document.cookie = 'onboarding_done=; max-age=0; path=/'
  document.cookie = 'is_superadmin=; max-age=0; path=/'
  window.location.href = '/login'
}
```

**Remove from hook** (no longer needed with fixed 240px nav):
- `sidebarWidth`, `setSidebarWidth`, `resizeHovered`, `setResizeHovered`
- `handleResizeStart`
- `SIDEBAR_MIN`, `SIDEBAR_MAX`, `SIDEBAR_DEFAULT`, `SIDEBAR_LS_KEY` constants

**Step: Commit**
```bash
git add src/components/workspace/useWorkspace.ts
git commit -m "feat: extract workspace state and handlers into useWorkspace hook"
```

---

## Task 3: ChatMessage Component

**Files:**
- Create: `src/components/workspace/ChatMessage.tsx`

**Context:**
Renders a single chat message (user or assistant). Assistant messages show routing badges below. Currently this is inline JSX in page.tsx. Extract it completely.

```tsx
'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ChatMessage as ChatMessageType, RoutingInfo } from '@/lib/types'

interface Props {
  message: ChatMessageType
  routing?: RoutingInfo | null  // only for last assistant message
}

export default function ChatMessage({ message, routing }: Props) {
  const isUser = message.role === 'user'
  return (
    <div style={{ ...s.msgRow, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div>
        <div style={isUser ? s.userBubble : s.assistantBubble}>
          {message.pending ? (
            <span style={s.pendingDots}>●●●</span>
          ) : isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const inline = !match
                  return inline ? (
                    <code style={s.inlineCode} {...props}>{children}</code>
                  ) : (
                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {/* Routing badges – only for last assistant message */}
        {!isUser && routing && (
          <div style={s.badges}>
            <span style={s.badge}>{routing.task_type}</span>
            <span style={s.badge}>{routing.model}</span>
            {message.cost_eur != null && (
              <span style={s.badge}>€{message.cost_eur.toFixed(4)}</span>
            )}
          </div>
        )}
        {/* Cost badge for non-last assistant messages */}
        {!isUser && !routing && message.cost_eur != null && message.cost_eur > 0 && (
          <div style={s.badges}>
            <span style={s.badge}>€{message.cost_eur.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  msgRow: { display: 'flex', marginBottom: 20 },
  userBubble: {
    background: '#18181b', border: '1px solid #27272a',
    borderRadius: '16px 16px 4px 16px',
    padding: '10px 16px', maxWidth: 600,
    fontSize: 14, color: '#e5e5e5', lineHeight: 1.6,
  },
  assistantBubble: {
    maxWidth: 680, fontSize: 14, color: '#e5e5e5', lineHeight: 1.8,
  },
  pendingDots: { color: '#14b8a6', letterSpacing: 4, animation: 'pulse 1s infinite' },
  inlineCode: {
    background: '#27272a', borderRadius: 4,
    padding: '1px 5px', fontSize: 12, color: '#14b8a6',
  },
  badges: { display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' as const },
  badge: {
    fontSize: 11, color: '#555', background: '#18181b',
    border: '1px solid #1a1a1a', borderRadius: 4, padding: '2px 6px',
  },
}
```

**Step: Commit**
```bash
git add src/components/workspace/ChatMessage.tsx
git commit -m "feat: extract ChatMessage component with routing badges"
```

---

## Task 4: ChatInput Component

**Files:**
- Create: `src/components/workspace/ChatInput.tsx`

**Context:**
The input area is shared between EmptyState and ChatArea. It contains: textarea (auto-grow), send button, optional routing indicator while streaming.

```tsx
'use client'

interface Props {
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSend: () => void
  placeholder?: string
  compact?: boolean  // true = smaller padding (in chat mode), false = bigger (start screen)
}

export default function ChatInput({ input, setInput, sending, onSend, placeholder, compact }: Props) {
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  return (
    <div style={{ ...s.wrap, padding: compact ? '12px 16px' : '16px' }}>
      <textarea
        style={s.textarea}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder ?? 'Nachricht eingeben…'}
        rows={1}
        disabled={sending}
      />
      <div style={s.actions}>
        <div style={s.chips}>
          {/* Tool chips row – only in non-compact (start screen) */}
        </div>
        <button
          style={{ ...s.sendBtn, opacity: (!input.trim() || sending) ? 0.4 : 1 }}
          onClick={onSend}
          disabled={!input.trim() || sending}
        >
          {sending ? '…' : 'Senden →'}
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#18181b', border: '1px solid #27272a',
    borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10,
  },
  textarea: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#fff', fontSize: 15, resize: 'none',
    fontFamily: 'system-ui, sans-serif', lineHeight: 1.6,
    width: '100%', boxSizing: 'border-box',
  },
  actions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
  sendBtn: {
    background: '#14b8a6', color: '#000', border: 'none',
    borderRadius: 8, padding: '7px 16px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  },
}
```

**Step: Commit**
```bash
git add src/components/workspace/ChatInput.tsx
git commit -m "feat: extract ChatInput component"
```

---

## Task 5: EmptyState Component

**Files:**
- Create: `src/components/workspace/EmptyState.tsx`

**Context:**
Shown when no conversation is active. Centered layout with Toro, big title, subtitle, tool chips, and the shared ChatInput.

```tsx
'use client'
import Parrot from '@/components/Parrot'
import ChatInput from './ChatInput'

interface Props {
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSend: () => void
  onNewChat: () => void
}

const CHIPS = [
  { label: '📄 Dokument', type: 'create' },
  { label: '🔍 Research', type: 'research' },
  { label: '✍️ Erstellen', type: 'create' },
  { label: '📊 Analysieren', type: 'extract' },
  { label: '💬 Chat', type: 'chat' },
]

export default function EmptyState({ input, setInput, sending, onSend, onNewChat }: Props) {
  return (
    <div style={s.wrap}>
      <Parrot size={72} />
      <h1 style={s.title}>TROPEN OS</h1>
      <p style={s.sub}>Was möchtest du heute erkunden?</p>

      <div style={s.chipRow}>
        {CHIPS.map((c) => (
          <button key={c.label} style={s.chip} onClick={onNewChat}>{c.label}</button>
        ))}
      </div>

      <div style={s.inputWrap}>
        <ChatInput
          input={input}
          setInput={setInput}
          sending={sending}
          onSend={onSend}
          placeholder="Nachricht eingeben…"
        />
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20, padding: '0 48px', textAlign: 'center',
  },
  title: {
    fontSize: 56, fontWeight: 800, color: '#fff',
    letterSpacing: '-2px', margin: 0, lineHeight: 1,
  },
  sub: { fontSize: 18, color: '#71717a', margin: 0 },
  chipRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center' },
  chip: {
    background: '#18181b', border: '1px solid #27272a',
    color: '#a1a1aa', borderRadius: 20, padding: '6px 14px',
    fontSize: 13, cursor: 'pointer',
  },
  inputWrap: { width: '100%', maxWidth: 680 },
}
```

**Step: Commit**
```bash
git add src/components/workspace/EmptyState.tsx
git commit -m "feat: EmptyState start screen with Toro, title, chips, input"
```

---

## Task 6: ChatArea Component

**Files:**
- Create: `src/components/workspace/ChatArea.tsx`

**Context:**
Shows the scrollable message list + pinned input at the bottom. Uses ChatMessage and ChatInput.

```tsx
'use client'
import { useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import type { ChatMessage as ChatMessageType, RoutingInfo } from '@/lib/types'

interface Props {
  messages: ChatMessageType[]
  routing: RoutingInfo | null
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSend: () => void
  error: string
}

export default function ChatArea({ messages, routing, input, setInput, sending, onSend, error }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={s.wrap}>
      <div style={s.messages}>
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id ?? i}
            message={msg}
            routing={i === messages.length - 1 && msg.role === 'assistant' ? routing : null}
          />
        ))}
        {error && <p style={s.error}>{error}</p>}
        <div ref={endRef} />
      </div>
      <div style={s.inputBar}>
        <ChatInput
          input={input}
          setInput={setInput}
          sending={sending}
          onSend={onSend}
          compact
        />
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#09090b' },
  messages: { flex: 1, overflowY: 'auto', padding: '32px 48px' },
  inputBar: { padding: '0 48px 24px', background: '#09090b' },
  error: { color: '#ef4444', fontSize: 13, padding: '8px 0' },
}
```

**Step: Commit**
```bash
git add src/components/workspace/ChatArea.tsx
git commit -m "feat: ChatArea with message list and pinned input"
```

---

## Task 7: ProjectSidebar Component

**Files:**
- Create: `src/components/workspace/ProjectSidebar.tsx`

**Context:**
This is the biggest component to extract. It contains ALL the project + conversation list rendering from the current sidebar – including drag & drop, context menu, multi-select checkboxes, filter chips, rename inputs, and the "Ordnung im Dschungel" button.

Read the current `page.tsx` sidebar JSX carefully (approximately lines 862–1150). Move all JSX relating to the conversation/project list here.

Props it needs from useWorkspace (pass all of them):
```ts
interface Props {
  workspaceId: string
  conversations: Conversation[]
  projects: Project[]
  activeConvId: string | null
  setActiveConvId: (id: string | null) => void
  search: string
  setSearch: (v: string) => void
  periodFilter: PeriodValue
  setPeriodFilter: (v: PeriodValue) => void
  taskFilter: TaskValue
  setTaskFilter: (v: TaskValue) => void
  dropdownOpen: boolean
  setDropdownOpen: (v: boolean) => void
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  confirmDeleteId: string | null
  setConfirmDeleteId: (id: string | null) => void
  deleting: boolean
  selectMode: boolean
  setSelectMode: (v: boolean) => void
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  jungleLoading: boolean
  collapsedProjects: Set<string>
  setCollapsedProjects: (v: Set<string>) => void
  editingConvId: string | null
  setEditingConvId: (id: string | null) => void
  editingTitle: string
  setEditingTitle: (v: string) => void
  contextMenuId: string | null
  setContextMenuId: (id: string | null) => void
  contextMenuSubmenu: boolean
  setContextMenuSubmenu: (v: boolean) => void
  dragConvId: string | null
  setDragConvId: (id: string | null) => void
  dragOverId: string | null
  setDragOverId: (id: string | null) => void
  creatingProject: boolean
  setCreatingProject: (v: boolean) => void
  newProjectName: string
  setNewProjectName: (v: string) => void
  editingProjectId: string | null
  setEditingProjectId: (id: string | null) => void
  editingProjectName: string
  setEditingProjectName: (v: string) => void
  menuAnchor: { top: number; right: number } | null
  setMenuAnchor: (v: { top: number; right: number } | null) => void
  hoveredProjectId: string | null
  setHoveredProjectId: (id: string | null) => void
  searchWrapRef: React.RefObject<HTMLDivElement | null>
  contextMenuRef: React.RefObject<HTMLDivElement | null>
  renameInputRef: React.RefObject<HTMLInputElement | null>
  projectRenameInputRef: React.RefObject<HTMLInputElement | null>
  escapeEditRef: React.MutableRefObject<boolean>
  escapeProjectEditRef: React.MutableRefObject<boolean>
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, title: string) => void
  onAssignToProject: (convId: string, projectId: string | null) => void
  onCreateProject: () => void
  onDeleteProject: (id: string) => void
  onRenameProject: (id: string, name: string) => void
  onOpenJungleModal: () => void
  onBulkSoftDelete: () => void
  onOpenMergeModal: () => void
  onOpenProjectAssign: () => void
}
```

This component is large but straightforward – it's just the sidebar JSX from the current file, unchanged in logic, with props instead of direct state access.

**Step: Commit**
```bash
git add src/components/workspace/ProjectSidebar.tsx
git commit -m "feat: extract ProjectSidebar component with all conversation/project logic"
```

---

## Task 8: Papierkorb Component

**Files:**
- Create: `src/components/workspace/Papierkorb.tsx`

**Context:**
The trash slide-over modal. Extract from current page.tsx. Props needed:

```ts
interface Props {
  open: boolean
  onClose: () => void
  trashConvs: Conversation[]
  trashLoading: boolean
  onRestore: (id: string) => void
  onHardDelete: (id: string) => void
}
```

Extract all trash-related JSX from current page.tsx. Keep styles in the component's `s` object.

**Step: Commit**
```bash
git add src/components/workspace/Papierkorb.tsx
git commit -m "feat: extract Papierkorb slide-over component"
```

---

## Task 9: LeftNav Component

**Files:**
- Create: `src/components/workspace/LeftNav.tsx`

**Context:**
The 240px fixed left navigation. Contains: logo, New Chat button, nav links (role-dependent), the ProjectSidebar, Papierkorb trigger, user info + logout.

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Folder, ChartBar, Robot, CurrencyEur,
  ClipboardText, Users, Trash
} from '@phosphor-icons/react'
import ProjectSidebar from './ProjectSidebar'
import type { ProjectSidebarProps } from './ProjectSidebar'

interface Props extends ProjectSidebarProps {
  workspaceName: string
  trashCount: number
  userEmail: string
  userFullName: string
  userInitial: string
  isAdmin: boolean
  onNewChat: () => void
  onOpenTrash: () => void
  onLogout: () => void
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link href={href} style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
      {icon}
      <span>{label}</span>
    </Link>
  )
}

export default function LeftNav(props: Props) {
  const { workspaceName, trashCount, userEmail, userFullName, userInitial, isAdmin,
    onNewChat, onOpenTrash, onLogout, ...sidebarProps } = props

  return (
    <nav style={s.nav}>
      {/* Logo */}
      <div style={s.logo}>
        <span style={{ fontSize: 22 }}>🦜</span>
        <span style={s.logoText}>Tropen OS</span>
      </div>

      {/* New Chat */}
      <div style={s.section}>
        <button style={s.newChatBtn} onClick={onNewChat}>+ New Chat</button>
      </div>

      {/* Navigation */}
      <div style={s.section}>
        <NavItem href="/workspaces" icon={<Folder size={15} />} label="Workspaces" />
        <NavItem href="/dashboard" icon={<ChartBar size={15} />} label="Dashboard" />
        {isAdmin && (
          <>
            <NavItem href="/admin/models" icon={<Robot size={15} />} label="Modelle" />
            <NavItem href="/admin/budget" icon={<CurrencyEur size={15} />} label="Budget" />
            <NavItem href="/admin/logs" icon={<ClipboardText size={15} />} label="Logs" />
            <NavItem href="/admin/users" icon={<Users size={15} />} label="User" />
          </>
        )}
      </div>

      <div style={s.divider} />

      {/* Project + Conversation List */}
      <div style={s.convList}>
        <ProjectSidebar {...sidebarProps} />
      </div>

      {/* Papierkorb */}
      <button style={s.trashBtn} onClick={onOpenTrash}>
        <Trash size={13} />
        Papierkorb{trashCount > 0 ? ` (${trashCount})` : ''}
      </button>

      {/* User */}
      <div style={s.user}>
        <div style={s.avatar}>{userInitial}</div>
        <span style={s.userName}>{userFullName || userEmail}</span>
        <button style={s.logoutBtn} onClick={onLogout}>Abmelden</button>
      </div>
    </nav>
  )
}

const s: Record<string, React.CSSProperties> = {
  nav: {
    width: 240, flexShrink: 0, background: '#0a0a0a',
    borderRight: '1px solid #1a1a1a', display: 'flex',
    flexDirection: 'column', height: '100%', overflow: 'hidden',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 16px', height: 64, borderBottom: '1px solid #1a1a1a', flexShrink: 0,
  },
  logoText: { fontSize: 15, fontWeight: 700, color: '#fff' },
  section: { padding: '10px 8px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
  newChatBtn: {
    width: '100%', background: '#14b8a6', color: '#000',
    border: 'none', borderRadius: 8, padding: '9px 0',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', borderRadius: 6, fontSize: 13,
    fontWeight: 500, color: '#71717a', textDecoration: 'none',
  },
  navItemActive: {
    color: '#fff', borderLeft: '3px solid #14b8a6',
    paddingLeft: 7, background: '#ffffff08',
  },
  divider: { height: 1, background: '#1a1a1a', margin: '0 8px', flexShrink: 0 },
  convList: { flex: 1, overflowY: 'auto', minHeight: 0 },
  trashBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: 'transparent', border: 'none',
    color: '#555', fontSize: 12, cursor: 'pointer',
    width: '100%', textAlign: 'left', flexShrink: 0,
  },
  user: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', borderTop: '1px solid #1a1a1a', flexShrink: 0,
  },
  avatar: {
    width: 26, height: 26, borderRadius: '50%',
    background: '#14b8a620', color: '#14b8a6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  userName: { fontSize: 12, color: '#e5e5e5', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'transparent', border: 'none', color: '#555',
    fontSize: 11, cursor: 'pointer', padding: 0, flexShrink: 0,
  },
}
```

**Step: Commit**
```bash
git add src/components/workspace/LeftNav.tsx
git commit -m "feat: LeftNav component with logo, nav, project list, user info"
```

---

## Task 10: Rewrite page.tsx as Orchestrator (~100 lines)

**Files:**
- Rewrite: `src/app/workspaces/[id]/page.tsx`

**Context:**
All logic is now in `useWorkspace`. All JSX is in components. page.tsx just wires them together. It also keeps the Jungle/Merge/Trash modals (or those can be added to their own components – keep in page.tsx for now to avoid scope creep).

```tsx
'use client'
import { useEffect, useState } from 'react'
import useWorkspace from '@/components/workspace/useWorkspace'
import LeftNav from '@/components/workspace/LeftNav'
import EmptyState from '@/components/workspace/EmptyState'
import ChatArea from '@/components/workspace/ChatArea'
import Papierkorb from '@/components/workspace/Papierkorb'
// ... import modal components (JungleModal, MergeModal etc – keep inline for now)

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [workspaceId, setWorkspaceId] = useState('')
  useEffect(() => { params.then((p) => setWorkspaceId(p.id)) }, [params])

  const ws = useWorkspace(workspaceId)

  if (!workspaceId) return null

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#09090b' }}>
      <LeftNav
        workspaceName={ws.workspaceName}
        conversations={ws.conversations}
        projects={ws.projects}
        activeConvId={ws.activeConvId}
        setActiveConvId={ws.setActiveConvId}
        trashCount={ws.trashCount}
        userEmail={ws.userEmail}
        userFullName={ws.userFullName}
        userInitial={ws.userInitial}
        isAdmin={ws.isAdmin}
        onNewChat={ws.newConversation}
        onOpenTrash={() => { ws.setTrashOpen(true); ws.loadTrash() }}
        onLogout={ws.handleLogout}
        {/* ... all ProjectSidebar props spread from ws */}
        {...ws}  {/* or explicitly pass each prop */}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {ws.activeConvId ? (
          <ChatArea
            messages={ws.messages}
            routing={ws.routing}
            input={ws.input}
            setInput={ws.setInput}
            sending={ws.sending}
            onSend={ws.sendMessage}
            error={ws.error}
          />
        ) : (
          <EmptyState
            input={ws.input}
            setInput={ws.setInput}
            sending={ws.sending}
            onSend={ws.sendMessage}
            onNewChat={ws.newConversation}
          />
        )}
      </main>

      {/* Modals stay here as overlays */}
      {ws.trashOpen && (
        <Papierkorb
          open={ws.trashOpen}
          onClose={() => ws.setTrashOpen(false)}
          trashConvs={ws.trashConvs}
          trashLoading={ws.trashLoading}
          onRestore={ws.restoreConv}
          onHardDelete={ws.hardDeleteConv}
        />
      )}
      {/* JungleModal, MergeModal, ContextMenu, ActionBar, Toast – keep inline here */}
      {/* Copy from current page.tsx, unchanged */}
    </div>
  )
}
```

**Step: Commit**
```bash
git add "src/app/workspaces/[id]/page.tsx"
git commit -m "feat: workspace page.tsx refactored to ~100-line orchestrator"
```

---

## Task 11: Mobile Responsive

**Files:**
- Modify: `src/components/workspace/LeftNav.tsx`
- Modify: `src/app/workspaces/[id]/page.tsx`

Add `isMobile` state detection:
```ts
const [isMobile, setIsMobile] = useState(false)
const [navOpen, setNavOpen] = useState(false)
useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768)
  check()
  window.addEventListener('resize', check)
  return () => window.removeEventListener('resize', check)
}, [])
```

On mobile:
- LeftNav gets `position: fixed; left: 0; top: 0; bottom: 0; transform: translateX(navOpen ? 0 : '-100%'); zIndex: 50; transition: transform 0.2s`
- Add backdrop: `position: fixed; inset: 0; background: rgba(0,0,0,0.6); zIndex: 49` when navOpen
- Add mobile header bar (48px, top of main): hamburger button + "Tropen OS"

**Step: Commit**
```bash
git add src/components/workspace/LeftNav.tsx "src/app/workspaces/[id]/page.tsx"
git commit -m "feat: mobile responsive workspace with hamburger nav"
```

---

## Execution Notes

- **Tackle tasks in order 1→11** – later tasks depend on earlier ones
- **Read current page.tsx fully before starting Task 2** – the hook must capture every piece of state
- **Do not change any business logic** – only restructure
- **The `sendMessage` function in current page.tsx is the most complex handler** – copy it exactly into useWorkspace, do not simplify
- **TypeScript**: if a type error is unclear, use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` rather than spending time on complex generics
- **After Task 10**: test the full flow – start screen → new chat → send message → reply → papierkorb
