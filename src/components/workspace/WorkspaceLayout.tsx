'use client'

import React from 'react'
import Parrot from '@/components/Parrot'
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
    projectAssignOpen,
    setProjectAssignOpen,

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
  } = props

  return (
    <div className={`wl-root${isMobile ? ' wl-root--mobile' : ''}`}>

      {/* ── Mobile Header ── */}
      {isMobile && (
        <div className="wl-mobile-header">
          <button className="wl-hamburger" onClick={() => setNavOpen(v => !v)}>☰</button>
          <span className="wl-mobile-title">Tropen OS</span>
          <button className="wl-mobile-new-chat" onClick={newConversation}>+</button>
        </div>
      )}

      {/* ── Mobile Overlay Backdrop ── */}
      {isMobile && navOpen && (
        <div className="wl-nav-overlay" onClick={() => setNavOpen(false)} />
      )}

      {/* ── Sidebar / LeftNav ── */}
      <div className={isMobile ? `wl-mobile-nav${navOpen ? ' wl-mobile-nav--open' : ' wl-mobile-nav--closed'}` : undefined}>
        <LeftNav
          workspaceName={workspaceName}
          isAdmin={isAdmin}
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
          jungleActive={jungleActive}
          jungleLoading={jungleLoading}
          ungroupedCount={ungroupedCount}
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
          onOpenJungleModal={openJungleModal}
          onSetSelectMode={(fn) => setSelectMode(fn)}
          onSetSelectedIds={(ids) => setSelectedIds(ids)}
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
            }}>Umbenennen</button>
            <button className="wl-ctx-item" onMouseDown={(e) => {
              e.stopPropagation()
              setContextMenuSubmenu((v) => !v)
            }}>Zu Projekt {contextMenuSubmenu ? '▾' : '▸'}</button>
            {contextMenuSubmenu && (
              <div className="wl-ctx-submenu">
                {projects.length === 0 ? (
                  <div className="wl-ctx-item wl-ctx-item--disabled">
                    Keine Projekte
                  </div>
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
              }}>Aus Projekt entfernen</button>
            )}
            <button className="wl-ctx-item wl-ctx-item--danger" onMouseDown={(e) => {
              e.stopPropagation()
              setContextMenuId(null)
              setMenuAnchor(null)
              setConfirmDeleteId(menuConv.id)
            }}>Löschen</button>
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
        onNewConversation={newConversation}
        onSetInput={(v) => setInput(v)}
        onSendMessage={sendMessage}
      />

      {/* ── Session Panel (Desktop only) ── */}
      {!isMobile && (
        <SessionPanel
          conversationId={activeConvId}
          messages={messages}
          routing={routing}
          onNewConversation={newConversation}
        />
      )}

      {/* ── Toast ── */}
      {toastMsg && <div className="wl-toast">{toastMsg}</div>}

      {/* ── Multi-Select Aktionsleiste ── */}
      {selectMode && selectedArr.length >= 2 && (
        <div className="wl-action-bar">
          <span className="wl-action-count">{selectedArr.length} ausgewählt</span>
          <button className="wl-action-btn wl-action-btn--flex" onClick={openMergeModal}>
            <Parrot size={13} /> Zusammenführen
          </button>
          <button className="wl-action-btn wl-action-btn--danger" onClick={bulkSoftDelete}>
            Löschen
          </button>
          <div className="wl-action-dropdown-wrap">
            <button className="wl-action-btn" onClick={() => setProjectAssignOpen((v) => !v)}>
              Verschieben ▾
            </button>
            {projectAssignOpen && (
              <div className="wl-action-dropdown">
                {projects.length === 0 ? (
                  <div className="wl-action-dropdown-item wl-action-dropdown-item--disabled">
                    Keine Projekte
                  </div>
                ) : projects.map((p) => (
                  <button key={p.id} className="wl-action-dropdown-item" onClick={() => {
                    selectedArr.forEach((id) => assignToProject(id, p.id))
                    setSelectMode(false)
                    setSelectedIds(new Set())
                    setProjectAssignOpen(false)
                  }}>{p.name}</button>
                ))}
              </div>
            )}
          </div>
          <button className="wl-action-cancel" onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}>×</button>
        </div>
      )}

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
