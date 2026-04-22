'use client'
// src/app/feeds/SourcesView.tsx — Quellen-Verwaltung Tab
import { useState, useCallback, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import {
  listFeedSources, updateFeedSource, deleteFeedSource, copyFeedSource,
} from '@/actions/feeds'
import { toggleTopicSource } from '@/actions/feed-topics'
import type { FeedSource, FeedRun, FeedTopic } from '@/types/feeds'
import {
  estimateFeedCost, estimateArticlesPerWeek, formatCostPerWeek,
} from '@/lib/feed-cost-estimator'
import {
  PauseCircle, PlayCircle, DotsThree, PencilSimple, Copy, Trash, Warning, ArrowClockwise, X,
} from '@phosphor-icons/react'
import RunHistoryPanel from './_components/RunHistoryPanel'
import DistributionsPanel from './_components/DistributionsPanel'

const SOURCE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: 'var(--tropen-process)',
  api:   'var(--tropen-output)',
  url:   'var(--text-tertiary)',
}

interface Props {
  topics: FeedTopic[]
  onTopicsChange: (topics: FeedTopic[]) => void
}

export default function SourcesView({ topics, onTopicsChange }: Props) {
  const [sources, setSources]           = useState<FeedSource[]>([])
  const [loading, setLoading]           = useState(true)
  const [menuOpen, setMenuOpen]         = useState<string | null>(null)
  const [editing, setEditing]           = useState<FeedSource | null>(null)
  const [editName, setEditName]         = useState('')
  const [editUrl, setEditUrl]           = useState('')
  const [editMinScore, setEditMinScore] = useState(5)
  const [saving, setSaving]             = useState(false)
  const [editError, setEditError]       = useState('')
  const [fetchingId, setFetchingId]     = useState<string | null>(null)
  const [fetchMsg, setFetchMsg]         = useState<Record<string, string>>({})
  const [runHistory, setRunHistory]     = useState<FeedRun[]>([])
  const [loadingRuns, setLoadingRuns]   = useState(false)
  const [expandedPanel, setExpandedPanel] = useState<Record<string, 'runs' | 'outputs' | null>>({})
  const [projects, setProjects]           = useState<{ id: string; name: string }[]>([])
  const [workspaces, setWorkspaces]       = useState<{ id: string; name: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listFeedSources()
    setSources(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()).catch(() => ({})),
      fetch('/api/workspaces').then(r => r.json()).catch(() => ({})),
    ]).then(([pJson, wJson]: [Record<string, unknown>, Record<string, unknown>]) => {
      setProjects(((pJson.projects ?? []) as Record<string, unknown>[]).map((p) => ({ id: p.id as string, name: p.name as string })))
      setWorkspaces(((wJson.data ?? []) as Record<string, unknown>[]).map((w) => ({ id: w.id as string, name: w.name as string })))
    }).catch(() => { /* silently ignore fetch errors */ })
  }, [])

  const fetchRuns = useCallback(async (sourceId: string) => {
    setLoadingRuns(true)
    setRunHistory([])
    try {
      const res = await fetch(`/api/feeds/${sourceId}/runs?limit=5`)
      if (res.ok) {
        const data = await res.json() as { runs: FeedRun[] }
        setRunHistory(data.runs)
      }
    } finally {
      setLoadingRuns(false)
    }
  }, [])

  const handlePause = async (src: FeedSource) => {
    const res = await fetch(`/api/feeds/${src.id}/pause`, { method: 'POST' })
    if (res.ok) setSources((prev) => prev.map((s) => s.id === src.id ? { ...s, status: 'paused' as const } : s))
  }

  const handleResume = async (src: FeedSource) => {
    const res = await fetch(`/api/feeds/${src.id}/resume`, { method: 'POST' })
    if (res.ok) setSources((prev) => prev.map((s) => s.id === src.id ? { ...s, status: 'active' as const } : s))
  }

  const handleCopy = async (src: FeedSource) => {
    setMenuOpen(null)
    const res = await copyFeedSource(src.id)
    if (res.source) setSources((prev) => [res.source!, ...prev])
  }

  const handleDelete = async (src: FeedSource) => {
    setMenuOpen(null)
    if (!confirm(`Quelle „${src.name}" wirklich löschen? Alle zugehörigen Artikel werden ebenfalls entfernt.`)) return
    const res = await deleteFeedSource(src.id)
    if (!res.error) {
      setSources((prev) => prev.filter((s) => s.id !== src.id))
      if (editing?.id === src.id) setEditing(null)
    }
  }

  const handleFetchNow = async (src: FeedSource) => {
    setMenuOpen(null)
    setFetchingId(src.id)
    setFetchMsg((prev) => ({ ...prev, [src.id]: '' }))
    try {
      const res = await fetch(`/api/feeds/${src.id}/run`, { method: 'POST' })
      const data = await res.json() as { itemsFound?: number; itemsDistributed?: number; errors?: { message: string }[] }
      const msg = (data.itemsFound ?? 0) > 0
        ? `${data.itemsFound} Artikel gefunden, ${data.itemsDistributed ?? 0} verteilt`
        : data.errors?.length ? `Fehler: ${data.errors[0].message}` : 'Keine neuen Artikel'
      setFetchMsg((prev) => ({ ...prev, [src.id]: msg }))
      setSources((prev) => prev.map((s) => s.id === src.id ? { ...s, lastFetchedAt: new Date().toISOString() } : s))
    } finally {
      setFetchingId(null)
    }
  }

  const openEdit = async (src: FeedSource) => {
    setEditing(src)
    setEditName(src.name)
    setEditUrl(src.url ?? '')
    setEditMinScore(src.minScore)
    setEditError('')
    setMenuOpen(null)
    await fetchRuns(src.id)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setEditError('')
    const res = await updateFeedSource(editing.id, { name: editName, url: editUrl || null, minScore: editMinScore })
    setSaving(false)
    if (res.error) { setEditError(res.error); return }
    if (res.source) setSources((prev) => prev.map((s) => s.id === editing.id ? res.source! : s))
    setEditing(null)
  }

  const handleToggleTopic = async (topicId: string, sourceId: string, add: boolean) => {
    const res = await toggleTopicSource(topicId, sourceId, add)
    if (!res.error) {
      onTopicsChange(topics.map((t) => {
        if (t.id !== topicId) return t
        return {
          ...t,
          sourceIds: add
            ? [...t.sourceIds, sourceId]
            : t.sourceIds.filter((id) => id !== sourceId),
        }
      }))
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Wird geladen…</div>
  }

  if (sources.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
        Noch keine Quellen. <Link href="/feeds/new" style={{ color: 'var(--accent)' }}>Erste Quelle anlegen →</Link>
      </div>
    )
  }

  return (
    <div onClick={() => setMenuOpen(null)}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {sources.map((src) => {
          const est = estimateFeedCost(estimateArticlesPerWeek(src.type), src.minScore)
          const srcTopics = topics.filter((t) => t.sourceIds.includes(src.id))
          return (
            <div
              key={src.id}
              className="card"
              style={{
                padding: '16px 18px', cursor: 'pointer',
                borderLeft: src.status === 'active' ? '3px solid var(--accent)' : src.status === 'error' ? '3px solid var(--error)' : '3px solid var(--border)',
                opacity: src.status === 'active' ? 1 : 0.65,
                outline: editing?.id === src.id ? '2px solid var(--accent)' : undefined,
                position: 'relative',
              }}
              onClick={() => openEdit(src)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-inverse)', background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)' }}>
                  {src.type.toUpperCase()}
                </span>
                <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon"
                    title={src.status === 'active' ? 'Pausieren' : 'Aktivieren'}
                    aria-label={src.status === 'active' ? 'Quelle pausieren' : 'Quelle aktivieren'}
                    onClick={() => src.status === 'active' ? handlePause(src) : handleResume(src)}>
                    {src.status === 'active'
                      ? <PauseCircle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
                      : <PlayCircle  size={16} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />}
                  </button>
                  <button className="btn-icon" aria-label="Weitere Aktionen" aria-haspopup="true"
                    aria-expanded={menuOpen === src.id}
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === src.id ? null : src.id) }}>
                    <DotsThree size={16} weight="bold" aria-hidden="true" />
                  </button>
                  {menuOpen === src.id && (
                    <div className="dropdown" style={{ position: 'absolute', right: 12, top: 44, zIndex: 20, minWidth: 180 }}
                      role="menu" onClick={(e) => e.stopPropagation()}>
                      <button role="menuitem" className="dropdown-item" onClick={() => handleFetchNow(src)}
                        disabled={fetchingId === src.id || src.type === 'email'}>
                        <ArrowClockwise size={14} weight="bold" aria-hidden="true" />
                        {fetchingId === src.id ? 'Wird gefetcht…' : 'Jetzt fetchen'}
                      </button>
                      <div className="dropdown-divider" />
                      <button role="menuitem" className="dropdown-item" onClick={() => openEdit(src)}>
                        <PencilSimple size={14} weight="bold" aria-hidden="true" /> Bearbeiten
                      </button>
                      <button role="menuitem" className="dropdown-item" onClick={() => handleCopy(src)}>
                        <Copy size={14} weight="bold" aria-hidden="true" /> Duplizieren
                      </button>
                      <div className="dropdown-divider" />
                      <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => handleDelete(src)}>
                        <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{src.name}</div>
              {src.url && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {src.url}
                </div>
              )}

              {/* Cost estimate row */}
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                ~{est.articlesPerWeek} Artikel/Woche · {formatCostPerWeek(est.weeklyEur)}/Woche
              </div>

              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                <span>Min. Score: {src.minScore}</span>
                {src.lastFetchedAt && <span>Zuletzt: {new Date(src.lastFetchedAt).toLocaleDateString('de-DE')}</span>}
                {src.errorCount > 0 && (
                  <span style={{ color: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Warning size={12} weight="fill" aria-hidden="true" /> {src.errorCount} Fehler
                  </span>
                )}
              </div>

              {fetchingId === src.id && (
                <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowClockwise size={12} weight="bold" aria-hidden="true" /> Wird gefetcht…
                </div>
              )}
              {fetchMsg[src.id] && fetchingId !== src.id && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                  {fetchMsg[src.id]}
                </div>
              )}

              {/* Keyword chips */}
              {src.keywordsInclude.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {src.keywordsInclude.slice(0, 3).map((k, i) => (
                    <span key={i} className="chip" style={{ fontSize: 11 }}>{k}</span>
                  ))}
                  {src.keywordsInclude.length > 3 && (
                    <span className="chip" style={{ fontSize: 11 }}>+{src.keywordsInclude.length - 3}</span>
                  )}
                </div>
              )}

              {/* Topic badges */}
              {srcTopics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {srcTopics.map((t) => (
                    <span key={t.id} style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                      background: t.color ?? 'var(--active-bg)', color: 'var(--text-inverse)',
                    }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Panel-Toggles */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }} onClick={(e) => e.stopPropagation()}>
                <button
                  className={`chip${expandedPanel[src.id] === 'runs' ? ' chip--active' : ''}`}
                  onClick={() => setExpandedPanel(p => ({ ...p, [src.id]: p[src.id] === 'runs' ? null : 'runs' }))}
                >
                  Run-Historie
                </button>
                <button
                  className={`chip${expandedPanel[src.id] === 'outputs' ? ' chip--active' : ''}`}
                  onClick={() => setExpandedPanel(p => ({ ...p, [src.id]: p[src.id] === 'outputs' ? null : 'outputs' }))}
                >
                  Outputs
                </button>
              </div>

              {expandedPanel[src.id] === 'runs' && (
                <div onClick={(e) => e.stopPropagation()}>
                  <RunHistoryPanel
                    runs={runHistory}
                    loading={loadingRuns}
                    onRefresh={() => fetchRuns(src.id)}
                  />
                </div>
              )}
              {expandedPanel[src.id] === 'outputs' && (
                <div onClick={(e) => e.stopPropagation()}>
                  <DistributionsPanel
                    sourceId={src.id}
                    projects={projects}
                    workspaces={workspaces}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span className="card-header-label">Quelle bearbeiten</span>
            <button className="btn-icon" aria-label="Schließen" onClick={() => setEditing(null)}><X size={14} weight="bold" /></button>
          </div>
          {editError && (
            <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, fontSize: 13, color: 'var(--error)', marginBottom: 16 }}>
              {editError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name</label>
              <input
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                value={editName} onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            {editing.type !== 'email' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>URL</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://…"
                />
              </div>
            )}
            <div style={{ gridColumn: editing.type === 'email' ? undefined : '1 / -1' }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Mindest-Score ({editMinScore})
              </label>
              <input type="range" min={1} max={10} value={editMinScore}
                onChange={(e) => setEditMinScore(Number(e.target.value))}
                style={{ width: '100%' }} aria-label="Mindest-Score" />
              <p className="form-hint">
                Artikel werden von KI auf Relevanz bewertet (Score 1–10).{' '}
                Nur Artikel <strong>ab diesem Score</strong> werden angezeigt.{' '}
                <span className="form-hint-option">5 – großzügig</span>{' '}
                <span className="form-hint-recommended">6 – empfohlen</span>{' '}
                <span className="form-hint-option">8 – streng</span>
              </p>
            </div>
          </div>

          {/* Topic assignment */}
          {topics.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
                Themen
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {topics.map((t) => {
                  const assigned = t.sourceIds.includes(editing.id)
                  return (
                    <label key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={(e) => handleToggleTopic(t.id, editing.id, e.target.checked)}
                      />
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                        background: assigned ? (t.color ?? 'var(--active-bg)') : 'var(--border)',
                        color: assigned ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      }}>
                        {t.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Run-History */}
          <div style={{ marginTop: 24 }}>
            <div className="card-divider" style={{ marginBottom: 16 }} />
            <RunHistoryPanel
              runs={runHistory}
              loading={loadingRuns}
              onRefresh={() => editing && fetchRuns(editing.id)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Abbrechen</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
