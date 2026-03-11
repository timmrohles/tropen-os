'use client'

import React from 'react'
import { PencilSimple, FolderSimple, CaretRight, Trash } from '@phosphor-icons/react'
import LeftNav from './LeftNav'
import ChatArea from './ChatArea'
import { JungleModal } from './modals/JungleModal'
import { MergeModal } from './modals/MergeModal'
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
    // Core
    workspaceId,
    workspaceName,
    conversations,
    activeConvId,
    setActiveConvId,
    messages,
    input,
    setInput,
    search,
    setSearch,
    periodFilter,
    setPeriodFilter,
    taskFilter,
    setTaskFilter,
    dropdownOpen,
    setDropdownOpen,
    hoveredId,
    setHoveredId,
    confirmDeleteId,
    setConfirmDeleteId,
    deleting,
    routing,
    sending,
    error,

    // Projects
    projects,
    collapsedProjects,
    setCollapsedProjects,
    editingConvId,
    setEditingConvId,
    editingTitle,
    setEditingTitle,
    contextMenuId,
    setContextMenuId,
    contextMenuSubmenu,
    setContextMenuSubmenu,
    dragConvId,
    setDragConvId,
    dragOverId,
    setDragOverId,
    creatingProject,
    setCreatingProject,
    newProjectName,
    setNewProjectName,
    editingProjectId,
    setEditingProjectId,
    editingProjectName,
    setEditingProjectName,
    menuAnchor,
    setMenuAnchor,
    hoveredProjectId,
    setHoveredProjectId,

    // Multi-select / Jungle
    selectMode,
    setSelectMode,
    selectedIds,
    setSelectedIds,
    jungleLoading,

    // Jungle modal
    jungleModal,
    jungleSummary,
    jungleProjects,
    setJungleProjects,
    jungleEditName,
    setJungleEditName,
    jungleDragConv,
    setJungleDragConv,
    jungleSaving,
    jungleAddConvOpen,
    setJungleAddConvOpen,

    // Merge modal
    mergeModal,
    mergeLoading,
    mergeReady,
    mergeTitle,
    setMergeTitle,
    mergeAfterAction,
    setMergeAfterAction,
    mergeProjectId,
    setMergeProjectId,
    mergeProjectDropOpen,
    setMergeProjectDropOpen,

    // Trash
    trashOpen,
    setTrashOpen,
    trashConvs,
    trashCount,
    trashLoading,

    // Toast
    toastMsg,

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
    handleLogout,

    // Mobile
    isMobile,
    navOpen,
    setNavOpen,

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
    activeAgentId,
    setActiveAgentId,
  } = props

  // ── Panel resize ──────────────────────────────────────────
  const [leftWidth, setLeftWidth] = React.useState(() => {
    if (typeof window === 'undefined') return 260
    return parseInt(localStorage.getItem('lnav-width') ?? '260')
  })
  const [rightWidth, setRightWidth] = React.useState(() => {
    if (typeof window === 'undefined') return 340
    return parseInt(localStorage.getItem('sp-width') ?? '340')
  })
  const [spCollapsed, setSpCollapsed] = React.useState(false)
  const leftWidthRef = React.useRef(leftWidth)
  const rightWidthRef = React.useRef(rightWidth)
  React.useEffect(() => { leftWidthRef.current = leftWidth }, [leftWidth])
  React.useEffect(() => { rightWidthRef.current = rightWidth }, [rightWidth])

  function persistLeft() { localStorage.setItem('lnav-width', String(leftWidthRef.current)) }
  function persistRight() { localStorage.setItem('sp-width', String(rightWidthRef.current)) }

  function startLeftResize(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftWidthRef.current
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      setLeftWidth(Math.max(180, Math.min(420, startW + ev.clientX - startX)))
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      persistLeft()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

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
    <div className={`wl-root${isMobile ? ' wl-root--mobile' : ''}`}>

      {/* ── Mobile Header ── */}
      {isMobile && (
        <div className="wl-mobile-header">
          <button className="wl-hamburger" onClick={() => setNavOpen(v => !v)}>☰</button>
          <span className="wl-mobile-title">Tropen OS</span>
          <button className="wl-mobile-new-chat" onClick={() => newConversation()}>+</button>
        </div>
      )}

      {/* ── Mobile Overlay Backdrop ── */}
      {isMobile && navOpen && (
        <div className="wl-nav-overlay" onClick={() => setNavOpen(false)} />
      )}

      {/* ── Sidebar / LeftNav ── */}
      <div
        className={isMobile ? `wl-mobile-nav${navOpen ? ' wl-mobile-nav--open' : ' wl-mobile-nav--closed'}` : 'wl-panel-left'}
        style={isMobile ? undefined : { width: leftWidth, flexShrink: 0 }}
      >
        <LeftNav
          workspaceName={workspaceName}
          userInitial={userInitial}
          userFullName={userFullName}
          userEmail={userEmail}
          handleLogout={handleLogout}
          trashCount={trashCount}
          trashOpen={trashOpen}
          trashConvs={trashConvs}
          trashLoading={trashLoading}
          onNewConversation={newConversation}
          onNewProject={() => setCreatingProject(true)}
          onToggleTrash={() => {
            const next = !props.trashOpen
            props.setTrashOpen(next)
            if (next && props.trashConvs.length === 0) props.loadTrash()
          }}
          onRestoreConv={restoreConv}
          onHardDeleteConv={hardDeleteConv}
          conversations={conversations}
          projects={projects}
          filteredConvs={filteredConvs}
          search={search}
          periodFilter={periodFilter}
          taskFilter={taskFilter}
          dropdownOpen={dropdownOpen}
          hasActiveFilters={hasActiveFilters}
          activePeriodLabel={activePeriodLabel}
          creatingProject={creatingProject}
          newProjectName={newProjectName}
          collapsedProjects={collapsedProjects}
          editingProjectId={editingProjectId}
          editingProjectName={editingProjectName}
          hoveredProjectId={hoveredProjectId}
          dragConvId={dragConvId}
          dragOverId={dragOverId}
          selectMode={selectMode}
          searchWrapRef={searchWrapRef as unknown as React.RefObject<HTMLDivElement>}
          projectRenameInputRef={projectRenameInputRef as unknown as React.RefObject<HTMLInputElement>}
          escapeProjectEditRef={escapeProjectEditRef}
          activeConvId={activeConvId}
          hoveredId={hoveredId}
          confirmDeleteId={confirmDeleteId}
          deleting={deleting}
          editingConvId={editingConvId}
          editingTitle={editingTitle}
          contextMenuId={contextMenuId}
          selectedIds={selectedIds}
          renameInputRef={renameInputRef as unknown as React.RefObject<HTMLInputElement>}
          escapeEditRef={escapeEditRef}
          onSetSearch={setSearch}
          onSetPeriodFilter={setPeriodFilter}
          onSetTaskFilter={setTaskFilter}
          onSetDropdownOpen={setDropdownOpen}
          onSetCreatingProject={setCreatingProject}
          onSetNewProjectName={setNewProjectName}
          onCreateProject={createProject}
          onSetCollapsedProjects={(fn) => setCollapsedProjects(fn)}
          onSetEditingProjectId={setEditingProjectId}
          onSetEditingProjectName={setEditingProjectName}
          onRenameProject={renameProject}
          onDeleteProject={deleteProject}
          onSetHoveredProjectId={setHoveredProjectId}
          onSetDragConvId={setDragConvId}
          onSetDragOverId={setDragOverId}
          onAssignToProject={assignToProject}
          onSetSelectMode={(fn) => setSelectMode(fn)}
          onSetSelectedIds={(ids) => setSelectedIds(ids)}
          selectedArr={selectedArr}
          onEnterEditMode={() => setSelectMode(true)}
          onClearSelection={() => { setSelectMode(false); setSelectedIds(new Set()) }}
          onOpenMergeModal={openMergeModal}
          onBulkSoftDelete={bulkSoftDelete}
          onBulkAssignToProject={async (projectId) => {
            await Promise.all(selectedArr.map((id) => assignToProject(id, projectId)))
            setSelectMode(false)
            setSelectedIds(new Set())
          }}
          onSetActiveConvId={setActiveConvId}
          onSetHoveredId={setHoveredId}
          onSetConfirmDeleteId={setConfirmDeleteId}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          onStartEdit={(id, title) => {
            setEditingConvId(id)
            setEditingTitle(title)
          }}
          onCancelEdit={() => setEditingConvId(null)}
          onToggleSelect={toggleSelect}
          onSetContextMenuId={setContextMenuId}
          onSetMenuAnchor={setMenuAnchor}
          onSetContextMenuSubmenu={setContextMenuSubmenu}
        />
      </div>
      {!isMobile && (
        <div className="wl-resize-handle" onMouseDown={startLeftResize} aria-hidden="true" />
      )}

      {/* ── Fixed Context Menu ── */}
      {contextMenuId && menuAnchor && (() => {
        const menuConv = conversations.find((c) => c.id === contextMenuId)
        if (!menuConv) return null
        return (
          <div
            ref={contextMenuRef}
            className="wl-ctx-menu"
            style={{ position: 'fixed', top: menuAnchor.top, right: menuAnchor.right }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="wl-ctx-item" onMouseDown={(e) => {
              e.stopPropagation()
              setContextMenuId(null)
              setMenuAnchor(null)
              setEditingConvId(menuConv.id)
              setEditingTitle(menuConv.title ?? 'Unterhaltung')
            }}>
              <PencilSimple size={15} className="wl-ctx-icon" />
              Umbenennen
            </button>
            <button className="wl-ctx-item" onMouseDown={(e) => {
              e.stopPropagation()
              setContextMenuSubmenu((v) => !v)
            }}>
              <FolderSimple size={15} className="wl-ctx-icon" />
              Zu Projekt
              <CaretRight size={13} className="wl-ctx-caret" style={{ transform: contextMenuSubmenu ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s' }} />
            </button>
            {contextMenuSubmenu && (
              <div className="wl-ctx-submenu">
                {projects.length === 0 ? (
                  <div className="wl-ctx-item wl-ctx-item--disabled">Keine Projekte</div>
                ) : projects.map((p) => (
                  <button key={p.id} className="wl-ctx-item" onMouseDown={(e) => {
                    e.stopPropagation()
                    setMenuAnchor(null)
                    assignToProject(menuConv.id, p.id)
                  }}>{p.name}</button>
                ))}
              </div>
            )}
            {menuConv.project_id && (
              <button className="wl-ctx-item" onMouseDown={(e) => {
                e.stopPropagation()
                setMenuAnchor(null)
                assignToProject(menuConv.id, null)
              }}>
                <FolderSimple size={15} className="wl-ctx-icon" />
                Aus Projekt entfernen
              </button>
            )}
            <div className="wl-ctx-divider" />
            <button className="wl-ctx-item wl-ctx-item--danger" onMouseDown={(e) => {
              e.stopPropagation()
              setContextMenuId(null)
              setMenuAnchor(null)
              setConfirmDeleteId(menuConv.id)
            }}>
              <Trash size={15} />
              Löschen
            </button>
          </div>
        )
      })()}

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


      {/* ── JungleModal ── */}
      <JungleModal
        jungleLoading={jungleLoading}
        jungleModal={jungleModal}
        jungleSummary={jungleSummary}
        jungleProjects={jungleProjects}
        jungleEditName={jungleEditName}
        jungleSaving={jungleSaving}
        jungleAddConvOpen={jungleAddConvOpen}
        jungleDragConv={jungleDragConv}
        conversations={conversations}
        onClose={() => props.setJungleModal(false)}
        onApply={jungleApply}
        onEditName={(i: number, name: string) => setJungleEditName((prev) => ({ ...prev, [i]: name }))}
        onMoveConv={jungleMoveConv}
        onRemoveConv={jungleRemoveConv}
        onRemoveProject={jungleRemoveProject}
        onAddFolder={() => setJungleProjects((prev) => [
          ...prev,
          { name: 'Neuer Ordner', emoji: '', conversations: [], reason: '' }
        ])}
        onAddConvToFolder={(convId: string, i: number) => setJungleProjects((prev) =>
          prev.map((p, idx) => idx === i ? { ...p, conversations: [...p.conversations, convId] } : p)
        )}
        onSetJungleDragConv={setJungleDragConv}
        onSetJungleAddConvOpen={setJungleAddConvOpen}
      />

      {/* ── MergeModal ── */}
      <MergeModal
        mergeModal={mergeModal}
        mergeLoading={mergeLoading}
        mergeReady={mergeReady}
        mergeTitle={mergeTitle}
        mergeAfterAction={mergeAfterAction}
        mergeProjectId={mergeProjectId}
        mergeProjectDropOpen={mergeProjectDropOpen}
        projects={projects}
        selectedIds={selectedIds}
        conversations={conversations}
        selectedArr={selectedArr}
        onClose={() => props.setMergeModal(false)}
        onApply={applyMerge}
        onSetMergeTitle={(v: string) => setMergeTitle(v)}
        onSetMergeAfterAction={(v: 'trash' | 'keep' | 'delete') => setMergeAfterAction(v)}
        onSetMergeProjectId={(id: string | null) => setMergeProjectId(id)}
        onSetMergeProjectDropOpen={(v: boolean) => setMergeProjectDropOpen(v)}
      />

    </div>
  )
}
