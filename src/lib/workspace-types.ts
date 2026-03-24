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
  agent_id: string | null
  deleted_at: string | null
  intention: 'focused' | 'open' | null
  current_project_id: string | null
  drift_detected: boolean | null
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
  conversations?: string[]
}

// ─── Guided Chat Mode types ───────────────────────────────────────────────

export interface GuidedOption {
  label: string
  value: string
  isCustom?: boolean
}

export interface GuidedStep {
  id: string
  phase: 'scout' | 'planner' | 'executor'
  question: string
  options: GuidedOption[]
}

export interface GuidedAnswer {
  stepId: string
  question: string
  answer: string
}

export interface GuidedData {
  type: 'picker' | 'step' | 'summary'
  steps: GuidedStep[]
  currentStepIndex: number
  answers: GuidedAnswer[]
  originalMessage: string
  category: string
  convId: string
}

export type GuidedAction =
  | { type: 'select_mode'; messageId: string; mode: 'guided' | 'direct' | 'open' }
  | { type: 'answer_step'; messageId: string; value: string; label: string }
  | { type: 'confirm_summary'; messageId: string }
  | { type: 'edit_step'; messageId: string; stepIndex: number }

// ─────────────────────────────────────────────────────────

export interface SearchSource {
  url: string
  title: string
  page_age?: string
}

export interface ChatMessage extends Pick<Message, 'role' | 'content' | 'model_used' | 'cost_eur' | 'tokens_input' | 'tokens_output'> {
  id?: string
  pending?: boolean
  guidedData?: GuidedData
  sources?: SearchSource[]
  link_previews?: boolean
}

export interface ChipItem {
  label: string
  prompt: string
}

export type AttachmentMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'

export interface AttachmentData {
  name: string
  mediaType: AttachmentMediaType
  base64: string
  sizeKb: number
}

export interface JungleProject {
  name: string
  emoji: string
  conversations: string[]
  reason: string
}

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

export function defaultConvTitle(): string {
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
    const ago = new Date(); ago.setDate(now.getDate() - 7); return d >= ago
  }
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

// ─────────────────────────────────────────────────────────
// WorkspaceState Interface
// ─────────────────────────────────────────────────────────

export interface WorkspaceState {
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
  trashOpen: boolean
  setTrashOpen: React.Dispatch<React.SetStateAction<boolean>>
  trashConvs: Conversation[]
  trashCount: number
  trashLoading: boolean
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
  showMemoryModal: boolean
  setShowMemoryModal: React.Dispatch<React.SetStateAction<boolean>>
  shareModalConvId: string | null
  setShareModalConvId: React.Dispatch<React.SetStateAction<string | null>>
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
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  searchWrapRef: React.RefObject<HTMLDivElement | null>
  contextMenuRef: React.RefObject<HTMLDivElement | null>
  renameInputRef: React.RefObject<HTMLInputElement | null>
  projectRenameInputRef: React.RefObject<HTMLInputElement | null>
  escapeEditRef: React.MutableRefObject<boolean>
  escapeProjectEditRef: React.MutableRefObject<boolean>
  ungroupedCount: number
  jungleActive: boolean
  selectedArr: string[]
  filteredConvs: Conversation[]
  activePeriodLabel: string | undefined
  hasActiveFilters: boolean
  contextPercent: number
  chips: ChipItem[]
  setChips: React.Dispatch<React.SetStateAction<ChipItem[]>>
  attachmentRef: React.MutableRefObject<AttachmentData | null>
  memoryExtracting: boolean
  isSearching: boolean
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
  pendingIntention: 'focused' | 'open' | null
  setPendingIntention: React.Dispatch<React.SetStateAction<'focused' | 'open' | null>>
  pendingCurrentProjectId: string | null
  setPendingCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>
  isMobile: boolean
  navOpen: boolean
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>
  userEmail: string
  userFullName: string
  isAdmin: boolean
  userInitial: string
  organizationId: string | null
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
  sendDirect: (text: string) => Promise<void>
  regenerate: () => Promise<void>
  handleGuidedAction: (action: GuidedAction) => void
  logout: () => Promise<void>
  handleLogout: () => Promise<void>
}
