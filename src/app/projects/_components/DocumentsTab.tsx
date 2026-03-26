'use client'

import { useState, useEffect, useRef } from 'react'
import { UploadSimple, FileText, Trash, CircleNotch } from '@phosphor-icons/react'
import { type Doc, formatBytes, formatRelDate } from './types'

export function DocumentsTab({ projectId }: { projectId: string }) {
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
