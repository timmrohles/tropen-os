'use client'

import React, { useCallback } from 'react'
import ChatArea from './ChatArea'
import SessionPanel from './SessionPanel'
import SplitArtifactPanel from './SplitArtifactPanel'
import { createClient } from '@/utils/supabase/client'
import type { WorkspaceState, ChatMessage } from '@/hooks/useWorkspaceState'
import { parseArtifacts } from '@/lib/chat/parse-artifacts'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'

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
    sendDirect,
    userInitial,
    projects,
    organizationId,
    assignToProject,
    messagesEndRef,
    contextPercent,
    showMemoryModal,
    setShowMemoryModal,
    shareModalConvId,
    setShareModalConvId,
    memoryExtracting,
    chips,
    setChips,
    attachmentRef,
    isMobile,
    toastMsg,
    pendingIntention,
    setPendingIntention,
    pendingCurrentProjectId,
    setPendingCurrentProjectId,
    setMessages,
    regenerate,
    handleGuidedAction,
    isSearching,
  } = props

  const activeConvProjectId = conversations.find((c) => c.id === activeConvId)?.project_id ?? null

  const onRefreshMessages = useCallback(async () => {
    if (!activeConvId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('id, role, content, model_used, cost_eur, tokens_input, tokens_output, created_at')
      .eq('conversation_id', activeConvId)
      .order('created_at')
    if (data) setMessages(data as ChatMessage[])
  }, [activeConvId, setMessages])

  // ── Split-screen artifact panel ────────────────────────
  const [splitDismissedKey, setSplitDismissedKey] = React.useState<string | null>(null)
  const [splitWidth, setSplitWidth] = React.useState(480)
  const splitWidthRef = React.useRef(splitWidth)
  React.useEffect(() => { splitWidthRef.current = splitWidth }, [splitWidth])
  React.useEffect(() => { setSplitDismissedKey(null) }, [activeConvId])
  React.useEffect(() => {
    const stored = localStorage.getItem('split-width')
    if (stored) setSplitWidth(parseInt(stored))
  }, [])

  const splitArtifact = React.useMemo((): ArtifactSegment | null => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistant) return null
    const segments = parseArtifacts(lastAssistant.content)
    const artifacts = segments.filter(s => s.segType === 'artifact') as ArtifactSegment[]
    return artifacts.length > 0 ? artifacts[artifacts.length - 1] : null
  }, [messages])

  const splitArtifactKey = splitArtifact
    ? `${splitArtifact.name}::${splitArtifact.content.slice(0, 80)}`
    : null
  const splitActive = !!splitArtifact && splitArtifactKey !== splitDismissedKey

  function startSplitResize(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = splitWidthRef.current
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      setSplitWidth(Math.max(300, Math.min(900, startW - (ev.clientX - startX))))
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      localStorage.setItem('split-width', String(splitWidthRef.current))
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

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
        onSendDirect={sendDirect}
        onRegenerate={regenerate}
        onGuidedAction={handleGuidedAction}
        isInSplitView={splitActive}
        onAssignToProject={assignToProject}
        contextPercent={contextPercent}
        activeConvProjectId={activeConvProjectId}
        onRefreshMessages={onRefreshMessages}
        showMemoryModal={showMemoryModal}
        onSetShowMemoryModal={setShowMemoryModal}
        conversations={conversations}
        shareModalConvId={shareModalConvId}
        onSetShareModalConvId={setShareModalConvId}
        memoryExtracting={memoryExtracting}
        chips={chips}
        setChips={setChips}
        attachmentRef={attachmentRef}
        pendingIntention={pendingIntention}
        onSetPendingIntention={setPendingIntention}
        pendingCurrentProjectId={pendingCurrentProjectId}
        onSetPendingCurrentProjectId={setPendingCurrentProjectId}
        isSearching={isSearching}
      />

      {/* ── Split Artifact Panel (Desktop only) ── */}
      {!isMobile && splitActive && splitArtifact && (
        <>
          <div className="wl-resize-handle" onMouseDown={startSplitResize} aria-hidden="true" />
          <div className="wl-split-panel" style={{ width: splitWidth, flexShrink: 0 }}>
            <SplitArtifactPanel
              artifact={splitArtifact}
              conversationId={activeConvId ?? undefined}
              organizationId={organizationId ?? undefined}
              onClose={() => setSplitDismissedKey(splitArtifactKey)}
              onSendDirect={sendDirect}
            />
          </div>
        </>
      )}

      {/* ── Session Panel (Desktop only) ── */}
      {!isMobile && (
        <>
          <div className="wl-resize-handle" onMouseDown={startRightResize} aria-hidden="true" />
          <div className="wl-panel-right" style={{ width: spCollapsed ? 24 : rightWidth, flexShrink: 0 }}>
            <SessionPanel
              conversationId={activeConvId}
              activeConvProjectId={activeConvProjectId}
              projects={projects}
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
