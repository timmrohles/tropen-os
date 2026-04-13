'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import {
  ArrowLeft, Plus, SquaresFour, Warning,
  Tray, ArrowsClockwise, Export as ExportIcon,
} from '@phosphor-icons/react'
import { useRouter } from '@/i18n/navigation'
import type { CanvasCard } from '@/lib/types/canvas'
export type { CanvasCard }

export type CanvasWorkspace = {
  id: string
  title: string
  goal: string | null
  status: string
  meta: Record<string, unknown>
}
import ChatPanel from '@/components/ws/ChatPanel'
import CardTile from '@/components/workspaces/CardTile'

type Tab = 'canvas' | 'silo' | 'settings'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Entwurf', active: 'Aktiv', exported: 'Exportiert', locked: 'Gesperrt',
}

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

interface Props {
  workspaceId: string
  initialWorkspace: CanvasWorkspace
  initialCards: CanvasCard[]
}

export default function CanvasClient({ workspaceId, initialWorkspace, initialCards }: Props) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [cards, setCards] = useState(initialCards)
  const [tab, setTab] = useState<Tab>('canvas')
  const [showCreate, setShowCreate] = useState(false)
  const [editTitle, setEditTitle] = useState(initialWorkspace.title)
  const [editGoal, setEditGoal] = useState(initialWorkspace.goal ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const staleCount = cards.filter(c => c.status === 'stale').length

  async function handleSaveSettings() {
    if (!editTitle.trim()) return
    setSaveState('saving')
    const body: Record<string, string> = { title: editTitle.trim() }
    if (editGoal.trim()) body.goal = editGoal.trim()
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { setSaveState('error'); return }
    const updated = await res.json()
    setWorkspace(w => ({ ...w, title: updated.title, goal: updated.goal ?? null }))
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  function handleCardCreated(card: CanvasCard) {
    setCards(prev => [...prev, card])
    setShowCreate(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ── Header ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 20px', height: 52,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-nav)',
      }}>
        <button className="btn-icon" onClick={() => router.push('/workspaces')} aria-label="Zurück zu Workspaces">
          <ArrowLeft size={18} weight="bold" />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspace.title}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', flexShrink: 0 }}>
              {STATUS_LABEL[workspace.status] ?? workspace.status}
            </span>
          </div>
          {workspace.goal && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {workspace.goal}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {cards.length} {cards.length === 1 ? 'Karte' : 'Karten'}
          </span>
          {staleCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--warning)' }}>
              <Warning size={14} weight="fill" aria-hidden="true" />
              {staleCount} veraltet
            </span>
          )}
          <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ExportIcon size={14} weight="bold" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        flexShrink: 0, display: 'flex', gap: 6, padding: '10px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
      }}>
        {(['canvas', 'silo', 'settings'] as Tab[]).map(t => (
          <button
            key={t}
            className={`chip${tab === t ? ' chip--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'canvas' ? 'Canvas' : t === 'silo' ? 'Silo-Chat' : 'Einstellungen'}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Canvas tab */}
        {tab === 'canvas' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 48px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} weight="bold" aria-hidden="true" />
                Karte hinzufügen
              </button>
            </div>
            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                <SquaresFour size={40} weight="bold" style={{ marginBottom: 12, opacity: 0.4 }} aria-hidden="true" />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Noch keine Karten</p>
                <p style={{ fontSize: 13 }}>Füge deine erste Karte hinzu um zu beginnen.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {cards.map(card => <CardTile key={card.id} card={card} />)}
              </div>
            )}
          </div>
        )}

        {/* Silo-Chat tab */}
        {tab === 'silo' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel workspaceId={workspaceId} color="var(--accent)" placeholder="Stelle Fragen zu diesem Workspace…" />
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 48px' }}>
            <div style={{ maxWidth: 560 }}>
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
                  Workspace-Einstellungen
                </h2>
                <div style={{ marginBottom: 18 }}>
                  <label htmlFor="ws-title" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Name *
                  </label>
                  <input id="ws-title" type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inp} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="ws-goal" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Ziel <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
                  </label>
                  <textarea
                    id="ws-goal" value={editGoal} onChange={e => setEditGoal(e.target.value)}
                    rows={3} placeholder="z.B. Kampagnenstrategie Q2 2026 entwickeln"
                    style={{ ...inp, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saveState === 'saving' || !editTitle.trim()} aria-busy={saveState === 'saving'}>
                    {saveState === 'saving' ? 'Wird gespeichert…' : 'Speichern'}
                  </button>
                  {saveState === 'saved' && <span style={{ fontSize: 13, color: 'var(--accent)' }}>Gespeichert ✓</span>}
                  {saveState === 'error' && <span style={{ fontSize: 13, color: 'var(--error)' }}>Fehler beim Speichern</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create card modal */}
      {showCreate && (
        <CreateCardModal
          workspaceId={workspaceId}
          onCreated={handleCardCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Local: CreateCardModal
// ──────────────────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'input',   label: 'Eingabe',  icon: <Tray size={15} weight="fill" aria-hidden="true" />,            description: 'Rohdaten, Briefings, Dokumente',        color: 'var(--accent)',  bg: 'var(--accent-light)' },
  { value: 'process', label: 'Analyse',  icon: <ArrowsClockwise size={15} weight="fill" aria-hidden="true" />, description: 'KI verarbeitet, vergleicht, bewertet',   color: 'var(--tropen-process)',  bg: 'var(--tropen-process-bg)' },
  { value: 'output',  label: 'Ergebnis', icon: <ExportIcon size={15} weight="fill" aria-hidden="true" />,      description: 'Fertige Outputs und Deliverables',       color: 'var(--tropen-output)',   bg: 'var(--tropen-output-bg)'  },
] as const

interface ModalProps {
  workspaceId: string
  onCreated: (card: CanvasCard) => void
  onClose: () => void
}

function CreateCardModal({ workspaceId, onCreated, onClose }: ModalProps) {
  const [title, setTitle] = useState('')
  const [role, setRole] = useState<'input' | 'process' | 'output'>('input')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Bitte gib einen Titel ein'); return }
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), role, description: description.trim() || undefined }),
        })
        if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? 'Fehler') }
        const card = await res.json()
        onCreated(card as CanvasCard)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen')
      }
    })
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="ccm-heading"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="modal-overlay" style={{ zIndex: 1000, padding: 24 }}
    >
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460, position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <h2 id="ccm-heading" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Neue Karte erstellen</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Karten sind die Bausteine dieses Workspaces.</p>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="Schließen" style={{ position: 'absolute', top: 16, right: 16 }}>×</button>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="ccm-title" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Titel *</label>
            <input id="ccm-title" ref={titleRef} type="text" required value={title} onChange={e => { setTitle(e.target.value); setError(null) }} placeholder="z.B. Zielgruppenanalyse" style={inp} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Kartentyp *</label>
            <div style={{ display: 'flex', gap: 8 }} role="group" aria-label="Kartentyp wählen">
              {ROLE_OPTIONS.map(opt => {
                const active = role === opt.value
                return (
                  <button key={opt.value} type="button" onClick={() => setRole(opt.value)} aria-pressed={active}
                    style={{ flex: 1, padding: '10px 8px', background: active ? `${opt.color}12` : 'var(--bg-surface)', border: `${active ? 2 : 1}px solid ${active ? opt.color : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, color: active ? opt.color : 'var(--text-secondary)' }}>
                      {opt.icon}
                      <span style={{ fontSize: 12, fontWeight: 700, color: active ? opt.color : 'var(--text-primary)' }}>{opt.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{opt.description}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label htmlFor="ccm-desc" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Beschreibung <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <textarea id="ccm-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Kurze Erklärung…" style={{ ...inp, resize: 'vertical', minHeight: 68 }} />
          </div>

          {error && <p role="alert" style={{ fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={isPending} className="btn btn-primary" aria-busy={isPending}>
              {isPending ? 'Wird erstellt…' : 'Karte erstellen'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  )
}
