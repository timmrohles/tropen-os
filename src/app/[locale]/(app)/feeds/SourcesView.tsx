'use client'
// src/app/feeds/SourcesView.tsx — Quellen-Verwaltung Tab
import { useState, useCallback, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import {
  listFeedSources, updateFeedSource, deleteFeedSource, copyFeedSource,
} from '@/actions/feeds'
import { toggleTopicSource } from '@/actions/feed-topics'
import type { FeedSource, FeedRun, FeedTopic } from '@/types/feeds'
import SourceCard from './SourceCard'
import SourceEditCard from './SourceEditCard'

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

  const buildFetchMsg = (data: { itemsFound?: number; itemsDistributed?: number; errors?: { message: string }[] }): string => {
    if ((data.itemsFound ?? 0) > 0) return `${data.itemsFound} Artikel gefunden, ${data.itemsDistributed ?? 0} verteilt`
    if (data.errors?.length) return `Fehler: ${data.errors[0].message}`
    return 'Keine neuen Artikel'
  }

  const handleFetchNow = async (src: FeedSource) => {
    setMenuOpen(null)
    setFetchingId(src.id)
    setFetchMsg((prev) => ({ ...prev, [src.id]: '' }))
    try {
      const res = await fetch(`/api/feeds/${src.id}/run`, { method: 'POST' })
      const data = await res.json() as { itemsFound?: number; itemsDistributed?: number; errors?: { message: string }[] }
      setFetchMsg((prev) => ({ ...prev, [src.id]: buildFetchMsg(data) }))
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

  const applyTopicSourceIds = (topicId: string, sourceId: string, add: boolean) => {
    onTopicsChange(topics.map((t) => {
      if (t.id !== topicId) return t
      const sourceIds = add
        ? [...t.sourceIds, sourceId]
        : t.sourceIds.filter((id) => id !== sourceId)
      return { ...t, sourceIds }
    }))
  }

  const handleToggleTopic = async (topicId: string, sourceId: string, add: boolean) => {
    const res = await toggleTopicSource(topicId, sourceId, add)
    if (!res.error) applyTopicSourceIds(topicId, sourceId, add)
  }

  const handleMenuToggle = (id: string) => {
    setMenuOpen((prev) => prev === id ? null : id)
  }

  const handlePanelToggle = (id: string, panel: 'runs' | 'outputs') => {
    setExpandedPanel((p) => ({ ...p, [id]: p[id] === panel ? null : panel }))
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
        {sources.map((src) => (
          <SourceCard
            key={src.id}
            src={src}
            srcTopics={topics.filter((t) => t.sourceIds.includes(src.id))}
            menuOpen={menuOpen}
            expandedPanel={expandedPanel}
            fetchingId={fetchingId}
            fetchMsg={fetchMsg}
            runHistory={runHistory}
            loadingRuns={loadingRuns}
            isEditing={editing?.id === src.id}
            projects={projects}
            workspaces={workspaces}
            onOpenEdit={openEdit}
            onPause={handlePause}
            onResume={handleResume}
            onCopy={handleCopy}
            onDelete={handleDelete}
            onFetchNow={handleFetchNow}
            onMenuToggle={handleMenuToggle}
            onPanelToggle={handlePanelToggle}
            onFetchRuns={fetchRuns}
          />
        ))}
      </div>

      {editing && (
        <SourceEditCard
          editing={editing}
          editName={editName}
          editUrl={editUrl}
          editMinScore={editMinScore}
          saving={saving}
          editError={editError}
          runHistory={runHistory}
          loadingRuns={loadingRuns}
          topics={topics}
          onNameChange={setEditName}
          onUrlChange={setEditUrl}
          onMinScoreChange={setEditMinScore}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onToggleTopic={handleToggleTopic}
          onRefreshRuns={() => editing && fetchRuns(editing.id)}
        />
      )}
    </div>
  )
}
