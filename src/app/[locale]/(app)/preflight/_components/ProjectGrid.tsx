'use client'

import { useEffect, useRef, useState } from 'react'
import { DotsThree, PencilSimple, Trash, Compass } from '@phosphor-icons/react'
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
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const hasGaps = p.redCount > 0

  const doDelete = async () => {
    setBusy(true)
    await onDelete(p.id)
    // Bei Erfolg unmountet die Karte (Parent entfernt sie). Bei Fehler: zurücksetzen.
    setBusy(false)
    setConfirmDel(false)
  }

  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Farb-Icon-Chip */}
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Compass size={20} weight="fill" color="var(--teal)" aria-hidden="true" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {renaming ? (
            <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && renameVal.trim()) { void onRename(p.id, renameVal.trim()); setRenaming(false) }
                if (e.key === 'Escape') { setRenameVal(p.name); setRenaming(false) }
              }}
              onBlur={() => { if (renameVal.trim() && renameVal.trim() !== p.name) void onRename(p.id, renameVal.trim()); setRenaming(false) }}
              style={{ width: '100%', background: 'var(--bg-surface-solid)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, outline: 'none' }} />
          ) : (
            <Link href={`/preflight/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
            </Link>
          )}
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
            {p.stack} · {relTime(p.updatedAt)}
          </p>
        </div>

        {/* [···] */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button type="button" className="btn-icon" aria-label="Aktionen" onClick={() => setMenuOpen(o => !o)}>
            <DotsThree size={16} weight="bold" />
          </button>
          {menuOpen && (
            <div className="dropdown animate-dropdown" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 160, zIndex: 50 }}>
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); setRenaming(true) }}>
                <PencilSimple size={14} weight="bold" /> Umbenennen
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-item--danger" onClick={() => { setMenuOpen(false); setConfirmDel(true) }}>
                <Trash size={14} weight="bold" /> Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status-Chip (Farbe) */}
      <div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 999,
          background: hasGaps ? 'rgba(229,160,0,0.12)' : 'var(--teal-light)',
          color: hasGaps ? 'var(--status-risky)' : 'var(--teal)',
        }}>
          {hasGaps ? `${p.redCount} ${p.redCount === 1 ? 'Lücke offen' : 'Lücken offen'}` : 'keine offenen Lücken'}
        </span>
      </div>

      {/* Inline-Lösch-Bestätigung — robust, NICHT im Dropdown */}
      {confirmDel && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(168,48,30,0.06)',
          borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--error)',
        }}>
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--error)' }}>Wirklich löschen?</span>
          <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => void doDelete()}>
            {busy ? '…' : 'Löschen'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setConfirmDel(false)}>
            Abbrechen
          </button>
        </div>
      )}
    </div>
  )
}

export function ProjectGrid({ projects, onRename, onDelete }: {
  projects: PreflightProjectListItem[]
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
      {projects.map(p => <ProjectCard key={p.id} p={p} onRename={onRename} onDelete={onDelete} />)}
    </div>
  )
}
