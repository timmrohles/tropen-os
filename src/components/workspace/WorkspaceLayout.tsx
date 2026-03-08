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
// Styles
// ─────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  layout: { display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-chat)' },

  // ── Context Menu ─────────────────────────────────────────
  contextMenu: {
    position: 'absolute', right: 0, top: '100%', zIndex: 200,
    background: '#161616', border: '1px solid #252525',
    borderRadius: 8, padding: '4px 0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    minWidth: 160, display: 'flex', flexDirection: 'column',
  },
  contextMenuItem: {
    background: 'none', border: 'none', color: '#aaa',
    fontSize: 12, padding: '7px 14px', cursor: 'pointer',
    textAlign: 'left', width: '100%', display: 'block',
  },
  submenu: { borderTop: '1px solid #252525', paddingTop: 2 },

  // ── Action Bar ───────────────────────────────────────────
  actionBar: {
    position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 10, padding: '10px 14px',
    display: 'flex', alignItems: 'center', gap: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 300,
    backdropFilter: 'blur(8px)',
  },
  actionCount: { fontSize: 11, color: '#555', marginRight: 4, whiteSpace: 'nowrap' },
  actionBtn: {
    background: '#252525', border: '1px solid #333', color: '#ccc',
    fontSize: 12, fontWeight: 600, padding: '7px 12px',
    borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  actionCancel: {
    background: 'none', border: 'none', color: '#444',
    fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
  },
  actionDropdown: {
    position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
    background: '#161616', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '4px 0', minWidth: 160,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  actionDropdownItem: {
    display: 'block', width: '100%', background: 'none', border: 'none',
    color: '#aaa', fontSize: 12, padding: '7px 14px',
    textAlign: 'left', cursor: 'pointer',
  },

  // ── Mobile ───────────────────────────────────────────────
  mobileHeader: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 48,
    background: '#0a0a0a', borderBottom: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
    zIndex: 40, flexShrink: 0,
  },
  hamburger: {
    background: 'transparent', border: 'none', color: '#e5e5e5',
    fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
  },
  mobileTitle: { fontSize: 15, fontWeight: 700, color: '#fff', flex: 1 },
  mobileNewChat: {
    background: '#14b8a6', border: 'none', color: '#000',
    width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
    fontSize: 18, fontWeight: 700,
  },
  navOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49,
  },

  // ── Toast ────────────────────────────────────────────────
  toast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: '#0d2926', border: '1px solid #14b8a6', color: '#14b8a6',
    padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    zIndex: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
  },
}

function mobileNavStyle(navOpen: boolean): React.CSSProperties {
  return {
    position: 'fixed', top: 48, left: 0, bottom: 0, zIndex: 50,
    transform: navOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.2s ease',
    width: 240,
  }
}

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
    <div style={{ ...s.layout, ...(isMobile ? { paddingTop: 48 } : {}) }}>

      {/* ── Mobile Header ── */}
      {isMobile && (
        <div style={s.mobileHeader}>
          <button style={s.hamburger} onClick={() => setNavOpen(v => !v)}>☰</button>
          <span style={s.mobileTitle}>Tropen OS</span>
          <button style={s.mobileNewChat} onClick={newConversation}>+</button>
        </div>
      )}

      {/* ── Mobile Overlay Backdrop ── */}
      {isMobile && navOpen && (
        <div
          style={s.navOverlay}
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* ── Sidebar / LeftNav ── */}
      <div style={isMobile ? mobileNavStyle(navOpen) : undefined}>
      <LeftNav
        // Direct LeftNav props
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

        // ProjectSidebar props
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
            style={{ ...s.contextMenu, position: 'fixed', top: menuAnchor.top, right: menuAnchor.right }}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={s.contextMenuItem} onMouseDown={(e) => {
              e.stopPropagation()
              setContextMenuId(null)
              setMenuAnchor(null)
              setEditingConvId(menuConv.id)
              setEditingTitle(menuConv.title ?? 'Unterhaltung')
            }}>Umbenennen</button>
            <button style={s.contextMenuItem} onMouseDown={(e) => {
              e.stopPropagation()
              setContextMenuSubmenu((v) => !v)
            }}>Zu Projekt {contextMenuSubmenu ? '▾' : '▸'}</button>
            {contextMenuSubmenu && (
              <div style={s.submenu}>
                {projects.length === 0 ? (
                  <div style={{ ...s.contextMenuItem, color: '#555', cursor: 'default', pointerEvents: 'none' }}>
                    Keine Projekte
                  </div>
                ) : projects.map((p) => (
                  <button key={p.id} style={s.contextMenuItem} onMouseDown={(e) => {
                    e.stopPropagation()
                    setMenuAnchor(null)
                    assignToProject(menuConv.id, p.id)
                  }}>{p.name}</button>
                ))}
              </div>
            )}
            {menuConv.project_id && (
              <button style={s.contextMenuItem} onMouseDown={(e) => {
                e.stopPropagation()
                setMenuAnchor(null)
                assignToProject(menuConv.id, null)
              }}>Aus Projekt entfernen</button>
            )}
            <button style={{ ...s.contextMenuItem, color: '#ef4444' }} onMouseDown={(e) => {
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
      {toastMsg && <div style={s.toast}>{toastMsg}</div>}

      {/* ── Multi-Select Aktionsleiste ── */}
      {selectMode && selectedArr.length >= 2 && (
        <div style={s.actionBar}>
          <span style={s.actionCount}>{selectedArr.length} ausgewählt</span>
          <button style={{ ...s.actionBtn, display: 'flex', alignItems: 'center', gap: 5 }} onClick={openMergeModal}>
            <Parrot size={13} /> Zusammenführen
          </button>
          <button style={{ ...s.actionBtn, color: '#ef4444' }} onClick={bulkSoftDelete}>
            Löschen
          </button>
          <div style={{ position: 'relative' }}>
            <button style={s.actionBtn} onClick={() => setProjectAssignOpen((v) => !v)}>
              Verschieben ▾
            </button>
            {projectAssignOpen && (
              <div style={s.actionDropdown}>
                {projects.length === 0 ? (
                  <div style={{ ...s.actionDropdownItem, color: '#555', pointerEvents: 'none' }}>
                    Keine Projekte
                  </div>
                ) : projects.map((p) => (
                  <button key={p.id} style={s.actionDropdownItem} onClick={() => {
                    selectedArr.forEach((id) => assignToProject(id, p.id))
                    setSelectMode(false)
                    setSelectedIds(new Set())
                    setProjectAssignOpen(false)
                  }}>{p.name}</button>
                ))}
              </div>
            )}
          </div>
          <button style={s.actionCancel} onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}>×</button>
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
