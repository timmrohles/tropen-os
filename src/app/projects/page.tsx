'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Icon as PhosphorIconType } from '@phosphor-icons/react'
import {
  FolderOpen, FolderSimple, Plus, Trash, FloppyDisk, ChatCircle, FileText,
  Brain, ArrowRight, UploadSimple, DotsThree, CircleNotch,
  Briefcase, Rocket, Lightbulb, Note, Flask, Leaf, Handshake, TrendUp,
  PaintBrush, Globe, DeviceMobile, GraduationCap, ChartBar,
  ClipboardText, CurrencyEur, Buildings, Users, Sparkle, Robot,
  Archive, ArrowsMerge, PencilSimple, Check, X, ShareNetwork,
} from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'
import { createLogger } from '@/lib/logger'

const log = createLogger('projects/page')

// ─── Types ────────────────────────────────────────────────────────────────────

type Project = {
  id: string
  title: string
  emoji: string | null
  context: string | null
  goal: string | null
  department_id: string
  created_at: string
  updated_at: string
  archived_at: string | null
  project_memory: { count: number }[] | null
}

type Chat = { id: string; title: string | null; updated_at: string }
type Doc  = { id: string; filename: string; file_size: number | null; mime_type: string | null; created_at: string }
type Mem  = { id: string; type: string; content: string; created_at: string; frozen?: boolean }

