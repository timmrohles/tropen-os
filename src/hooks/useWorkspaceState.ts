'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { estimateConversationTokens, MODEL_CONTEXT_LIMIT } from '@/lib/token-counter'
import { createClient } from '@/utils/supabase/client'
import {
  PERIODS, TASK_TYPES, matchesPeriod,
  type Conversation, type Project, type ChatMessage, type JungleProject,
  type PeriodValue, type TaskValue, type WorkspaceState,
} from '@/lib/workspace-types'
import { createConversationActions } from '@/lib/workspace-actions'
import { createJungleActions } from '@/lib/workspace-jungle'
import { createChatActions } from '@/lib/workspace-chat'

export { PERIODS, TASK_TYPES, matchesPeriod }
export type { Conversation, Project, ChatMessage, JungleProject, PeriodValue, TaskValue, WorkspaceState }
export type { ChatMessage as ChatMessageType }

export default function useWorkspaceState(workspaceId: string, initialConvId?: string | null): WorkspaceState {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // ── State ──────────────────────────────────────────────
  const [workspaceName, setWorkspaceName] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const contextTokens = useMemo(() => estimateConversationTokens(messages), [messages])
  const contextPercent = useMemo(
    () => Math.min(100, Math.round((contextTokens / MODEL_CONTEXT_LIMIT) * 100)),
    [contextTokens]
  )

  const sendingRef = useRef(false)
  const [input, setInput] = useState('')
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const [activeCapabilityId, setActiveCapabilityId] = useState<string | null>(null)
  const [activeOutcomeId, setActiveOutcomeId] = useState<string | null>(null)
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

  // Memory modal + extraction indicator
  const [showMemoryModal, setShowMemoryModal] = useState(false)
  const [shareModalConvId, setShareModalConvId] = useState<string | null>(null)
  const [memoryExtracting, setMemoryExtracting] = useState(false)
  const warnedConvRef = useRef<Set<string>>(new Set())

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

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!activeConvId) return
    if (contextPercent < 85) return
    if (warnedConvRef.current.has(activeConvId)) return
    const activeConv = conversations.find((c) => c.id === activeConvId)
    if (!activeConv?.project_id) return
    warnedConvRef.current.add(activeConvId)
    setShowMemoryModal(true)
  }, [contextPercent, activeConvId, conversations])

  useEffect(() => {
    if (!selectMode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSelectMode(false); setSelectedIds(new Set()) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectMode])

  useEffect(() => {
    if (editingConvId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [editingConvId])

  useEffect(() => {
    if (editingProjectId) {
      projectRenameInputRef.current?.focus()
      projectRenameInputRef.current?.select()
    }
  }, [editingProjectId])

  useEffect(() => {
    if (!workspaceId) return
    async function load() {
      const [{ data: ws }, { data: convs }, { data: projs }] = await Promise.all([
        supabase.from('departments').select('name').eq('id', workspaceId).single(),
        supabase
          .from('conversations')
          .select('id, title, created_at, project_id, task_type, agent_id, deleted_at')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('projects')
          .select('id, title, goal, instructions, meta, department_id, created_by, created_at, updated_at')
          .eq('department_id', workspaceId)
          .order('created_at'),
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

  useEffect(() => {
    if (!activeConvId) return
    if (sendingRef.current) return
    // Restore agent from conversation
    const conv = conversations.find(c => c.id === activeConvId)
    if (conv) setActiveRoleId(conv.agent_id ?? null)
    supabase
      .from('messages')
      .select('id, role, content, model_used, cost_eur, tokens_input, tokens_output, created_at')
      .eq('conversation_id', activeConvId)
      .order('created_at')
      .then(({ data }) => setMessages((data ?? []) as ChatMessage[]))
  }, [activeConvId])

  const messageCount = messages.length
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageCount])

  // ── Action factories ────────────────────────────────────

  const convActions = createConversationActions({
    supabase, workspaceId,
    activeConvId, activeRoleId, conversations, trashConvs, selectedIds, newProjectName,
    setConversations, setActiveConvId, setMessages, setDeleting, setConfirmDeleteId,
    setTrashConvs, setTrashCount, setTrashLoading, setProjects,
    setCreatingProject, setNewProjectName, setEditingConvId, setEditingProjectId,
    setContextMenuId, setContextMenuSubmenu, setDragConvId, setDragOverId,
    setRouting, setSelectMode, setSelectedIds, setError, setSearch,
    setPeriodFilter, setTaskFilter,
  })

  const jungleActions = createJungleActions({
    supabase, workspaceId,
    conversations, selectedIds, jungleProjects, jungleEditName,
    mergeTitle, mergeContent, mergeProjectId, mergeAfterAction,
    setError, setConversations, setProjects, setJungleModal, setJungleLoading,
    setJungleProjects, setJungleSummary, setJungleEditName, setJungleSaving,
    setMergeModal, setMergeLoading, setMergeReady, setMergeTitle, setMergeContent,
    setMergeProjectId, setMergeAfterAction, setActiveConvId, setMessages,
    setSelectMode, setSelectedIds, setToastMsg,
  })

  const chatActions = createChatActions({
    supabase, workspaceId,
    activeConvId, activeRoleId, activeCapabilityId, activeOutcomeId,
    input, sending, conversations, sendingRef,
    setInput, setSending, setError, setMessages, setRouting, setConversations,
    setMemoryExtracting,
    newConversation: convActions.newConversation,
  })

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
    workspaceId, workspaceName,
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
    deleting, routing, sending,
    error, setError,
    activeRoleId, setActiveRoleId,
    activeCapabilityId, setActiveCapabilityId,
    activeOutcomeId, setActiveOutcomeId,
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
    selectMode, setSelectMode,
    selectedIds, setSelectedIds,
    jungleLoading, projectAssignOpen, setProjectAssignOpen,
    jungleModal, setJungleModal,
    mergeModal, setMergeModal,
    trashOpen, setTrashOpen,
    trashConvs, trashCount, trashLoading,
    mergeLoading,
    mergeTitle, setMergeTitle,
    mergeContent, setMergeContent,
    mergeProjectId, setMergeProjectId,
    mergeAfterAction, setMergeAfterAction,
    mergeReady,
    mergeProjectDropOpen, setMergeProjectDropOpen,
    toastMsg,
    showMemoryModal, setShowMemoryModal,
    shareModalConvId, setShareModalConvId,
    memoryExtracting,
    isMobile, navOpen, setNavOpen,
    jungleSummary,
    jungleProjects, setJungleProjects,
    jungleEditName, setJungleEditName,
    jungleDragConv, setJungleDragConv,
    jungleSaving,
    jungleAddConvOpen, setJungleAddConvOpen,
    messagesEndRef, searchWrapRef, contextMenuRef,
    renameInputRef, projectRenameInputRef,
    escapeEditRef, escapeProjectEditRef,
    ungroupedCount, jungleActive, selectedArr,
    filteredConvs, activePeriodLabel, hasActiveFilters, contextPercent,
    userEmail, userFullName, isAdmin, userInitial, organizationId,
    ...convActions,
    ...jungleActions,
    ...chatActions,
  }
}
