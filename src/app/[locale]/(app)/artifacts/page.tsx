'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import { ArtifactPreviewModal } from '@/components/artefakte/ArtifactPreviewModal'
import { Archive, ArrowLeft, ChatCircle, MagnifyingGlass, Sparkle } from '@phosphor-icons/react'
import {
  type Artifact, type MenuLabels,
  ArtifactCard, ALL_TYPES, getTypeConfig,
} from './_components/ArtifactCard'

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
  const [typeFilter, setTypeFilter] = useState<Artifact['type'] | 'all'>('all')
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
      if (!search) return true
      const q = search.toLowerCase()
      return art.name.toLowerCase().includes(q) || art.content.toLowerCase().includes(q)
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

  const menuLabels: MenuLabels = {
    rename: t('renameItem'),
    saveToWorkspace: t('saveToWorkspace'),
    deleting: t('deleting'),
    delete: tc('delete'),
    moreOptions: t('moreOptions'),
  }

  function renderContent() {
    if (loading) {
      return <div style={{ color: 'var(--text-tertiary)', fontSize: 14, paddingTop: 24 }}>{t('loading')}</div>
    }
    if (filtered.length === 0) {
      return (
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
      )
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map((art) => {
          const cfg = TYPE_CONFIG[art.type] ?? TYPE_CONFIG.other
          return (
            <ArtifactCard
              key={art.id}
              art={art}
              cfg={cfg}
              renamingId={renamingId}
              renameValue={renameValue}
              renameInputRef={renameInputRef}
              deletingId={deletingId}
              menuLabels={menuLabels}
              onPreview={setPreviewArtifact}
              onStartRename={handleStartRename}
              onDelete={handleDelete}
              onRenameValueChange={setRenameValue}
              onRenameCommit={handleRenameCommit}
              onRenameClear={() => setRenamingId(null)}
              t={t}
            />
          )
        })}
      </div>
    )
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
            <Sparkle size={22} color="var(--accent)" weight="fill" aria-hidden="true" />
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

      {renderContent()}

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
