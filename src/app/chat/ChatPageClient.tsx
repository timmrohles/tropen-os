'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { MagnifyingGlass, Plus, FolderSimple, Trash, X, ChatCircle } from '@phosphor-icons/react'

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

export default function ChatListClient({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const [conversations, setConversations] = useState<ConvItem[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [workspaceName, setWorkspaceName] = useState('')
  const [search, setSearch] = useState('')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const folderMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const [{ data: ws }, { data: convs }, { data: projs }] = await Promise.all([
        supabase.from('departments').select('name').eq('id', workspaceId).single(),
        supabase
          .from('conversations')
          .select('id, title, created_at, project_id')
          .eq('workspace_id', workspaceId)
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

  // Close folder menu on outside click
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

  async function handleNewChat() {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }
    const { data } = await supabase
      .from('conversations')
      .insert({ workspace_id: workspaceId, user_id: user.id, title: 'Neuer Chat' })
      .select('id')
      .single()
    setCreating(false)
    if (data) router.push(`/chat/${(data as { id: string }).id}`)
  }

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

  return (
    // Outer: fills exactly the height of .app-main so it doesn't scroll itself
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
      {/* Non-scrolling top section */}
      <div style={{ flexShrink: 0 }}>
        {/* Page header */}
        <div className="page-header">
          <div className="page-header-text">
            <h1 className="page-header-title">
              <ChatCircle size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
              Chats
            </h1>
            <p className="page-header-sub">Deine Konversationen mit Toro</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={handleNewChat} disabled={creating}>
              <Plus size={14} weight="bold" aria-hidden="true" />
              {creating ? 'Erstelle…' : 'Neuer Chat'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <MagnifyingGlass
            size={15}
            aria-hidden="true"
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)', pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            placeholder="Chats durchsuchen ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              fontSize: 14,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Project chips — always show "Alle", then one per project */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
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

      {/* Scrollable list — only this part scrolls */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 48 }}>
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            Lade Chats…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            {search || activeProjectId ? 'Keine Chats gefunden.' : 'Noch keine Chats. Starte einen neuen Chat!'}
          </div>
        ) : (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'visible',
          background: 'var(--bg-surface)',
        }}>
          {filtered.map((conv, i) => {
            const isFolderOpen = openFolderMenuId === conv.id
            const isConfirmDelete = confirmDeleteId === conv.id
            const assignedProject = projects.find(p => p.id === conv.project_id)

            return (
              <div
                key={conv.id}
                style={{
                  position: 'relative',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Main row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    gap: 8,
                  }}
                  className="chat-list-row"
                >
                  {/* Clickable title area */}
                  <button
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      minWidth: 0,
                    }}
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

                  {/* Actions */}
                  <div className="chat-list-actions" style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    {/* Folder assign */}
                    <div style={{ position: 'relative' }}>
                      <button
                        aria-label="Ordner zuweisen"
                        title="Ordner zuweisen"
                        onClick={() => setOpenFolderMenuId(prev => prev === conv.id ? null : conv.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                          background: isFolderOpen ? 'var(--bg-inset, rgba(0,0,0,0.06))' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: isFolderOpen ? 'var(--accent)' : 'var(--text-tertiary)',
                          transition: 'all var(--t-fast)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset, rgba(0,0,0,0.06))'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)' }}
                        onMouseLeave={e => {
                          if (!isFolderOpen) {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                          }
                        }}
                      >
                        <FolderSimple size={15} weight="bold" />
                      </button>

                      {/* Folder dropdown */}
                      {isFolderOpen && (
                        <div
                          ref={folderMenuRef}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            zIndex: 100,
                            background: '#fff',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            minWidth: 180,
                            padding: '4px 0',
                            marginTop: 4,
                          }}
                        >
                          <div style={{ padding: '6px 12px 4px', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Ordner zuweisen
                          </div>
                          <button
                            onClick={() => handleAssign(conv.id, null)}
                            style={{
                              display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                              fontSize: 13, color: conv.project_id === null ? 'var(--accent)' : 'var(--text-secondary)',
                              fontWeight: conv.project_id === null ? 600 : 400,
                              background: 'transparent', border: 'none', cursor: 'pointer',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset, rgba(0,0,0,0.04))' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                          >
                            Kein Ordner
                          </button>
                          {projects.length > 0 && (
                            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                          )}
                          {projects.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAssign(conv.id, p.id)}
                              style={{
                                display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                                fontSize: 13, color: conv.project_id === p.id ? 'var(--accent)' : 'var(--text-secondary)',
                                fontWeight: conv.project_id === p.id ? 600 : 400,
                                background: 'transparent', border: 'none', cursor: 'pointer',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset, rgba(0,0,0,0.04))' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                            >
                              {p.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    {isConfirmDelete ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--error)' }}>Löschen?</span>
                        <button
                          onClick={() => handleDelete(conv.id)}
                          style={{
                            padding: '2px 8px', fontSize: 12, fontWeight: 600,
                            background: 'var(--error)', color: '#fff',
                            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          }}
                        >
                          Ja
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          <X size={13} weight="bold" />
                        </button>
                      </div>
                    ) : (
                      <button
                        aria-label="Chat löschen"
                        title="Chat löschen"
                        onClick={() => setConfirmDeleteId(conv.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 30, height: 30, borderRadius: 'var(--radius-sm)',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-tertiary)',
                          transition: 'all var(--t-fast)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--error-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>
    </div>
  )
}