type ProjectTab = 'uebersicht' | 'chats' | 'dokumente' | 'gedaechtnis'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60)      return 'gerade eben'
  if (diff < 3600)    return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400)   return `vor ${Math.floor(diff / 3600)} Std.`
  if (diff < 172800)  return 'gestern'
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function formatBytes(b: number | null): string {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${Math.round(b / 1024)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

const ICON_OPTIONS: { name: string; Icon: PhosphorIconType }[] = [
  { name: 'FolderSimple', Icon: FolderSimple },
  { name: 'Briefcase',    Icon: Briefcase    },
  { name: 'Rocket',       Icon: Rocket       },
  { name: 'Lightbulb',    Icon: Lightbulb    },
  { name: 'Note',         Icon: Note         },
  { name: 'Flask',        Icon: Flask        },
  { name: 'Leaf',         Icon: Leaf         },
  { name: 'Handshake',    Icon: Handshake    },
  { name: 'TrendUp',      Icon: TrendUp      },
  { name: 'ChartBar',     Icon: ChartBar     },
  { name: 'PaintBrush',   Icon: PaintBrush   },
  { name: 'Globe',        Icon: Globe        },
  { name: 'DeviceMobile', Icon: DeviceMobile },
  { name: 'GraduationCap',Icon: GraduationCap},
  { name: 'ClipboardText',Icon: ClipboardText},
  { name: 'CurrencyEur',  Icon: CurrencyEur  },
  { name: 'Buildings',    Icon: Buildings    },
  { name: 'Users',        Icon: Users        },
  { name: 'Sparkle',      Icon: Sparkle      },
  { name: 'Robot',        Icon: Robot        },
]

function getProjectIcon(name: string | null): PhosphorIconType {
  if (!name) return FolderSimple
  return ICON_OPTIONS.find(o => o.name === name)?.Icon ?? FolderSimple
}

// ─── IconPicker ───────────────────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const CurrentIcon = getProjectIcon(value)

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className="project-emoji-picker-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Icon wählen"
        title="Icon wählen"
      >
        <CurrentIcon size={18} weight="fill" aria-hidden="true" />
      </button>
      {open && (
        <div className="project-emoji-grid" style={{ position: 'absolute', top: 42, left: 0, zIndex: 10 }}>
          {ICON_OPTIONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              className={`project-emoji-opt${value === name ? ' project-emoji-opt--active' : ''}`}
              onClick={() => { onChange(name); setOpen(false) }}
              aria-label={name}
              title={name}
            >
              <Icon size={18} weight="fill" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({
  project, isSelected, onClick, onChatStart, onSaveToWorkspace,
}: {
  project: Project
  isSelected: boolean
  onClick: () => void
  onChatStart: () => void
  onSaveToWorkspace: () => void
}) {
  const memCount = project.project_memory?.[0]?.count ?? 0
  return (
    <div
      className={`card project-card${isSelected ? ' project-card--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-selected={isSelected}
      aria-label={`Projekt ${project.title} öffnen`}
    >
      <div className="project-card-header">
        {(() => { const PIcon = getProjectIcon(project.emoji); return <PIcon size={18} weight="fill" className="project-card-emoji" aria-hidden="true" /> })()}
        <span className="project-card-title">{project.title}</span>
        <button
          className="btn-icon project-card-menu"
          onClick={e => { e.stopPropagation(); onSaveToWorkspace() }}
          aria-label="In Workspace ablegen"
          title="In Workspace ablegen"
        >
          <ShareNetwork size={15} weight="bold" />
        </button>
        <button
          className="btn-icon project-card-menu"
          onClick={e => { e.stopPropagation(); onClick() }}
          aria-label="Projekt-Optionen"
          title="Optionen"
        >
          <DotsThree size={16} weight="bold" />
        </button>
      </div>

      {project.context && (
        <p className="project-card-desc">{project.context}</p>
      )}

      <div className="project-card-meta">
        {memCount > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Brain size={11} weight="fill" aria-hidden="true" />
            {memCount} {memCount === 1 ? 'Erinnerung' : 'Erinnerungen'}
          </span>
        )}
        <span>{formatRelDate(project.updated_at)}</span>
      </div>

      <button
        className="btn btn-ghost btn-sm project-card-chat-btn"
        onClick={e => { e.stopPropagation(); onChatStart() }}
        aria-label={`Chat in Projekt ${project.title} starten`}
      >
        <ChatCircle size={14} weight="bold" aria-hidden="true" />
        Chat starten
      </button>
    </div>
  )
}

// ─── Tab: Übersicht ───────────────────────────────────────────────────────────

function OverviewTab({
  project, allProjects, onSaved, onDeleted, onArchived,
}: {
  project: Project
  allProjects: Project[]
  onSaved: (p: Project) => void
  onDeleted: () => void
  onArchived: (p: Project) => void
}) {
  const [title, setTitle]     = useState(project.title)
  const [emoji, setEmoji]     = useState(project.emoji ?? 'FolderSimple')
  const [context, setContext] = useState(project.context ?? '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showMerge, setShowMerge]   = useState(false)
  const [mergeTarget, setMergeTarget] = useState<string>('')
  const [merging, setMerging]         = useState(false)

  useEffect(() => {
    setTitle(project.title)
    setEmoji(project.emoji ?? 'FolderSimple')
    setContext(project.context ?? '')
    setError(null)
    setConfirmDel(false)
    setShowMerge(false)
    setMergeTarget('')
  }, [project.id])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), emoji, context: context || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      onSaved(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      onDeleted()
    } catch {
      setError('Löschen fehlgeschlagen')
    }
  }

  async function handleArchive() {
    try {
      const val = project.archived_at ? null : new Date().toISOString()
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived_at: val }),
      })
      if (!res.ok) throw new Error()
      onArchived(await res.json())
    } catch {
      setError('Archivieren fehlgeschlagen')
    }
  }

  async function handleMerge() {
    if (!mergeTarget) return
    setMerging(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: mergeTarget }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      onDeleted() // source project is now archived — remove from list
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge fehlgeschlagen')
    } finally {
      setMerging(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
    fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div className="project-tab-content">
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Titel</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconPicker value={emoji} onChange={setEmoji} />
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Projektname" />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>
          Kontext für Toro
        </label>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 6px' }}>
          Toro nutzt das als Hintergrund für alle Chats in diesem Projekt.
        </p>
        <textarea
          style={{ ...inp, minHeight: 100, resize: 'vertical' }}
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder={'Worum geht es in diesem Projekt? Was ist das Ziel?\nWie soll Toro antworten — Ton, Fokus, was vermieden werden soll?'}
        />
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: 12, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !title.trim()}>
          <FloppyDisk size={14} weight="bold" aria-hidden="true" />
          {saving ? 'Speichere…' : 'Speichern'}
        </button>

        <button className="btn btn-ghost" onClick={handleArchive}>
          <Archive size={14} weight="bold" aria-hidden="true" />
          {project.archived_at ? 'Wiederherstellen' : 'Archivieren'}
        </button>

        <button className="btn btn-ghost" onClick={() => setShowMerge(v => !v)}>
          <ArrowsMerge size={14} weight="bold" aria-hidden="true" />
          Zusammenführen
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {confirmDel ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Sicher löschen?</span>
              <button className="btn btn-danger" onClick={handleDelete}>Ja, löschen</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>Abbrechen</button>
            </>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirmDel(true)}>
              <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
            </button>
          )}
        </div>
      </div>

      {/* Merge Panel */}
      {showMerge && (
        <div className="card" style={{ padding: 16, background: 'var(--bg-base)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px' }}>
            Alle Chats und Gedächtnis-Einträge dieses Projekts werden in das Zielprojekt verschoben. Dieses Projekt wird danach archiviert.
          </p>
          <select
            value={mergeTarget}
            onChange={e => setMergeTarget(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 10 }}
          >
            <option value="">— Zielprojekt wählen —</option>
            {allProjects.filter(p => p.id !== project.id && !p.archived_at).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={handleMerge} disabled={!mergeTarget || merging}>
              <ArrowsMerge size={13} weight="bold" aria-hidden="true" />
              {merging ? 'Wird zusammengeführt…' : 'Zusammenführen'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowMerge(false)}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Chats ───────────────────────────────────────────────────────────────

function ChatsTab({ projectId, onNewChat }: { projectId: string; onNewChat: () => void }) {
  const [chats, setChats]     = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/chats`)
      .then(r => r.json())
      .then(d => setChats(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [projectId])

  const empty = <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Noch keine Chats in diesem Projekt.</p>

  return (
    <div className="project-tab-content">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={onNewChat}>
          <ChatCircle size={14} weight="bold" aria-hidden="true" /> + Neuer Chat
        </button>
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Lade Chats…</p>
      ) : chats.length === 0 ? empty : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {chats.map(c => (
            <a key={c.id} href={`/chat/${c.id}`} className="list-row" style={{ textDecoration: 'none' }}>
              <ChatCircle size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title ?? 'Unbenannter Chat'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatRelDate(c.updated_at)}</div>
              </div>
              <ArrowRight size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Dokumente ───────────────────────────────────────────────────────────

function DocumentsTab({ projectId }: { projectId: string }) {
  const [docs, setDocs]       = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/documents`)
      .then(r => r.json())
      .then(d => setDocs(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [projectId])

  async function uploadFile(file: File) {
    setUploading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/projects/${projectId}/documents`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Upload fehlgeschlagen')
      const doc: Doc = await res.json()
      setDocs(prev => [doc, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  async function handleDelete(docId: string) {
    await fetch(`/api/projects/${projectId}/documents/${docId}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  return (
    <div className="project-tab-content">
      <div
        className={`document-upload-zone${dragging ? ' document-upload-zone--active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Dokumente hochladen"
        onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
      >
        {uploading
          ? <CircleNotch size={24} weight="bold" color="var(--accent)" className="spin" aria-hidden="true" />
          : <UploadSimple size={24} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
        }
        <p className="document-upload-label">{uploading ? 'Wird hochgeladen…' : 'Dateien hier ablegen oder klicken'}</p>
        <p className="document-upload-hint">PDF, DOCX, TXT, MD — max. 10 MB</p>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: 12, margin: 0 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Lade Dokumente…</p>
      ) : docs.length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Noch keine Dokumente hochgeladen.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {docs.map(d => (
            <div key={d.id} className="list-row">
              <FileText size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.filename}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatBytes(d.file_size)} · {formatRelDate(d.created_at)}</div>
              </div>
              <button className="btn-icon" onClick={() => handleDelete(d.id)} aria-label={`${d.filename} löschen`} title="Löschen">
                <Trash size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Gedächtnis ──────────────────────────────────────────────────────────

function MemoryTab({ projectId, memCount }: { projectId: string; memCount: number }) {
  const [memories, setMemories]     = useState<Mem[]>([])
  const [loading, setLoading]       = useState(true)
  const [confirmAll, setConfirmAll] = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editText, setEditText]     = useState('')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/memory`)
      .then(r => r.json())
      .then(d => setMemories(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleDelete(memId: string) {
    await fetch(`/api/projects/${projectId}/memory/${memId}`, { method: 'DELETE' })
    setMemories(prev => prev.filter(m => m.id !== memId))
    if (editingId === memId) setEditingId(null)
  }

  async function handleDeleteAll() {
    await fetch(`/api/projects/${projectId}/memory`, { method: 'DELETE' })
    setMemories([])
    setConfirmAll(false)
    setEditingId(null)
  }

  function startEdit(m: Mem) {
    setEditingId(m.id)
    setEditText(m.content)
  }

  async function saveEdit(memId: string) {
    if (!editText.trim()) return
    const res = await fetch(`/api/projects/${projectId}/memory/${memId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editText.trim() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMemories(prev => prev.map(m => m.id === memId ? { ...m, content: updated.content } : m))
    }
    setEditingId(null)
  }

  return (
    <div className="project-tab-content">
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        Das hat Toro sich in diesem Projekt gemerkt. Einträge werden automatisch hinzugefügt.
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Lade Gedächtnis…</p>
      ) : memories.length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>
          Toro hat sich noch nichts gemerkt. Führe ein paar Chats in diesem Projekt durch.
        </p>
      ) : (
        <>
          <div>
            {memories.map(m => (
              <div key={m.id} className="project-memory-item">
                <div className="project-memory-content">
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.type}</span>
                  {editingId === m.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={3}
                        style={{ fontSize: 13, lineHeight: 1.5, background: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: 6, padding: '6px 8px', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveEdit(m.id); if (e.key === 'Escape') setEditingId(null) }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => saveEdit(m.id)}><Check size={12} weight="bold" /> Speichern</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <p className="project-memory-text">{m.content}</p>
                  )}
                  <span className="project-memory-date">{formatRelDate(m.created_at)}</span>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {editingId !== m.id && (
                    <button className="btn-icon" onClick={() => startEdit(m)} aria-label="Eintrag bearbeiten" title="Bearbeiten">
                      <PencilSimple size={13} weight="bold" />
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => handleDelete(m.id)} aria-label="Eintrag löschen" title="Löschen">
                    <Trash size={13} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {confirmAll ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Gesamtes Gedächtnis löschen?</span>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>Ja, alles löschen</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmAll(false)}>Abbrechen</button>
            </div>
          ) : (
            <button className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmAll(true)}>
              <Trash size={14} weight="bold" aria-hidden="true" /> Gesamtes Gedächtnis löschen
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter()
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [workspacePicker, setWorkspacePicker] = useState<Project | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState('FolderSimple')
  const [saving, setSaving]     = useState(false)
  const [activeTab, setActiveTab] = useState<ProjectTab>('uebersicht')

  const loadProjects = useCallback(async (deptId: string) => {
    const res = await fetch(`/api/projects?department_id=${deptId}`)
    if (res.ok) {
      const json = await res.json()
      setProjects(Array.isArray(json) ? json : (json.data ?? []))
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }
        const { data: membership } = await supabase
          .from('department_members').select('workspace_id').eq('user_id', user.id).limit(1).single()
        const deptId = membership?.workspace_id ?? null
        setDepartmentId(deptId)
        if (deptId) await loadProjects(deptId)
      } catch (err) {
        log.error('[projects] init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadProjects])

  function selectProject(p: Project) {
    setSelected(p)
    setActiveTab('uebersicht')
    setCreating(false)
  }

  async function handleCreate() {
    if (!departmentId || !newTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId, title: newTitle.trim() }),
      })
      if (!res.ok) return
      const created: Project = await res.json()
      // Patch emoji right away
      if (newEmoji !== 'FolderSimple') {
        await fetch(`/api/projects/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji: newEmoji }),
        })
        created.emoji = newEmoji
      }
      const withMem = { ...created, project_memory: null }
      setProjects(prev => [withMem, ...prev])
      setSelected(withMem)
      setCreating(false)
      setNewTitle('')
      setNewEmoji('FolderSimple')
      setActiveTab('uebersicht')
    } finally {
      setSaving(false)
    }
  }

  const [showArchived, setShowArchived] = useState(false)
  const memCount = selected?.project_memory?.[0]?.count ?? 0

  const visibleProjects = projects.filter(p =>
    showArchived ? !!p.archived_at : !p.archived_at
  )
  const archivedCount = projects.filter(p => !!p.archived_at).length

  const s: Record<string, React.CSSProperties> = {
    grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 },
    empty: { color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' },
    detailCard: { padding: 24 },
    tabs:  { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
    inp:   { width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  }

  return (
    <div className="content-max" aria-busy={loading}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <FolderOpen size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Projekte
          </h1>
          <p className="page-header-sub">Smarte Projektordner mit Gedächtnis</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setCreating(true); setSelected(null) }}>
            <Plus size={14} weight="bold" aria-hidden="true" /> Neues Projekt
          </button>
        </div>
      </div>

      {/* Archive filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button className={`chip${!showArchived ? ' chip--active' : ''}`} onClick={() => { setShowArchived(false); setSelected(null) }}>
          Aktiv
        </button>
        <button className={`chip${showArchived ? ' chip--active' : ''}`} onClick={() => { setShowArchived(true); setSelected(null) }}>
          Archiviert{archivedCount > 0 ? ` (${archivedCount})` : ''}
        </button>
      </div>

      {creating && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <IconPicker value={newEmoji} onChange={setNewEmoji} />
            <input
              autoFocus
              placeholder="Projekttitel"
              value={newTitle}
              style={s.inp}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewTitle('') } }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving || !newTitle.trim()}>Erstellen</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setNewTitle('') }}>Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={s.empty}>Lade Projekte…</p>
      ) : visibleProjects.length === 0 && !creating ? (
        <p style={s.empty}>{showArchived ? 'Keine archivierten Projekte.' : 'Noch keine Projekte — erstelle dein erstes.'}</p>
      ) : (
        <div style={s.grid}>
          {visibleProjects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              isSelected={selected?.id === p.id}
              onClick={() => selectProject(p)}
              onChatStart={() => router.push('/chat/new')}
              onSaveToWorkspace={() => setWorkspacePicker(p)}
            />
          ))}
        </div>
      )}

      {selected && (
        <div className="card" style={s.detailCard}>
          <div style={s.tabs}>
            <button className={`chip${activeTab === 'uebersicht'  ? ' chip--active' : ''}`} onClick={() => setActiveTab('uebersicht')}>Übersicht</button>
            <button className={`chip${activeTab === 'chats'       ? ' chip--active' : ''}`} onClick={() => setActiveTab('chats')}>Chats</button>
            <button className={`chip${activeTab === 'dokumente'   ? ' chip--active' : ''}`} onClick={() => setActiveTab('dokumente')}>Dokumente</button>
            <button className={`chip${activeTab === 'gedaechtnis' ? ' chip--active' : ''}`} onClick={() => setActiveTab('gedaechtnis')}>
              Gedächtnis{memCount > 0 ? ` (${memCount})` : ''}
            </button>
          </div>

          {activeTab === 'uebersicht' && (
            <OverviewTab
              project={selected}
              allProjects={projects}
              onSaved={updated => {
                const withMem = { ...updated, project_memory: selected.project_memory }
                setProjects(prev => prev.map(p => p.id === updated.id ? withMem : p))
                setSelected(withMem)
              }}
              onDeleted={() => {
                setProjects(prev => prev.filter(p => p.id !== selected.id))
                setSelected(null)
              }}
              onArchived={updated => {
                const withMem = { ...updated, project_memory: selected.project_memory }
                setProjects(prev => prev.map(p => p.id === updated.id ? withMem : p))
                setSelected(null)
              }}
            />
          )}
          {activeTab === 'chats' && (
            <ChatsTab projectId={selected.id} onNewChat={() => router.push('/chat/new')} />
          )}
          {activeTab === 'dokumente' && (
            <DocumentsTab projectId={selected.id} />
          )}
          {activeTab === 'gedaechtnis' && (
            <MemoryTab projectId={selected.id} memCount={memCount} />
          )}
        </div>
      )}

      {workspacePicker && (
        <WorkspacePicker
          itemType="project"
          itemId={workspacePicker.id}
          itemTitle={workspacePicker.title}
          onClose={() => setWorkspacePicker(null)}
        />
      )}
    </div>
  )
}
