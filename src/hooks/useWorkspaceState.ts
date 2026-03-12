'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Message } from '@/lib/types'

// ─────────────────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────────────────

export const PERIODS = [
  { value: 'all', label: 'Alle' },
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Woche' },
  { value: 'month', label: 'Monat' }
] as const

export const TASK_TYPES = [
  { value: 'all', label: 'Alle' },
  { value: 'chat', label: 'chat' },
  { value: 'summarize', label: 'summarize' },
  { value: 'research', label: 'research' },
  { value: 'create', label: 'create' },
  { value: 'extract', label: 'extract' }
] as const

export type PeriodValue = (typeof PERIODS)[number]['value']
export type TaskValue = (typeof TASK_TYPES)[number]['value']

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

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
  title: string
  goal: string | null
  instructions: string | null
  meta: Record<string, unknown>
  department_id: string
  created_by: string
  created_at: string
  updated_at: string | null
  conversations?: string[]  // kept for LeftNav grouping
}

export interface ChatMessage extends Pick<Message, 'role' | 'content' | 'model_used' | 'cost_eur' | 'tokens_input' | 'tokens_output'> {
  id?: string
  pending?: boolean
}

export interface JungleProject {
  name: string
  emoji: string
  conversations: string[]
  reason: string
}

// Re-export alias for consumers
export type { ChatMessage as ChatMessageType }

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function defaultConvTitle(): string {
  const now = new Date()
  const hhmm = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `Chat · ${hhmm}`
}

export function matchesPeriod(conv: Conversation, period: PeriodValue): boolean {
  if (period === 'all') return true
  const d = new Date(conv.created_at)
  const now = new Date()
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'week') {
    const ago = new Date()
    ago.setDate(now.getDate() - 7)
    return d >= ago
  }
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

// ─────────────────────────────────────────────────────────
// WorkspaceState Interface
// ─────────────────────────────────────────────────────────

export interface WorkspaceState {
  // Core
  workspaceId: string
  workspaceName: string
  conversations: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  activeConvId: string | null
  setActiveConvId: React.Dispatch<React.SetStateAction<string | null>>
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  periodFilter: PeriodValue
  setPeriodFilter: React.Dispatch<React.SetStateAction<PeriodValue>>
  taskFilter: TaskValue
  setTaskFilter: React.Dispatch<React.SetStateAction<TaskValue>>
  dropdownOpen: boolean
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>
  hoveredId: string | null
  setHoveredId: React.Dispatch<React.SetStateAction<string | null>>
  confirmDeleteId: string | null
  setConfirmDeleteId: React.Dispatch<React.SetStateAction<string | null>>
  deleting: boolean
  routing: { task_type: string; agent: string; model_class: string; model: string } | null
  sending: boolean
  error: string
  setError: React.Dispatch<React.SetStateAction<string>>
  activeAgentId: string | null
  setActiveAgentId: React.Dispatch<React.SetStateAction<string | null>>

  // Projects
  projects: Project[]
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  collapsedProjects: Set<string>
  setCollapsedProjects: React.Dispatch<React.SetStateAction<Set<string>>>
  editingConvId: string | null
  setEditingConvId: React.Dispatch<React.SetStateAction<string | null>>
  editingTitle: string
  setEditingTitle: React.Dispatch<React.SetStateAction<string>>
  contextMenuId: string | null
  setContextMenuId: React.Dispatch<React.SetStateAction<string | null>>
  contextMenuSubmenu: boolean
  setContextMenuSubmenu: React.Dispatch<React.SetStateAction<boolean>>
  dragConvId: string | null
  setDragConvId: React.Dispatch<React.SetStateAction<string | null>>
  dragOverId: string | null
  setDragOverId: React.Dispatch<React.SetStateAction<string | null>>
  creatingProject: boolean
  setCreatingProject: React.Dispatch<React.SetStateAction<boolean>>
  newProjectName: string
  setNewProjectName: React.Dispatch<React.SetStateAction<string>>
  editingProjectId: string | null
  setEditingProjectId: React.Dispatch<React.SetStateAction<string | null>>
  editingProjectName: string
  setEditingProjectName: React.Dispatch<React.SetStateAction<string>>
  menuAnchor: { top: number; right: number } | null
  setMenuAnchor: React.Dispatch<React.SetStateAction<{ top: number; right: number } | null>>
  hoveredProjectId: string | null
  setHoveredProjectId: React.Dispatch<React.SetStateAction<string | null>>

