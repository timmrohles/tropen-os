'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/utils/supabase/client'
import { MagnifyingGlass, Plus, FolderSimple, Trash, X, ChatCircle, ShareNetwork } from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'

interface ConvItem {
  id: string
  title: string | null
  created_at: string
  project_id: string | null
}

interface ProjectItem {
  id: string
  title: string
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Minute${mins === 1 ? '' : 'n'}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `vor ${hours} Stunde${hours === 1 ? '' : 'n'}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `vor ${days} Tag${days === 1 ? '' : 'en'}`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `vor ${weeks} Woche${weeks === 1 ? '' : 'n'}`
  const months = Math.floor(days / 30)
  return `vor ${months} Monat${months === 1 ? '' : 'en'}`
}

// ─── Shared button styles ─────────────────────────────────────────────────────

const iconBtnBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 'var(--radius-sm)',
  background: 'transparent', border: 'none', cursor: 'pointer',
  transition: 'all var(--t-fast)',
}

// ─── FolderDropdown ───────────────────────────────────────────────────────────

interface FolderDropdownProps {
  conv: ConvItem
  projects: ProjectItem[]
  isOpen: boolean
  menuRef: React.RefObject<HTMLDivElement | null>
  onToggle: () => void
  onAssign: (convId: string, projectId: string | null) => void
}

function FolderDropdown({ conv, projects, isOpen, menuRef, onToggle, onAssign }: FolderDropdownProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        aria-label="Ordner zuweisen"
        title="Ordner zuweisen"
        onClick={onToggle}
        style={{
          ...iconBtnBase,
          background: isOpen ? 'var(--bg-inset, rgba(0,0,0,0.06))' : 'transparent',
          color: isOpen ? 'var(--accent)' : 'var(--text-tertiary)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset, rgba(0,0,0,0.06))'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)' }}
        onMouseLeave={e => {
          if (!isOpen) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
          }
        }}
      >
        <FolderSimple size={15} weight="bold" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute', top: '100%', right: 0, zIndex: 100,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            minWidth: 180, padding: '4px 0', marginTop: 4,
          }}
        >
          <div style={{ padding: '6px 12px 4px', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ordner zuweisen
          </div>
          <FolderOption
            label="Kein Ordner"
            active={conv.project_id === null}
            onClick={() => onAssign(conv.id, null)}
          />
          {projects.length > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
          {projects.map(p => (
            <FolderOption
              key={p.id}
              label={p.title}
              active={conv.project_id === p.id}
              onClick={() => onAssign(conv.id, p.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FolderOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
        fontSize: 13, color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
        background: 'transparent', border: 'none', cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset, rgba(0,0,0,0.04))' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {label}
    </button>
  )
}

// ─── DeleteAction ─────────────────────────────────────────────────────────────

interface DeleteActionProps {
  convId: string
  isConfirming: boolean
  onConfirm: () => void
  onDelete: () => void
  onCancel: () => void
}

function DeleteAction({ convId, isConfirming, onConfirm, onDelete, onCancel }: DeleteActionProps) {
  if (isConfirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--error)' }}>Löschen?</span>
        <button
          onClick={onDelete}
          style={{
            padding: '2px 8px', fontSize: 12, fontWeight: 600,
            background: 'var(--error)', color: 'var(--text-inverse)',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          Ja
        </button>
        <button
          onClick={onCancel}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)',
          }}
        >
          <X size={13} weight="bold" />
        </button>
      </div>
    )
  }
  return (
    <button
      aria-label="Chat löschen"
      title="Chat löschen"
      onClick={onConfirm}
      style={{ ...iconBtnBase, color: 'var(--text-tertiary)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--error-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
    >
      <Trash size={15} weight="bold" />
    </button>
  )
}

// ─── ConvRow ──────────────────────────────────────────────────────────────────

interface ConvRowProps {
  conv: ConvItem
  projects: ProjectItem[]
  workspaceName: string
  isLast: boolean
  isFolderOpen: boolean
  isConfirmDelete: boolean
  folderMenuRef: React.RefObject<HTMLDivElement | null>
  onNavigate: (id: string) => void
  onToggleFolder: () => void
  onAssign: (convId: string, projectId: string | null) => void
  onWorkspacePicker: () => void
  onConfirmDelete: () => void
  onDelete: () => void
  onCancelDelete: () => void
}

function ConvRow({
  conv, projects, workspaceName, isLast, isFolderOpen, isConfirmDelete,
  folderMenuRef, onNavigate, onToggleFolder, onAssign,
  onWorkspacePicker, onConfirmDelete, onDelete, onCancelDelete,
}: ConvRowProps) {
  const assignedProject = projects.find(p => p.id === conv.project_id)

  return (
    <div
      style={{
        position: 'relative',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 8 }} className="chat-list-row">
        <button
          onClick={() => onNavigate(conv.id)}
          style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, minWidth: 0 }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conv.title || 'Neuer Chat'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {formatRelative(conv.created_at)}
            {assignedProject && (
              <> · <span style={{ color: 'var(--accent)' }}>{assignedProject.title}</span></>
            )}
            {workspaceName && (
              <> in <strong style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{workspaceName}</strong></>
            )}
          </div>
        </button>

        <div className="chat-list-actions" style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <FolderDropdown
            conv={conv}
            projects={projects}
            isOpen={isFolderOpen}
            menuRef={folderMenuRef}
            onToggle={onToggleFolder}
            onAssign={onAssign}
          />

          <button
            aria-label="In Workspace ablegen"
            title="In Workspace ablegen"
            onClick={onWorkspacePicker}
            style={{ ...iconBtnBase, color: 'var(--text-tertiary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
          >
            <ShareNetwork size={14} weight="bold" />
          </button>

          <DeleteAction
            convId={conv.id}
            isConfirming={isConfirmDelete}
            onConfirm={onConfirmDelete}
            onDelete={onDelete}
            onCancel={onCancelDelete}
          />
        </div>
      </div>
    </div>
  )
}

// ─── ChatListClient ───────────────────────────────────────────────────────────

export default function ChatListClient({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [conversations, setConversations] = useState<ConvItem[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [workspaceName, setWorkspaceName] = useState('')
  const [search, setSearch] = useState('')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [workspacePicker, setWorkspacePicker] = useState<{ id: string; title: string } | null>(null)
  const folderMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const [{ data: ws }, { data: convs }, { data: projs }] = await Promise.all([
        supabase.from('departments').select('name').eq('id', workspaceId).single(),
        supabase
          .from('conversations')
          .select('id, title, created_at, project_id')
          .eq('workspace_id', workspaceId)
          .eq('conversation_type', 'chat')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('projects')
          .select('id, title')
          .eq('department_id', workspaceId)
          .order('created_at'),
      ])
      if (ws) setWorkspaceName((ws as { name: string }).name)
      setConversations((convs ?? []) as ConvItem[])
      setProjects((projs ?? []) as ProjectItem[])
      setLoading(false)
    }
    load()
  }, [workspaceId, supabase])

  useEffect(() => {
    if (!openFolderMenuId) return
    function onDown(e: MouseEvent) {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setOpenFolderMenuId(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openFolderMenuId])

  const filtered = conversations.filter(c => {
    const matchesSearch = !search.trim() || (c.title ?? '').toLowerCase().includes(search.trim().toLowerCase())
    const matchesProject = activeProjectId === null || c.project_id === activeProjectId
    return matchesSearch && matchesProject
  })

  function handleNewChat() { router.push('/chat/new') }

  async function handleDelete(id: string) {
    setConversations(prev => prev.filter(c => c.id !== id))
    setConfirmDeleteId(null)
    await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
  }

  async function handleAssign(convId: string, projectId: string | null) {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, project_id: projectId } : c)
    )
    setOpenFolderMenuId(null)
    await supabase
      .from('conversations')
      .update({ project_id: projectId })
      .eq('id', convId)
  }

  function renderList() {
    if (loading) {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
          Lade Chats…
        </div>
      )
    }
    if (filtered.length === 0) {
      return <EmptyChatState search={search} activeProjectId={activeProjectId} onNewChat={handleNewChat} />
    }
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'visible', background: 'var(--bg-surface)' }}>
        {filtered.map((conv, i) => (
          <ConvRow
            key={conv.id}
            conv={conv}
            projects={projects}
            workspaceName={workspaceName}
            isLast={i === filtered.length - 1}
            isFolderOpen={openFolderMenuId === conv.id}
            isConfirmDelete={confirmDeleteId === conv.id}
            folderMenuRef={folderMenuRef}
            onNavigate={id => router.push(`/chat/${id}`)}
            onToggleFolder={() => setOpenFolderMenuId(prev => prev === conv.id ? null : conv.id)}
            onAssign={handleAssign}
            onWorkspacePicker={() => setWorkspacePicker({ id: conv.id, title: conv.title ?? 'Chat' })}
            onConfirmDelete={() => setConfirmDeleteId(conv.id)}
            onDelete={() => handleDelete(conv.id)}
            onCancelDelete={() => setConfirmDeleteId(null)}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="content-max"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - var(--topbar-height))',
        overflow: 'hidden',
        paddingBottom: 0,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div className="page-header">
          <div className="page-header-text">
            <h1 className="page-header-title">
              <ChatCircle size={22} color="var(--accent)" weight="fill" aria-hidden="true" />
              Chats
            </h1>
            <p className="page-header-sub">Deine Konversationen mit Toro</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={handleNewChat}>
              <Plus size={14} weight="bold" aria-hidden="true" />
              Neuer Chat
            </button>
          </div>
        </div>

        <div className="search-bar-container">
          <MagnifyingGlass
            size={14} weight="bold" aria-hidden="true"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            className="input"
            placeholder="Chats durchsuchen …"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        <div className="page-filter-row" style={{ marginBottom: 16 }}>
          <button
            className={`chip${activeProjectId === null ? ' chip--active' : ''}`}
            onClick={() => setActiveProjectId(null)}
          >
            Alle
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              className={`chip${activeProjectId === p.id ? ' chip--active' : ''}`}
              onClick={() => setActiveProjectId(prev => prev === p.id ? null : p.id)}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 48 }}>
        {renderList()}
      </div>

      {workspacePicker && (
        <WorkspacePicker
          itemType="conversation"
          itemId={workspacePicker.id}
          itemTitle={workspacePicker.title}
          onClose={() => setWorkspacePicker(null)}
        />
      )}
    </div>
  )
}

// ─── EmptyChatState ───────────────────────────────────────────────────────────

function EmptyChatState({ search, activeProjectId, onNewChat }: { search: string; activeProjectId: string | null; onNewChat: () => void }) {
  const hasFilter = search || activeProjectId
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <ChatCircle size={32} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
        {hasFilter ? 'Keine Chats gefunden' : 'Noch keine Chats'}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
        {hasFilter
          ? 'Versuche einen anderen Suchbegriff oder Filter.'
          : 'Starte ein neues Gespräch mit Toro.'}
      </p>
      {!hasFilter && (
        <button className="btn btn-primary" onClick={onNewChat}>
          <Plus size={14} weight="bold" aria-hidden="true" /> Neuer Chat
        </button>
      )}
    </div>
  )
}
