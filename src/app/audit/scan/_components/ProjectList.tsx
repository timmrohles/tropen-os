'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FolderSimple, ArrowRight, PencilSimple, Check, X } from '@phosphor-icons/react'

interface ScanProject {
  id: string
  name: string
  source: string
  file_count: number | null
  last_scan_at: string | null
  last_score: number | null
  detected_stack: Record<string, string> | null
  created_at: string
}

interface Props {
  projects: ScanProject[]
}

function formatDate(iso: string | null): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function scoreColor(score: number | null): string {
  if (score == null) return 'var(--text-tertiary)'
  if (score >= 85) return 'var(--accent)'
  if (score >= 70) return '#B45309'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

function ProjectRow({ project }: { project: ScanProject }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project.name)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDraft(project.name)
    setEditing(true)
  }

  function cancel() {
    setDraft(project.name)
    setEditing(false)
  }

  async function save() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === project.name) { cancel(); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/scan-projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) throw new Error()
      setEditing(false)
      router.refresh()
    } catch {
      // keep editing open on error
    } finally {
      setSaving(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') cancel()
  }

  return (
    <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <FolderSimple size={20} color="var(--accent)" weight="fill" aria-hidden="true" style={{ flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={save}
              disabled={saving}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-base)',
                border: '1px solid var(--accent)',
                borderRadius: 6,
                padding: '2px 8px',
                outline: 'none',
                width: '100%',
                maxWidth: 280,
              }}
            />
            <button
              className="btn-icon"
              onClick={save}
              disabled={saving}
              aria-label="Speichern"
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
            >
              <Check size={14} color="var(--accent)" weight="bold" />
            </button>
            <button
              className="btn-icon"
              onClick={cancel}
              aria-label="Abbrechen"
              onMouseDown={(e) => e.preventDefault()}
            >
              <X size={14} color="var(--text-tertiary)" weight="bold" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link
              href={`/audit?project=${project.id}`}
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              {project.name}
            </Link>
            <button
              className="btn-icon"
              onClick={startEdit}
              aria-label="Umbenennen"
              style={{ opacity: 0.4, transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
            >
              <PencilSimple size={13} color="var(--text-secondary)" weight="bold" />
            </button>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
          {project.file_count != null && <span>{project.file_count.toLocaleString('de')} Dateien</span>}
          {project.detected_stack?.framework && project.detected_stack.framework !== 'unknown' && (
            <span style={{ textTransform: 'capitalize' }}>{project.detected_stack.framework}</span>
          )}
          <span>Letzter Scan: {formatDate(project.last_scan_at)}</span>
        </div>
      </div>

      {project.last_score != null && (
        <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor(project.last_score), flexShrink: 0 }}>
          {Math.round(project.last_score)}%
        </div>
      )}

      <Link href={`/audit?project=${project.id}`} aria-label={`Audit für ${project.name} öffnen`} onClick={(e) => e.stopPropagation()}>
        <ArrowRight size={16} color="var(--text-tertiary)" weight="bold" aria-hidden="true" />
      </Link>
    </div>
  )
}

export default function ProjectList({ projects }: Props) {
  if (projects.length === 0) return null

  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Verbundene Projekte
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {projects.map((p) => <ProjectRow key={p.id} project={p} />)}
      </div>
    </div>
  )
}