  // Multi-select / Jungle
  selectMode: boolean
  setSelectMode: React.Dispatch<React.SetStateAction<boolean>>
  selectedIds: Set<string>
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  jungleLoading: boolean
  projectAssignOpen: boolean
  setProjectAssignOpen: React.Dispatch<React.SetStateAction<boolean>>
  jungleModal: boolean
  setJungleModal: React.Dispatch<React.SetStateAction<boolean>>
  mergeModal: boolean
  setMergeModal: React.Dispatch<React.SetStateAction<boolean>>

  // Trash
  trashOpen: boolean
  setTrashOpen: React.Dispatch<React.SetStateAction<boolean>>
  trashConvs: Conversation[]
  trashCount: number
  trashLoading: boolean

  // Merge modal
  mergeLoading: boolean
  mergeTitle: string
  setMergeTitle: React.Dispatch<React.SetStateAction<string>>
  mergeContent: string
  setMergeContent: React.Dispatch<React.SetStateAction<string>>
  mergeProjectId: string | null
  setMergeProjectId: React.Dispatch<React.SetStateAction<string | null>>
  mergeAfterAction: 'trash' | 'keep' | 'delete'
  setMergeAfterAction: React.Dispatch<React.SetStateAction<'trash' | 'keep' | 'delete'>>
  mergeReady: boolean
  mergeProjectDropOpen: boolean
  setMergeProjectDropOpen: React.Dispatch<React.SetStateAction<boolean>>
  toastMsg: string

  // Jungle structure modal
  jungleSummary: string
  jungleProjects: JungleProject[]
  setJungleProjects: React.Dispatch<React.SetStateAction<JungleProject[]>>
  jungleEditName: Record<number, string>
  setJungleEditName: React.Dispatch<React.SetStateAction<Record<number, string>>>
  jungleDragConv: string | null
  setJungleDragConv: React.Dispatch<React.SetStateAction<string | null>>
  jungleSaving: boolean
  jungleAddConvOpen: number | null
  setJungleAddConvOpen: React.Dispatch<React.SetStateAction<number | null>>

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  searchWrapRef: React.RefObject<HTMLDivElement | null>
  contextMenuRef: React.RefObject<HTMLDivElement | null>
  renameInputRef: React.RefObject<HTMLInputElement | null>
  projectRenameInputRef: React.RefObject<HTMLInputElement | null>
  escapeEditRef: React.MutableRefObject<boolean>
  escapeProjectEditRef: React.MutableRefObject<boolean>

  // Computed
  ungroupedCount: number
  jungleActive: boolean
  selectedArr: string[]
  filteredConvs: Conversation[]
  activePeriodLabel: string | undefined
  hasActiveFilters: boolean

  // Mobile
  isMobile: boolean
  navOpen: boolean
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>

  // User
  userEmail: string
  userFullName: string
  isAdmin: boolean
  userInitial: string
  organizationId: string | null

