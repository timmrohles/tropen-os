'use client'

import { useEffect, useRef, useState } from 'react'
import { X, MagnifyingGlass, ChatCircle, FolderSimple, Sparkle, RssSimple, Robot } from '@phosphor-icons/react'
import type { WorkspaceItemRow } from './WorkspaceItemsList'

type ItemType = 'conversation' | 'artifact' | 'project' | 'feed_source' | 'agent'

type PickerResult = { id: string; title: string; subtitle: string }

const TYPES: { value: ItemType; label: string; icon: React.ReactNode }[] = [
  { value: 'conversation', label: 'Chat',    icon: <ChatCircle  size={13} weight="bold" /> },
  { value: 'project',      label: 'Projekt', icon: <FolderSimple size={13} weight="bold" /> },
  { value: 'artifact',     label: 'Artefakt',icon: <Sparkle     size={13} weight="bold" /> },
  { value: 'feed_source',  label: 'Feed',    icon: <RssSimple   size={13} weight="bold" /> },
  { value: 'agent',        label: 'Agent',   icon: <Robot       size={13} weight="bold" /> },
]


export default function AddItemModal({ workspaceId, onClose, onAdded }: {
  workspaceId: string
  onClose: () => void
  onAdded: (item: WorkspaceItemRow) => void
}) {
  const [type, setType] = useState<ItemType>('conversation')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<PickerResult[]>([])
  const [loadingResults, setLoadingResults] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // load results when type or query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoadingResults(true)
      fetch(`/api/workspaces/${workspaceId}/picker?type=${type}&q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { setResults(Array.isArray(data) ? data : []); setLoadingResults(false) })
        .catch(() => setLoadingResults(false))
    }, q ? 300 : 0)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [type, q, workspaceId])

  // focus search on type switch
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50)
  }, [type])

  async function addItem(item: PickerResult) {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: type, item_id: item.id, title: item.title }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      onAdded(await res.json())
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 499 }} aria-hidden="true" />
      <div className="modal-overlay" style={{ zIndex: 500 }} role="dialog" aria-modal="true" aria-label="Element hinzufügen">
        <div className="card" style={{ width: '100%', maxWidth: 520, padding: 24, background: 'var(--bg-surface-solid)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Element hinzufügen
            </h2>
            <button className="btn-icon" onClick={onClose} aria-label="Schließen">
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* Type chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => { setType(t.value); setQ(''); setError('') }}
                className={`chip${type === t.value ? ' chip--active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="search-bar-container" style={{ marginBottom: 12 }}>
            <MagnifyingGlass
              size={14} weight="bold"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              className="input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={`${TYPES.find(t => t.value === type)?.label} suchen…`}
              style={{ paddingLeft: 32 }}
            />
          </div>

          {/* Results */}
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loadingResults ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 0', textAlign: 'center' }}>Lädt…</p>
            ) : results.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 0', textAlign: 'center' }}>
                {q ? 'Keine Treffer' : 'Keine Einträge gefunden'}
              </p>
            ) : (
              results.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  disabled={saving}
                  className="dropdown-item"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {item.subtitle}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {error && <p role="alert" style={{ fontSize: 12, color: 'var(--error)', margin: '8px 0 0' }}>{error}</p>}
        </div>
      </div>
    </>
  )
}
