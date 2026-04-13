'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { ArtifactPreviewModal } from '@/components/artefakte/ArtifactPreviewModal'
import {
  Archive, ArrowLeft, Atom, ChartBar, ChatCircle, Code,
  DownloadSimple, File, FileText, Image, ListBullets,
  MagnifyingGlass, PencilSimple, Sparkle, Table, Trash, DotsThree, ShareNetwork,
} from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'

type ArtifactType = 'code' | 'table' | 'document' | 'list' | 'react' | 'data' | 'image' | 'other'

interface Artifact {
  id: string
  name: string
  type: ArtifactType
  language: string | null
  content: string
  created_at: string
  conversation_id: string
  message_id: string | null
}

function getTypeConfig(t: (key: string) => string): Record<ArtifactType, { label: string; icon: React.ReactNode }> {
  return {
    code:     { label: t('types.code'),     icon: <Code size={14} weight="bold" /> },
    table:    { label: t('types.table'),    icon: <Table size={14} weight="bold" /> },
    document: { label: t('types.document'), icon: <FileText size={14} weight="bold" /> },
    list:     { label: t('types.list'),     icon: <ListBullets size={14} weight="bold" /> },
    react:    { label: t('types.react'),    icon: <Atom size={14} weight="bold" /> },
    data:     { label: t('types.data'),     icon: <ChartBar size={14} weight="bold" /> },
    image:    { label: t('types.image'),    icon: <Image size={14} weight="bold" /> },
    other:    { label: t('types.other'),    icon: <File size={14} weight="bold" /> },
  }
}

const ALL_TYPES: ArtifactType[] = ['code', 'table', 'document', 'list', 'react', 'data', 'image', 'other']

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

function ArtifactMenu({
  artifact,
  onRename,
  onDelete,
  deleting,
  labels,
}: {
  artifact: Artifact
  onRename: (a: Artifact) => void
  onDelete: (a: Artifact) => void
  deleting: string | null
  labels: { rename: string; saveToWorkspace: string; deleting: string; delete: string; moreOptions: string }
}) {
  const [open, setOpen] = useState(false)
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          className="btn-icon"
          onClick={() => setOpen(p => !p)}
          aria-label={labels.moreOptions}
          title={labels.moreOptions}
        >
          <DotsThree size={16} weight="bold" />
        </button>
        {open && (
          <div
            className="dropdown animate-dropdown"
            style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 180, zIndex: 50 }}
          >
            <button className="dropdown-item" onClick={() => { setOpen(false); onRename(artifact) }}>
              <PencilSimple size={14} weight="bold" /> {labels.rename}
            </button>
            <button className="dropdown-item" onClick={() => { setOpen(false); setShowWorkspacePicker(true) }}>
              <ShareNetwork size={14} weight="bold" /> {labels.saveToWorkspace}
            </button>
            <div className="dropdown-divider" />
            <button
              className="dropdown-item dropdown-item--danger"
              onClick={() => { setOpen(false); onDelete(artifact) }}
              disabled={deleting === artifact.id}
            >
              <Trash size={14} weight="bold" />
              {deleting === artifact.id ? labels.deleting : labels.delete}
            </button>
          </div>
        )}
      </div>
      {showWorkspacePicker && (
        <WorkspacePicker
          itemType="artifact"
          itemId={artifact.id}
          itemTitle={artifact.name}
          onClose={() => setShowWorkspacePicker(false)}
        />
      )}
    </>
  )
}

