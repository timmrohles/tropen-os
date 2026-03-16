'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  Code, Table, FileText, ListBullets,
  DownloadSimple, Trash, MagnifyingGlass,
  ArrowLeft, Archive,
} from '@phosphor-icons/react'

interface Artifact {
  id: string
  name: string
  type: 'code' | 'table' | 'document' | 'list'
  language: string | null
  content: string
  created_at: string
  conversation_id: string
  message_id: string | null
}

const TYPE_LABELS: Record<Artifact['type'], string> = {
  code: 'Code',
  table: 'Tabelle',
  document: 'Dokument',
  list: 'Liste',
}

function typeIcon(type: Artifact['type'], size = 16) {
  switch (type) {
    case 'code':     return <Code size={size} weight="bold" />
    case 'table':    return <Table size={size} weight="bold" />
    case 'document': return <FileText size={size} weight="bold" />
    case 'list':     return <ListBullets size={size} weight="bold" />
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function downloadArtifact(artifact: Artifact) {
  const ext = artifact.type === 'code' && artifact.language ? `.${artifact.language}` : '.txt'
  const blob = new Blob([artifact.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${artifact.name}${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

const s: Record<string, React.CSSProperties> = {
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    color: 'var(--text-tertiary)', fontSize: 13,
    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
    marginBottom: 20,
  },
  filterBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: 24, flexWrap: 'wrap' as const,
  },
  searchWrap: { position: 'relative' as const, flex: 1, minWidth: 200 },
  searchInput: {
    width: '100%', background: 'var(--bg-input)',
    border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 12px 8px 36px', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  },
  searchIcon: {
    position: 'absolute' as const, left: 10, top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
    pointerEvents: 'none' as const,
  },
  typeFilters: { display: 'flex', gap: 6 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: 16,
    display: 'flex', flexDirection: 'column' as const, gap: 10,
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  cardIcon: { color: 'var(--accent)', flexShrink: 0, marginTop: 1 },
  cardName: {
    color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
    flex: 1, lineHeight: 1.3,
  },
  cardPreview: {
    color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.5,
    fontFamily: 'monospace', background: 'var(--bg-elevated)',
    borderRadius: 6, padding: '6px 8px',
    whiteSpace: 'pre-wrap' as const, overflow: 'hidden', maxHeight: 60,
  },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { color: 'var(--text-tertiary)', fontSize: 11 },
  cardActions: { display: 'flex', gap: 6 },
  typeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, fontWeight: 600, padding: '2px 7px',
    borderRadius: 20, border: '1px solid var(--border-muted)',
    color: 'var(--text-secondary)', textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  empty: { textAlign: 'center' as const, padding: '60px 0', color: 'var(--text-tertiary)' },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 },
  emptyText: { fontSize: 13 },
  loading: { color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' as const },
}

function ArtifactsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const backWs = searchParams.get('ws')
  const backConv = searchParams.get('conv')
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<Artifact['type'] | 'all'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      const orgId = profile?.organization_id
      const url = orgId ? `/api/artifacts?organizationId=${orgId}` : `/api/artifacts`

      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setArtifacts(Array.isArray(json) ? json : (json.data ?? []))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return artifacts.filter((art) => {
      if (typeFilter !== 'all' && art.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!art.name.toLowerCase().includes(q) && !art.content.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [artifacts, typeFilter, search])

  async function handleDelete(id: string) {
    if (deletingId) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/artifacts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArtifacts((prev) => prev.filter((a) => a.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="content-max" aria-busy={loading} aria-live="polite">
        {(backWs || backConv) && (
          <button
            onClick={() => backWs
              ? router.push(`/workspaces/${backWs}${backConv ? `?conv=${backConv}` : ''}`)
              : router.back()
            }
            style={s.backBtn}
          >
            <ArrowLeft size={14} weight="bold" />
            Zurück zum Chat
          </button>
        )}

        <div className="page-header" style={{ marginBottom: 24 }}>
          <div className="page-header-text">
            <h1 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Archive size={24} color="var(--accent)" weight="fill" />
              Artefakte
            </h1>
            <p className="page-header-sub">Gespeicherte Code-Blöcke, Tabellen und Dokumente aus deinen Chats</p>
          </div>
          <div className="page-header-actions">
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{artifacts.length} gesamt</span>
          </div>
        </div>

        <div style={s.filterBar}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}><MagnifyingGlass size={14} weight="bold" /></span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Artefakte durchsuchen…"
              style={s.searchInput}
            />
          </div>
          <div style={s.typeFilters}>
            {(['all', 'code', 'table', 'document', 'list'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={typeFilter === t ? 'chip chip--active' : 'chip'}
              >
                {t === 'all' ? 'Alle' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={s.loading}>Laden…</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyTitle}>
              {artifacts.length === 0 ? 'Noch keine Artefakte' : 'Keine Treffer'}
            </div>
            <div style={s.emptyText}>
              {artifacts.length === 0
                ? 'Speichere Code-Blöcke aus dem Chat als Artefakte.'
                : 'Versuche einen anderen Suchbegriff oder Filter.'}
            </div>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map((art) => (
              <div key={art.id} style={s.card}>
                <div style={s.cardHeader}>
                  <span style={s.cardIcon}>{typeIcon(art.type, 18)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cardName}>{art.name}</div>
                    <span style={s.typeBadge}>
                      {TYPE_LABELS[art.type]}
                      {art.language ? ` · ${art.language}` : ''}
                    </span>
                  </div>
                </div>

                <div style={s.cardPreview}>
                  {art.content.slice(0, 100)}
                  {art.content.length > 100 ? '…' : ''}
                </div>

                <div style={s.cardMeta}>
                  <span style={s.cardDate}>{formatDate(art.created_at)}</span>
                  <div style={s.cardActions}>
                    <button onClick={() => downloadArtifact(art)} title="Herunterladen" className="btn-icon">
                      <DownloadSimple size={15} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id)}
                      title="Löschen"
                      disabled={deletingId === art.id}
                      className="btn-icon"
                      style={{ opacity: deletingId === art.id ? 0.4 : 1 }}
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

export default function ArtifactsPage() {
  return (
    <Suspense>
      <ArtifactsPageInner />
    </Suspense>
  )
}