  // Handlers
  newConversation: (initialMessages?: ChatMessage[]) => Promise<string | null>
  deleteConversation: (id: string) => Promise<void>
  createProject: () => Promise<void>
  deleteProject: (id: string) => Promise<void>
  renameProject: (id: string, name: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  assignToProject: (convId: string, projectId: string | null) => Promise<void>
  loadTrash: () => Promise<void>
  restoreConv: (id: string) => Promise<void>
  hardDeleteConv: (id: string) => Promise<void>
  openJungleModal: () => Promise<void>
  jungleProjectName: (i: number) => string
  jungleMoveConv: (convId: string, toIndex: number) => void
  jungleRemoveConv: (convId: string, fromIndex: number) => void
  jungleRemoveProject: (i: number) => void
  jungleApply: () => Promise<void>
  openMergeModal: () => Promise<void>
  applyMerge: () => Promise<void>
  toggleSelect: (id: string) => void
  bulkSoftDelete: () => Promise<void>
  sendMessage: (e: React.FormEvent) => Promise<void>
  logout: () => Promise<void>
  handleLogout: () => Promise<void>
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export default function useWorkspaceState(workspaceId: string, initialConvId?: string | null): WorkspaceState {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // ── State ──────────────────────────────────────────────
  const [workspaceName, setWorkspaceName] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const sendingRef = useRef(false)
  const [input, setInput] = useState('')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodValue>('all')
  const [taskFilter, setTaskFilter] = useState<TaskValue>('all')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [routing, setRouting] = useState<{
    task_type: string; agent: string; model_class: string; model: string
  } | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // User
  const [userEmail, setUserEmail] = useState('')
  const [userFullName, setUserFullName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Projects + rename
  const [projects, setProjects] = useState<Project[]>([])
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [contextMenuSubmenu, setContextMenuSubmenu] = useState(false)
  const [dragConvId, setDragConvId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)

  // Multi-select / Jungle
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [jungleLoading, setJungleLoading] = useState(false)
  const [projectAssignOpen, setProjectAssignOpen] = useState(false)
  const [jungleModal, setJungleModal] = useState(false)
  const [mergeModal, setMergeModal] = useState(false)

  // Trash
  const [trashOpen, setTrashOpen] = useState(false)
  const [trashConvs, setTrashConvs] = useState<Conversation[]>([])
  const [trashCount, setTrashCount] = useState(0)
  const [trashLoading, setTrashLoading] = useState(false)

  // Merge modal
  const [mergeLoading, setMergeLoading] = useState(false)
  const [mergeTitle, setMergeTitle] = useState('')
  const [mergeContent, setMergeContent] = useState('')
  const [mergeProjectId, setMergeProjectId] = useState<string | null>(null)
  const [mergeAfterAction, setMergeAfterAction] = useState<'trash' | 'keep' | 'delete'>('trash')
  const [mergeReady, setMergeReady] = useState(false)
  const [mergeProjectDropOpen, setMergeProjectDropOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Mobile
  const [isMobile, setIsMobile] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  // Jungle structure modal
  const [jungleSummary, setJungleSummary] = useState('')
  const [jungleProjects, setJungleProjects] = useState<JungleProject[]>([])
  const [jungleEditName, setJungleEditName] = useState<Record<number, string>>({})
  const [jungleDragConv, setJungleDragConv] = useState<string | null>(null)
  const [jungleSaving, setJungleSaving] = useState(false)
  const [jungleAddConvOpen, setJungleAddConvOpen] = useState<number | null>(null)

  // ── Refs ───────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const projectRenameInputRef = useRef<HTMLInputElement>(null)
  const escapeEditRef = useRef(false)
  const escapeProjectEditRef = useRef(false)
  const isMountedRef = useRef(true)

  // ── Effects ────────────────────────────────────────────

  // Track mount state for resize cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Load user profile on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserEmail(user.email ?? '')
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, role, organization_id')
        .eq('id', user.id)
        .maybeSingle()
      if (profile) {
        setUserFullName(profile.full_name ?? '')
        setIsAdmin(['owner', 'admin'].includes(profile.role))
        setOrganizationId(profile.organization_id ?? null)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function onDown(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [dropdownOpen])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenuId) return
    function onDown(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuId(null)
        setMenuAnchor(null)
        setContextMenuSubmenu(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [contextMenuId])

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Multi-select: Escape exits mode
  useEffect(() => {
    if (!selectMode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSelectMode(false); setSelectedIds(new Set()) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectMode])

  // Focus + select rename input when editing conv
  useEffect(() => {
    if (editingConvId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [editingConvId])

  // Focus + select rename input when editing project
  useEffect(() => {
    if (editingProjectId) {
      projectRenameInputRef.current?.focus()
      projectRenameInputRef.current?.select()
    }
  }, [editingProjectId])

  // Initial load: workspace + conversations + projects + trash count
  useEffect(() => {
    if (!workspaceId) return
    async function load() {
      const [{ data: ws }, { data: convs }, { data: projs }] = await Promise.all([
        supabase.from('departments').select('name').eq('id', workspaceId).single(),
        supabase
          .from('conversations')
          .select('id, title, created_at, project_id, task_type, deleted_at')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('projects')
          .select('id, title, goal, instructions, meta, department_id, created_by, created_at, updated_at')
          .eq('department_id', workspaceId)
          .order('created_at')
      ])
      if (ws) setWorkspaceName((ws as { name: string }).name)
      const loadedConvs = (convs ?? []) as Conversation[]
      setConversations(loadedConvs)
      setProjects((projs ?? []) as Project[])
      if (initialConvId && loadedConvs.some(c => c.id === initialConvId)) {
        setActiveConvId(initialConvId)
      }
      const { count } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .not('deleted_at', 'is', null)
      setTrashCount(count ?? 0)
    }
    load()
  }, [workspaceId])

  // Load messages when active conversation changes – aber nicht während des Streamings
  useEffect(() => {
    if (!activeConvId) return
    if (sendingRef.current) return
    supabase
      .from('messages')
      .select('id, role, content, model_used, cost_eur, tokens_input, tokens_output, created_at')
      .eq('conversation_id', activeConvId)
      .order('created_at')
      .then(({ data }) => setMessages((data ?? []) as ChatMessage[]))
  }, [activeConvId])

  // Auto-scroll to bottom – nur bei neuer Nachricht, nicht bei jedem Chunk
  const messageCount = messages.length
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageCount])

  // ── Handlers ───────────────────────────────────────────

  async function newConversation(initialMessages?: ChatMessage[]): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const now = new Date().toISOString()
    const tempId = `temp-${now}`
    const optimistic: Conversation = {
      id: tempId, title: defaultConvTitle(), created_at: now, task_type: null, project_id: null, deleted_at: null
    }
    setConversations((prev) => [optimistic, ...prev])
    setActiveConvId(tempId)
    setMessages(initialMessages ?? [])
    setSearch('')
    setPeriodFilter('all')
    setTaskFilter('all')

    const { data, error: convErr } = await supabase
      .from('conversations')
      .insert({ workspace_id: workspaceId, user_id: user.id, title: defaultConvTitle() })
      .select('id, title, created_at, project_id, task_type, deleted_at')
      .single()

    if (data) {
      setConversations((prev) =>
        prev.map((c) => (c.id === tempId ? data as Conversation : c))
      )
      setActiveConvId((data as Conversation).id)
      return (data as Conversation).id
    } else {
      setConversations((prev) => prev.filter((c) => c.id !== tempId))
      setActiveConvId(null)
      if (convErr) setError(`Fehler beim Erstellen: ${convErr.message}`)
      return null
    }
  }

  async function deleteConversation(id: string) {
    setDeleting(true)
    setConfirmDeleteId(null)
    try {
      await supabase.from('conversations').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      setTrashCount((n) => n + 1)
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); setRouting(null) }
    } finally {
      setDeleting(false)
    }
  }

  async function createProject() {
    const title = newProjectName.trim()
    setCreatingProject(false)
    setNewProjectName('')
    if (!title) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .insert({ department_id: workspaceId, title, goal: null, instructions: null, meta: {}, created_by: user.id })
      .select('id, title, goal, instructions, meta, department_id, created_by, created_at, updated_at')
      .single()
    if (data) setProjects((prev) => [...prev, data as Project])
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setConversations((prev) => prev.map((c) => c.project_id === id ? { ...c, project_id: null } : c))
  }

  async function renameProject(id: string, name: string) {
    const trimmed = name.trim()
    setEditingProjectId(null)
    if (!trimmed) return
    await supabase.from('projects').update({ title: trimmed }).eq('id', id)
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, title: trimmed } : p))
  }

