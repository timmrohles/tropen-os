'use client'

import React, { useState } from 'react'
import { ArrowsMerge, FolderSimple, Trash, X } from '@phosphor-icons/react'
import type { ChatMessageType, Project } from '@/hooks/useWorkspaceState'
import EmptyState from './EmptyState'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface ChatAreaProps {
  activeConvId: string | null
  messages: ChatMessageType[]
  input: string
  sending: boolean
  error: string
  routing: { task_type: string; agent: string; model_class: string; model: string } | null
  messagesEndRef: React.RefObject<HTMLDivElement>
  userInitial: string
  selectMode: boolean
  selectedArr: string[]
  projects: Project[]
  onNewConversation: () => void
  onSetInput: (v: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onOpenMergeModal: () => void
  onBulkSoftDelete: () => void
  onAssignToProject: (convId: string, projectId: string | null) => Promise<void>
  onClearSelection: () => void
}

export default function ChatArea({
  activeConvId,
  messages,
  input,
  sending,
  error,
  routing,
  messagesEndRef,
  userInitial,
  selectMode,
  selectedArr,
  projects,
  onNewConversation,
  onSetInput,
  onSendMessage,
  onOpenMergeModal,
  onBulkSoftDelete,
  onAssignToProject,
  onClearSelection,
}: ChatAreaProps) {
  const [moveDropOpen, setMoveDropOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const showSelBar = selectMode && selectedArr.length > 0

  function handleClose() {
    onClearSelection()
    setMoveDropOpen(false)
    setConfirmDelete(false)
  }

  return (
    <div className="carea">
      {!activeConvId ? (
        <EmptyState
          onNewConversation={onNewConversation}
          input={input}
          setInput={onSetInput}
          sending={sending}
          onSubmit={onSendMessage}
        />
      ) : (
        <>
          <div className="carea-messages">
            {messages.map((msg, i) => (
              <ChatMessage key={msg.id ?? i} msg={msg} userInitial={userInitial} />
            ))}
            {error && <div className="carea-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>
          {routing && (
            <div className="carea-routing-meta">
              <span>{routing.model}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.model_class}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.task_type}</span>
              <span className="carea-routing-dot">·</span>
              <span>🌱</span>
            </div>
          )}
          {showSelBar ? (
            <div className="carea-sel-bar">
              {confirmDelete ? (
                <>
                  <span className="carea-sel-count">
                    {selectedArr.length} Chat{selectedArr.length !== 1 ? 's' : ''} löschen?
                  </span>
                  <button className="carea-sel-btn carea-sel-btn--secondary" onClick={() => setConfirmDelete(false)}>
                    Abbrechen
                  </button>
                  <button className="carea-sel-btn carea-sel-btn--danger" onClick={() => { onBulkSoftDelete(); setConfirmDelete(false) }}>
                    <Trash size={16} />
                    Endgültig löschen
                  </button>
                </>
              ) : (
                <>
                  <span className="carea-sel-count">
                    {selectedArr.length} Chat{selectedArr.length !== 1 ? 's' : ''} ausgewählt
                  </span>

                  {selectedArr.length >= 2 && (
                    <button className="carea-sel-btn carea-sel-btn--merge" onClick={onOpenMergeModal}>
                      <ArrowsMerge size={16} />
                      Zusammenführen
                    </button>
                  )}

                  <div className="carea-sel-dropdown-wrap">
                    <button className="carea-sel-btn carea-sel-btn--secondary" onClick={() => setMoveDropOpen((v) => !v)}>
                      <FolderSimple size={16} />
                      Verschieben
                    </button>
                    {moveDropOpen && (
                      <div className="carea-sel-dropdown">
                        {projects.length === 0 ? (
                          <div className="carea-sel-dropdown-item carea-sel-dropdown-item--disabled">Keine Projekte</div>
                        ) : projects.map((p) => (
                          <button key={p.id} className="carea-sel-dropdown-item" onClick={() => {
                            selectedArr.forEach((id) => onAssignToProject(id, p.id))
                            onClearSelection()
                            setMoveDropOpen(false)
                          }}>{p.name}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="carea-sel-btn carea-sel-btn--secondary" onClick={() => { setConfirmDelete(true); setMoveDropOpen(false) }}>
                    <Trash size={16} />
                    Löschen
                  </button>

                  <button className="carea-sel-close" onClick={handleClose}>
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="carea-input-wrap">
              <ChatInput input={input} setInput={onSetInput} sending={sending} onSubmit={onSendMessage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
