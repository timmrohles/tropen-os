'use client'

import React from 'react'
import BookmarksDrawer from './BookmarksDrawer'
import SearchDrawer from './SearchDrawer'
import MemorySaveModal from './MemorySaveModal'
import ShareModal from './ShareModal'
import type { Conversation } from '@/hooks/useWorkspaceState'

interface ChatModalsProps {
  activeConvId: string
  bookmarksDrawerOpen: boolean
  onBookmarksDrawerClose: () => void
  onUseBookmarkAsPrompt: (text: string) => void
  searchDrawerOpen: boolean
  onSearchDrawerClose: () => void
  workspaceId?: string
  showMemoryModal: boolean
  onSetShowMemoryModal: (v: boolean) => void
  activeConvProjectId: string | null
  shareModalConvId: string | null
  conversations: Conversation[]
  onSetShareModalConvId: (id: string | null) => void
}

export default function ChatModals({
  activeConvId,
  bookmarksDrawerOpen,
  onBookmarksDrawerClose,
  onUseBookmarkAsPrompt,
  searchDrawerOpen,
  onSearchDrawerClose,
  workspaceId,
  showMemoryModal,
  onSetShowMemoryModal,
  activeConvProjectId,
  shareModalConvId,
  conversations,
  onSetShareModalConvId,
}: ChatModalsProps) {
  return (
    <>
      <BookmarksDrawer
        open={bookmarksDrawerOpen}
        onClose={onBookmarksDrawerClose}
        conversationId={activeConvId}
        onUseAsPrompt={onUseBookmarkAsPrompt}
      />
      <SearchDrawer
        open={searchDrawerOpen}
        onClose={onSearchDrawerClose}
        workspaceId={workspaceId}
      />
      {activeConvProjectId && (
        <MemorySaveModal
          open={showMemoryModal}
          onClose={() => onSetShowMemoryModal(false)}
          projectId={activeConvProjectId}
          conversationId={activeConvId}
        />
      )}
      {shareModalConvId && (
        <ShareModal
          convId={shareModalConvId}
          convTitle={conversations.find(c => c.id === shareModalConvId)?.title ?? null}
          onClose={() => onSetShareModalConvId(null)}
        />
      )}
    </>
  )
}