function ArtifactsPageInner() {
  const t = useTranslations('artifacts')
  const tc = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const backWs = searchParams.get('ws')
  const backConv = searchParams.get('conv')

  const TYPE_CONFIG = getTypeConfig(t)

  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ArtifactType | 'all'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewArtifact, setPreviewArtifact] = useState<Artifact | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus()
  }, [renamingId])

  const filtered = useMemo(() =>
    artifacts.filter((art) => {
      if (typeFilter !== 'all' && art.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!art.name.toLowerCase().includes(q) && !art.content.toLowerCase().includes(q)) return false
      }
      return true
    }),
    [artifacts, typeFilter, search]
  )

  const activeTypes = useMemo(
    () => ALL_TYPES.filter(ty => artifacts.some(a => a.type === ty)),
    [artifacts]
  )

  async function handleDelete(artifact: Artifact) {
    if (!confirm(`${tc('delete')} „${artifact.name}"?`)) return
    setDeletingId(artifact.id)
    try {
      const res = await fetch(`/api/artifacts/${artifact.id}`, { method: 'DELETE' })
      if (res.ok) setArtifacts(prev => prev.filter(a => a.id !== artifact.id))
    } finally {
      setDeletingId(null)
    }
  }

  function handleStartRename(artifact: Artifact) {
    setRenamingId(artifact.id)
    setRenameValue(artifact.name)
  }

  async function handleRenameCommit(artifact: Artifact) {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === artifact.name) { setRenamingId(null); return }
    const res = await fetch(`/api/artifacts/${artifact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) setArtifacts(prev => prev.map(a => a.id === artifact.id ? { ...a, name: trimmed } : a))
    setRenamingId(null)
  }

  const menuLabels = {
    rename: t('renameItem'),
    saveToWorkspace: t('saveToWorkspace'),
    deleting: t('deleting'),
    delete: tc('delete'),
    moreOptions: t('moreOptions'),
  }

  return (
    <div className="content-max" aria-busy={loading} aria-live="polite">
      {(backWs || backConv) && (
        <button
          onClick={() => backWs
            ? router.push(`/workspaces/${backWs}${backConv ? `?conv=${backConv}` : ''}`)
            : router.back()
          }
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-tertiary)', fontSize: 13,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} weight="bold" />
          {t('backToChat')}
        </button>
      )}

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Sparkle size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{t('totalCount', { count: artifacts.length })}</span>
        </div>
      </div>

      {/* Filter-Bar */}
      <div style={{ marginBottom: 24 }}>
        <div className="search-bar-container">
          <MagnifyingGlass
            size={14} weight="bold" aria-hidden="true"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div className="page-filter-row">
          <button
            className={typeFilter === 'all' ? 'chip chip--active' : 'chip'}
            onClick={() => setTypeFilter('all')}
          >
            {tc('all')}
            <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>{artifacts.length}</span>
          </button>
          {activeTypes.map(ty => (
            <button
              key={ty}
              className={typeFilter === ty ? 'chip chip--active' : 'chip'}
              onClick={() => setTypeFilter(ty)}
            >
              {TYPE_CONFIG[ty].label}
              <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>
                {artifacts.filter(a => a.type === ty).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 14, paddingTop: 24 }}>{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Archive size={32} color="var(--text-tertiary)" weight="fill" />
          <div className="empty-state-title">
            {artifacts.length === 0 ? t('emptyTitle') : t('noResultsTitle')}
          </div>
          <div className="empty-state-text">
            {artifacts.length === 0 ? t('emptyText') : t('noResultsText')}
          </div>
          {artifacts.length === 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/chat')}>
              <ChatCircle size={14} weight="bold" aria-hidden="true" />
              {t('openChat')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map((art) => {
            const cfg = TYPE_CONFIG[art.type] ?? TYPE_CONFIG.other
            return (
              <div
                key={art.id}
                className="card artifact-card"
                onClick={() => setPreviewArtifact(art)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setPreviewArtifact(art)}
                aria-label={`${art.name} ${t('openChat').toLowerCase()}`}
                style={{ cursor: 'pointer' }}
              >
                {/* Header: type badge + hover actions */}
                <div className="artifact-card-header">
                  <div className="artifact-card-type">
                    {cfg.icon}
                    {cfg.label}
                    {art.language ? ` · ${art.language}` : ''}
                  </div>
                  <div className="artifact-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-icon"
                      onClick={() => downloadArtifact(art)}
                      title={t('download')}
                      aria-label={`${art.name} ${t('download').toLowerCase()}`}
                    >
                      <DownloadSimple size={14} weight="bold" />
                    </button>
                    <ArtifactMenu
                      artifact={art}
                      onRename={handleStartRename}
                      onDelete={handleDelete}
                      deleting={deletingId}
                      labels={menuLabels}
                    />
                  </div>
                </div>

                {/* Title / inline rename */}
                {renamingId === art.id ? (
                  <input
                    ref={renameInputRef}
                    onClick={e => e.stopPropagation()}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameCommit(art)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameCommit(art)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    style={{
                      width: '100%', background: 'var(--bg-input)',
                      border: '1px solid var(--accent)', borderRadius: 6,
                      padding: '4px 8px', color: 'var(--text-primary)',
                      fontSize: 13, fontWeight: 600, outline: 'none',
                    }}
                  />
                ) : (
                  <div className="artifact-card-title">{art.name}</div>
                )}

                {/* Preview */}
                {art.type === 'image' ? (
                  <div className="artifact-card-image-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.content}
                      alt={art.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                    />
                  </div>
                ) : (
                  <div className="artifact-card-preview">
                    {art.content.slice(0, 120)}{art.content.length > 120 ? '…' : ''}
                  </div>
                )}

                {/* Footer */}
                <div className="artifact-card-footer">
                  <span className="artifact-card-date">{formatDate(art.created_at)}</span>
                  {art.conversation_id && (
                    <a
                      href={`/workspaces?conv=${art.conversation_id}`}
                      className="artifact-card-chat-link"
                      aria-label={t('openInChat')}
                    >
                      <ChatCircle size={13} weight="bold" />
                      {t('openInChat')}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {previewArtifact && (
        <ArtifactPreviewModal
          artifact={previewArtifact}
          onClose={() => setPreviewArtifact(null)}
        />
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