  async function renameConversation(id: string, title: string) {
    const trimmed = title.trim()
    setEditingConvId(null)
    if (!trimmed) return
    await supabase.from('conversations').update({ title: trimmed }).eq('id', id)
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: trimmed } : c))
  }

  async function assignToProject(convId: string, projectId: string | null) {
    await supabase.from('conversations').update({ project_id: projectId }).eq('id', convId)
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, project_id: projectId } : c))
    setContextMenuId(null)
    setContextMenuSubmenu(false)
    setDragConvId(null)
    setDragOverId(null)
  }

  async function loadTrash() {
    setTrashLoading(true)
    const { data } = await supabase
      .from('conversations')
      .select('id, title, created_at, project_id, task_type, deleted_at')
      .eq('workspace_id', workspaceId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(50)
    setTrashConvs((data ?? []) as Conversation[])
    setTrashLoading(false)
  }

  async function restoreConv(id: string) {
    await supabase.from('conversations').update({ deleted_at: null, merged_into: null }).eq('id', id)
    const restored = trashConvs.find((c) => c.id === id)
    if (restored) setConversations((prev) => [{ ...restored, deleted_at: null }, ...prev])
    setTrashConvs((prev) => prev.filter((c) => c.id !== id))
    setTrashCount((n) => Math.max(0, n - 1))
  }

  async function hardDeleteConv(id: string) {
    await supabase.from('messages').delete().eq('conversation_id', id)
    await supabase.from('conversations').delete().eq('id', id)
    setTrashConvs((prev) => prev.filter((c) => c.id !== id))
    setTrashCount((n) => Math.max(0, n - 1))
  }

  async function callJungleOrder(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Nicht eingeloggt')
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/jungle-order`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    const text = await res.text()
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(text) as Record<string, unknown> } catch { /* not JSON */ }
    if (!res.ok) throw new Error((parsed.error as string | undefined) ?? `HTTP ${res.status}: ${text.slice(0, 300)}`)
    return parsed
  }

  async function openJungleModal() {
    setJungleLoading(true)
    try {
      const ungrouped = conversations.filter((c) => !c.project_id && !c.deleted_at)
      const data = await callJungleOrder({ action: 'structure', conversations: ungrouped })
      setJungleProjects((data.projects as JungleProject[]) ?? [])
      setJungleSummary((data.summary as string) ?? '')
      setJungleEditName({})
      setJungleModal(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen')
    } finally {
      setJungleLoading(false)
    }
  }

  function jungleProjectName(i: number): string {
    return jungleEditName[i] ?? jungleProjects[i]?.name ?? ''
  }

  function jungleMoveConv(convId: string, toIndex: number) {
    setJungleProjects((prev) => {
      const next = prev.map((p) => ({ ...p, conversations: p.conversations.filter((id) => id !== convId) }))
      next[toIndex] = { ...next[toIndex], conversations: [...next[toIndex].conversations, convId] }
      return next
    })
  }

  function jungleRemoveConv(convId: string, fromIndex: number) {
    setJungleProjects((prev) => prev.map((p, i) =>
      i === fromIndex ? { ...p, conversations: p.conversations.filter((id) => id !== convId) } : p
    ))
  }

  function jungleRemoveProject(i: number) {
    setJungleProjects((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function jungleApply() {
    setJungleSaving(true)
    try {
      for (let i = 0; i < jungleProjects.length; i++) {
        const proj = jungleProjects[i]
        const name = (jungleEditName[i] ?? proj.name).trim()
        if (!name || proj.conversations.length === 0) continue
        const { data: { user: jUser } } = await supabase.auth.getUser()
        const { data: newProj } = await supabase
          .from('projects')
          .insert({ department_id: workspaceId, title: name, goal: null, instructions: null, meta: {}, created_by: jUser?.id ?? '' })
          .select('id, title, goal, instructions, meta, department_id, created_by, created_at, updated_at')
          .single()
        if (newProj) {
          setProjects((prev) => [...prev, newProj as Project])
          await supabase.from('conversations')
            .update({ project_id: (newProj as Project).id })
            .in('id', proj.conversations)
          setConversations((prev) => prev.map((c) =>
            proj.conversations.includes(c.id) ? { ...c, project_id: (newProj as Project).id } : c
          ))
        }
      }
      setJungleModal(false)
    } finally {
      setJungleSaving(false)
    }
  }

  async function openMergeModal() {
    setMergeLoading(true)
    setMergeReady(false)
    setMergeModal(true)
    setMergeTitle('')
    setMergeContent('')
    setMergeProjectId(null)
    setMergeAfterAction('trash')
    try {
      const data = await callJungleOrder({ action: 'merge', conversation_ids: [...selectedIds] })
      setMergeTitle((data.title as string) ?? '')
      setMergeContent((data.content as string) ?? '')
      setMergeReady(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setMergeModal(false)
    } finally {
      setMergeLoading(false)
    }
  }

  async function applyMerge() {
    if (!mergeTitle.trim() || !mergeContent) return
    setMergeLoading(true)
    try {
      const ids = [...selectedIds]
      const data = await callJungleOrder({
        action: 'merge',
        conversation_ids: ids,
        workspace_id: workspaceId,
        merge_title: mergeTitle.trim(),
        project_id: mergeProjectId,
        after_action: mergeAfterAction,
      })
      const newConv = data.conversation as Conversation
      const content = (data.content as string) ?? ''
      if (mergeAfterAction !== 'keep') {
        setConversations((prev) => prev.filter((c) => !selectedIds.has(c.id)))
      }
      setConversations((prev) => [newConv, ...prev])
      setActiveConvId(newConv.id)
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        pending: false,
        model_used: null,
        cost_eur: null,
        tokens_input: null,
        tokens_output: null,
      }])
      setSelectMode(false)
      setSelectedIds(new Set())
      setMergeModal(false)
      setToastMsg(`🦜 ${ids.length} Chat${ids.length !== 1 ? 's' : ''} erfolgreich zusammengeführt`)
      setTimeout(() => setToastMsg(''), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Zusammenführen')
    } finally {
      setMergeLoading(false)
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  async function bulkSoftDelete() {
    const ids = [...selectedIds]
    const now = new Date().toISOString()
    await supabase.from('conversations')
      .update({ deleted_at: now })
      .in('id', ids)
    setConversations((prev) => prev.filter((c) => !selectedIds.has(c.id)))
    if (activeConvId && selectedIds.has(activeConvId)) { setActiveConvId(null); setMessages([]) }
    setTrashCount((n) => n + ids.length)
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const currentInput = input.trim()
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: currentInput, model_used: null, cost_eur: null, tokens_input: null, tokens_output: null }
    const pendingMsg: ChatMessage = { id: `pending-${crypto.randomUUID()}`, role: 'assistant', content: '', model_used: null, cost_eur: null, tokens_input: null, tokens_output: null, pending: true }

    sendingRef.current = true  // vor newConversation() setzen — verhindert loadMessages-Race
    let convId = activeConvId
    const isNewConv = !convId
    if (!convId) {
      // Optimistic messages direkt in newConversation() setzen — kein leerer Bildschirm
      convId = await newConversation([userMsg, pendingMsg])
      if (!convId) {
        sendingRef.current = false
        return
      }
    }

    if (!isNewConv) {
      setMessages((prev) => [...prev, userMsg, pendingMsg])
    }
    setInput('')
    setSending(true)
    setError('')
    setRouting(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht eingeloggt')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Nicht eingeloggt')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: workspaceId, conversation_id: convId, message: currentInput, agent_id: activeAgentId ?? undefined }),
          signal: AbortSignal.timeout(30_000)
        }
      )

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText)
        let errMsg = `HTTP ${response.status}`
        try {
          const errData = JSON.parse(errText)
          errMsg = errData.error || errData.message || errData.msg || JSON.stringify(errData)
        } catch {
          errMsg = errText || response.statusText || `HTTP ${response.status}`
        }
        throw new Error(errMsg)
      }
      if (!response.body) throw new Error('Kein Stream erhalten')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          let parsed: {
            type: string; content?: string; message?: string
            routing?: typeof routing; usage?: { cost_eur: number; tokens_input?: number; tokens_output?: number }
          }
          try { parsed = JSON.parse(raw) } catch { continue }

          if (parsed.type === 'chunk' && parsed.content) {
            setMessages((prev) =>
              prev.map((m) => (m.pending ? { ...m, content: m.content + parsed.content! } : m))
            )
          } else if (parsed.type === 'done') {
            if (parsed.routing) setRouting(parsed.routing)
            setMessages((prev) =>
              prev.map((m) => m.pending
                ? {
                    ...m,
                    pending: false,
                    cost_eur: parsed.usage?.cost_eur ?? null,
                    tokens_input: parsed.usage?.tokens_input ?? null,
                    tokens_output: parsed.usage?.tokens_output ?? null,
                    model_used: parsed.routing?.model ?? null,
                  }
                : m)
            )
            const conv = conversations.find((c) => c.id === convId)
            const isDefaultTitle = conv?.title?.startsWith('Chat · ')
            if (isDefaultTitle) {
              const wordArr = currentInput.trim().split(/\s+/)
              const title = wordArr.slice(0, 5).join(' ') + (wordArr.length > 5 ? '...' : '')
              await supabase.from('conversations').update({ title }).eq('id', convId)
              setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title } : c)))
            }
            const detectedType = parsed.routing?.task_type
            if (detectedType && conv && !conv.task_type) {
              await supabase.from('conversations').update({ task_type: detectedType }).eq('id', convId).is('task_type', null)
              setConversations((prev) =>
                prev.map((c) => c.id === convId && !c.task_type ? { ...c, task_type: detectedType } : c)
              )
            }
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message ?? 'Stream-Fehler')
          }
        }
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m.pending))
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg.includes('timed out') ? 'Zeitüberschreitung (30s). Bitte erneut versuchen.' : msg)
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    window.location.href = '/login'
  }

  // ── Computed ───────────────────────────────────────────

  const userInitial = userFullName
    ? userFullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (userEmail[0] || '?').toUpperCase()

  const ungroupedCount = conversations.filter((c) => !c.project_id && !c.deleted_at).length
  const jungleActive = ungroupedCount >= 5
  const selectedArr = [...selectedIds]

  const filteredConvs = conversations.filter((c) => {
    if (search.trim() && !(c.title ?? 'Unterhaltung').toLowerCase().includes(search.toLowerCase())) return false
    if (!matchesPeriod(c, periodFilter)) return false
    if (taskFilter !== 'all' && c.task_type !== taskFilter) return false
    return true
  })

  const activePeriodLabel = PERIODS.find((p) => p.value === periodFilter && p.value !== 'all')?.label
  const hasActiveFilters = periodFilter !== 'all' || taskFilter !== 'all'

  // ── Return ─────────────────────────────────────────────

  return {
    // Core
    workspaceId,
    workspaceName,
    conversations, setConversations,
    activeConvId, setActiveConvId,
    messages, setMessages,
    input, setInput,
    search, setSearch,
    periodFilter, setPeriodFilter,
    taskFilter, setTaskFilter,
    dropdownOpen, setDropdownOpen,
    hoveredId, setHoveredId,
    confirmDeleteId, setConfirmDeleteId,
    deleting,
    routing,
    sending,
    error, setError,

    // Projects
    projects, setProjects,
    collapsedProjects, setCollapsedProjects,
    editingConvId, setEditingConvId,
    editingTitle, setEditingTitle,
    contextMenuId, setContextMenuId,
    contextMenuSubmenu, setContextMenuSubmenu,
    dragConvId, setDragConvId,
    dragOverId, setDragOverId,
    creatingProject, setCreatingProject,
    newProjectName, setNewProjectName,
    editingProjectId, setEditingProjectId,
    editingProjectName, setEditingProjectName,
    menuAnchor, setMenuAnchor,
    hoveredProjectId, setHoveredProjectId,

    // Multi-select / Jungle
    selectMode, setSelectMode,
    selectedIds, setSelectedIds,
    jungleLoading,
    projectAssignOpen, setProjectAssignOpen,
    jungleModal, setJungleModal,
    mergeModal, setMergeModal,

    // Trash
    trashOpen, setTrashOpen,
    trashConvs,
    trashCount,
    trashLoading,

    // Merge modal
    mergeLoading,
    mergeTitle, setMergeTitle,
    mergeContent, setMergeContent,
    mergeProjectId, setMergeProjectId,
    mergeAfterAction, setMergeAfterAction,
    mergeReady,
    mergeProjectDropOpen, setMergeProjectDropOpen,
    toastMsg,

    // Mobile
    isMobile,
    navOpen,
    setNavOpen,

    // Jungle structure modal
    jungleSummary,
    jungleProjects, setJungleProjects,
    jungleEditName, setJungleEditName,
    jungleDragConv, setJungleDragConv,
    jungleSaving,
    jungleAddConvOpen, setJungleAddConvOpen,

    // Refs
    messagesEndRef,
    searchWrapRef,
    contextMenuRef,
    renameInputRef,
    projectRenameInputRef,
    escapeEditRef,
    escapeProjectEditRef,

    // Computed
    ungroupedCount,
    jungleActive,
    selectedArr,
    filteredConvs,
    activePeriodLabel,
    hasActiveFilters,

    // User
    userEmail,
    userFullName,
    isAdmin,
    userInitial,
    organizationId,

    // Handlers
    newConversation,
    deleteConversation,
    createProject,
    deleteProject,
    renameProject,
    renameConversation,
    assignToProject,
    loadTrash,
    restoreConv,
    hardDeleteConv,
    openJungleModal,
    jungleProjectName,
    jungleMoveConv,
    jungleRemoveConv,
    jungleRemoveProject,
    jungleApply,
    openMergeModal,
    applyMerge,
    toggleSelect,
    bulkSoftDelete,
    sendMessage,
    logout,
    handleLogout,
    activeAgentId,
    setActiveAgentId,
  }
}
