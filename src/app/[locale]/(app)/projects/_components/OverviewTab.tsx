'use client'

import { useState, useEffect } from 'react'
import { FloppyDisk, Trash, Archive, ArrowsMerge } from '@phosphor-icons/react'
import { type Project } from './types'
import { IconPicker } from './IconPicker'

export function OverviewTab({
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
  }, [project.id, project.title, project.emoji, project.context])

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
