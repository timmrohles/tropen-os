'use client'

import { useEffect, useRef, useState } from 'react'
import { DotsThree, PencilSimple, Trash, Warning } from '@phosphor-icons/react'
import { Link } from '@/i18n/navigation'
import type { PreflightProjectListItem } from '@/lib/preflight/types'

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'gestern' : `vor ${d} Tagen`
}

function ProjectCard({ p, onRename, onDelete }: {
  p: PreflightProjectListItem
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(p.name)
  const [confirmDel, setConfirmDel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  return (
    <div className="card" style={{ padding: 0, position: 'relative' }}>
      <div style={{ padding: '14px 16px' }}>
        {renaming ? (
          <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && renameVal.trim()) { void onRename(p.id, renameVal.trim()); setRenaming(false) }
              if (e.key === 'Escape') { setRenameVal(p.name); setRenaming(false) }
            }}
            onBlur={() => { setRenameVal(p.name); setRenaming(false) }}
            style={{ width: '100%', background: 'var(--bg-surface-solid)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, outline: 'none' }} />
        ) : (
          <Link href={`/preflight/${p.id}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
          </Link>
        )}
        <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          {[p.stack, `${p.redCount} ${p.redCount === 1 ? 'Lücke' : 'Lücken'}`, relTime(p.updatedAt)].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* [···] */}
      <div ref={ref} style={{ position: 'absolute', top: 10, right: 10 }}>
        <button type="button" className="btn-icon" aria-label="Aktionen" onClick={() => setMenuOpen(o => !o)}>
          <DotsThree size={16} weight="bold" />
        </button>
        {menuOpen && (
          <div className="dropdown animate-dropdown" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 170, zIndex: 50 }}>
            <button className="dropdown-item" onClick={() => { setMenuOpen(false); setRenaming(true) }}>
              <PencilSimple size={14} weight="bold" /> Umbenennen
            </button>
            <div className="dropdown-divider" />
            {confirmDel ? (
              <button className="dropdown-item dropdown-item--danger" onClick={() => { setMenuOpen(false); setConfirmDel(false); void onDelete(p.id) }}>
                <Warning size={14} weight="fill" /> Wirklich löschen?
              </button>
            ) : (
              <button className="dropdown-item dropdown-item--danger" onClick={() => setConfirmDel(true)}>
                <Trash size={14} weight="bold" /> Löschen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProjectGrid({ projects, onRename, onDelete }: {
  projects: PreflightProjectListItem[]
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
      {projects.map(p => <ProjectCard key={p.id} p={p} onRename={onRename} onDelete={onDelete} />)}
    </div>
  )
}
