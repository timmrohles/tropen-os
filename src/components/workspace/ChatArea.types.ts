import type { ChatMessageType, Project, Conversation } from '@/hooks/useWorkspaceState'
import type { ChipItem, AttachmentData, GuidedAction } from '@/lib/workspace-types'
import React from 'react'

export interface ChatAreaProps {
  activeConvId: string | null
  messages: ChatMessageType[]
  input: string
  sending: boolean
  error: string
  routing: { task_type: string; agent: string; model_class: string; model: string } | null
  messagesEndRef: React.RefObject<HTMLDivElement>
  userInitial: string
  projects: Project[]
  workspaceId?: string
  organizationId?: string
  onNewConversation: () => void
  onSetInput: (v: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onSendDirect: (text: string) => void
  onRegenerate: () => void
  onAssignToProject: (convId: string, projectId: string | null) => Promise<void>
  onRenameConversation?: (id: string, title: string) => void
  onDeleteConversation?: (id: string) => Promise<void>
  contextPercent: number
  activeConvProjectId: string | null
  onRefreshMessages: () => void
  showMemoryModal: boolean
  onSetShowMemoryModal: (v: boolean) => void
  conversations: Conversation[]
  shareModalConvId: string | null
  onSetShareModalConvId: (id: string | null) => void
  memoryExtracting?: boolean
  chips: ChipItem[]
  setChips: React.Dispatch<React.SetStateAction<ChipItem[]>>
  attachmentRef: React.MutableRefObject<AttachmentData | null>
  pendingIntention: 'focused' | 'guided' | null
  onSetPendingIntention: React.Dispatch<React.SetStateAction<'focused' | 'guided' | null>>
  pendingCurrentProjectId: string | null
  onSetPendingCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>
  onGuidedAction: (action: GuidedAction) => void
  onGenerateImage?: (content: string) => void
  userName?: string
  isInSplitView?: boolean
  isSearching?: boolean
  contextStartIndex?: number
  onContextReset?: () => void
  suggestionsEnabled?: boolean
  isMobile?: boolean
  searchDrawerOpen?: boolean
  onSearchDrawerClose?: () => void
  onOpenSearch?: () => void
  onOpenInNewTab?: () => void
  canOpenNewTab?: boolean
  onOpenParallelTabs?: (items: Array<{ convId: string; title: string }>) => void
  onSendDirectToConv?: (text: string, convId: string) => void
  onSendDirectToNewConv?: (text: string, convId: string, overrideClientPrefs?: Record<string, unknown>, displayText?: string) => void
  showHeaderTitle?: boolean
}
