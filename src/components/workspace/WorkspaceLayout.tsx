'use client'

import React from 'react'
import ChatArea from './ChatArea'
import SessionPanel from './SessionPanel'
import type { WorkspaceState } from '@/hooks/useWorkspaceState'

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

type WorkspaceLayoutProps = WorkspaceState

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const {
    workspaceId,
    activeConvId,
    conversations,
    messages,
    input,
    setInput,
    sending,
    error,
    routing,
    newConversation,
    sendMessage,
    userInitial,
    projects,
    organizationId,
    assignToProject,
    activeAgentId,
    setActiveAgentId,
    activeCapabilityId,
    setActiveCapabilityId,
    activeOutcomeId,
    setActiveOutcomeId,
    messagesEndRef,
    contextPercent,
    showMemoryModal,
    setShowMemoryModal,
    isMobile,
    toastMsg,
  } = props

  const activeConvProjectId = conversations.find((c) => c.id === activeConvId)?.project_id ?? null

  // ── Right panel resize ─────────────────────────────────
  const [rightWidth, setRightWidth] = React.useState(340)
  const [spCollapsed, setSpCollapsed] = React.useState(false)
  const rightWidthRef = React.useRef(rightWidth)
  React.useEffect(() => { rightWidthRef.current = rightWidth }, [rightWidth])
  React.useEffect(() => {
    const stored = localStorage.getItem('sp-width')
    if (stored) setRightWidth(parseInt(stored))
  }, [])

  function persistRight() { localStorage.setItem('sp-width', String(rightWidthRef.current)) }

  function startRightResize(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = rightWidthRef.current
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      setRightWidth(Math.max(220, Math.min(520, startW - (ev.clientX - startX))))
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      persistRight()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div className="wl-root">

      {/* ── Chat Area ── */}
      <ChatArea
        activeConvId={activeConvId}
        messages={messages}
        input={input}
        sending={sending}
        error={error}
        routing={routing}
        messagesEndRef={messagesEndRef as unknown as React.RefObject<HTMLDivElement>}
        userInitial={userInitial}
        projects={projects}
        workspaceId={workspaceId}
        organizationId={organizationId ?? undefined}
        onNewConversation={newConversation}
        onSetInput={(v) => setInput(v)}
        onSendMessage={sendMessage}
        onAssignToProject={assignToProject}
        activeAgentId={activeAgentId}
        onSetActiveAgentId={setActiveAgentId}
        activeCapabilityId={activeCapabilityId}
        onSetActiveCapabilityId={setActiveCapabilityId}
        activeOutcomeId={activeOutcomeId}
        onSetActiveOutcomeId={setActiveOutcomeId}
        contextPercent={contextPercent}
        activeConvProjectId={activeConvProjectId}
        showMemoryModal={showMemoryModal}
        onSetShowMemoryModal={setShowMemoryModal}
      />

      {/* ── Session Panel (Desktop only) ── */}
      {!isMobile && (
        <>
          <div className="wl-resize-handle" onMouseDown={startRightResize} aria-hidden="true" />
          <div className="wl-panel-right" style={{ width: spCollapsed ? 24 : rightWidth, flexShrink: 0 }}>
            <SessionPanel
              conversationId={activeConvId}
              messages={messages}
              routing={routing}
              onNewConversation={newConversation}
              collapsed={spCollapsed}
              onToggleCollapse={() => setSpCollapsed(v => !v)}
            />
          </div>
        </>
      )}

      {/* ── Toast ── */}
      {toastMsg && <div className="wl-toast">{toastMsg}</div>}

    </div>
  )
}
