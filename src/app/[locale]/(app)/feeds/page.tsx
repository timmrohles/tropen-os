'use client'
// src/app/feeds/page.tsx — Newscenter
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  listFeedItems, listFeedSources,
  markItemRead, toggleItemSaved, markItemNotRelevant, archiveItem, deleteItem,
  dismissItem, restoreItem,
} from '@/actions/feeds'
import { listTopics, createTopic, deleteTopic } from '@/actions/feed-topics'
import type { FeedItem, FeedSource, FeedTopic } from '@/types/feeds'
import {
  MagnifyingGlass, Rss, Plus, X,
} from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'
import SourcesView from './SourcesView'
import DataView from './DataView'
import NotificationBadge from './_components/NotificationBadge'
import { TopicModal } from './_components/TopicModal'
import { FeedItemCard } from './_components/FeedItemCard'

const PAGE_SIZE = 20

type View = 'articles' | 'saved' | 'dismissed' | 'data' | 'sources'

export default function FeedsPage() {
  const t = useTranslations('feeds')
  const tc = useTranslations('common')

  const [view, setView]               = useState<View>('articles')
  const [sources, setSources]         = useState<FeedSource[]>([])
  const [topics, setTopics]           = useState<FeedTopic[]>([])
  const [items, setItems]             = useState<FeedItem[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [menuOpen, setMenuOpen]       = useState<string | null>(null)
  const [workspacePicker, setWorkspacePicker] = useState<{ id: string; title: string } | null>(null)

  // Topic modal state
  const [topicModal, setTopicModal]         = useState(false)
  const [newTopicName, setNewTopicName]     = useState('')
  const [topicSourceSel, setTopicSourceSel] = useState<string[]>([])
  const [savingTopic, setSavingTopic]       = useState(false)
  const [topicError, setTopicError]         = useState('')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable refs so loadItems reads current values without being in its deps
  const viewRef         = useRef<View>('articles')
  const activeTopicRef  = useRef<string | null>(null)
  const searchRef       = useRef('')
  useEffect(() => {
    viewRef.current        = view
    activeTopicRef.current = activeTopic
    searchRef.current      = search
  })

  useEffect(() => {
    listFeedSources().then((data) => setSources(data)).catch(() => {})
    listTopics().then((data) => setTopics(data)).catch(() => {})
  }, [])

  const loadItems = useCallback(async (offset = 0, replace = true) => {
    setLoading(true)
    const currentView  = viewRef.current
    const currentTopic = activeTopicRef.current
    const opts: Parameters<typeof listFeedItems>[0] = {
      topicId: currentTopic ?? undefined,
      search:  searchRef.current.length > 2 ? searchRef.current : undefined,
      limit:   PAGE_SIZE,
      offset,
    }
    if (currentView === 'articles')  opts.status    = 'unread'
    if (currentView === 'saved')     opts.isSaved   = true
    if (currentView === 'dismissed') opts.dismissed = true

    const { items: data, total: count } = await listFeedItems(opts)
    setItems((prev) => replace ? data : [...prev, ...data])
    setTotal(count)
    setLoading(false)
  }, [])

  useEffect(() => { loadItems(0, true) }, [loadItems])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewChange = (newView: View) => {
    viewRef.current = newView
    setView(newView)
    setItems([])
    setTotal(0)
    loadItems(0, true)
  }

  const handleTopicChange = (topicId: string | null) => {
    activeTopicRef.current = topicId
    setActiveTopic(topicId)
    setItems([])
    setTotal(0)
    loadItems(0, true)
  }

  const handleSearch = (val: string) => {
    searchRef.current = val
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadItems(0, true), 300)
  }

  const getSource = (id: string) => sources.find((s) => s.id === id)

  // ── Item action handlers ────────────────────────────────────────────────

  const handleRestore = async (id: string) => {
    await restoreItem(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
    setTotal((prev) => Math.max(0, prev - 1))
  }

  const handleToggleSaved = async (id: string, newValue: boolean) => {
    await toggleItemSaved(id, newValue)
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, isSaved: newValue } : it))
  }

  const handleMarkRead = async (id: string) => {
    await markItemRead(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
    setTotal((prev) => Math.max(0, prev - 1))
  }

  const handleDismiss = async (id: string) => {
    await dismissItem(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
    setTotal((prev) => Math.max(0, prev - 1))
  }

  const handleMarkNotRelevant = async (id: string) => {
    await markItemNotRelevant(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleArchive = async (id: string) => {
    await archiveItem(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleDelete = async (id: string) => {
    await deleteItem(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  // ── Topic modal ───────────────────────────────────────────────────────────

  const openTopicModal = () => {
    setNewTopicName('')
    setTopicSourceSel([])
    setTopicError('')
    setTopicModal(true)
  }

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) { setTopicError(t('topicNameRequired')); return }
    setSavingTopic(true)
    setTopicError('')
    const res = await createTopic(newTopicName.trim(), topicSourceSel)
    setSavingTopic(false)
    if (res.error) { setTopicError(res.error); return }
    if (res.topic) setTopics((prev) => [...prev, res.topic!])
    setTopicModal(false)
  }

  const handleDeleteTopic = async (topicId: string) => {
    await deleteTopic(topicId)
    setTopics((prev) => prev.filter((tp) => tp.id !== topicId))
    if (activeTopic === topicId) handleTopicChange(null)
  }

  useEffect(() => {
    if (!topicModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTopicModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [topicModal])

  const isArticlesView = view === 'articles' || view === 'saved' || view === 'dismissed'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="content-max" onClick={() => setMenuOpen(null)}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Rss size={22} color="var(--accent)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <NotificationBadge />
          <Link href="/feeds/new" className="btn btn-primary">{t('addSource')}</Link>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button className={`chip${view === 'articles'  ? ' chip--active' : ''}`} onClick={() => handleViewChange('articles')}>
          {t('tabArticles')}
          {view === 'articles' && total > 0 && (
            <span style={{ marginLeft: 5, background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 700, padding: '1px 5px' }}>
              {total}
            </span>
          )}
        </button>
        <button className={`chip${view === 'saved'     ? ' chip--active' : ''}`} onClick={() => handleViewChange('saved')}>{t('tabSaved')}</button>
        <button className={`chip${view === 'dismissed' ? ' chip--active' : ''}`} onClick={() => handleViewChange('dismissed')}>{t('tabDismissed')}</button>
        <button className={`chip${view === 'data'      ? ' chip--active' : ''}`} onClick={() => handleViewChange('data')}>{t('tabData')}</button>
        <button className={`chip${view === 'sources'   ? ' chip--active' : ''}`} onClick={() => handleViewChange('sources')}>{t('tabSources')}</button>
      </div>

      {/* ── ARTICLES / SAVED / DISMISSED ──────────────────────────────────── */}
      {isArticlesView && (
        <>
          {/* Search */}
          <div className="search-bar-container" style={{ marginBottom: 12 }}>
            <MagnifyingGlass
              size={14} weight="bold" aria-hidden="true"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' as const }}
            />
            <input
              className="input"
              placeholder={t('searchPlaceholder')}
              value={search}
              aria-label={t('searchPlaceholder')}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          {/* Topic filter pills — scrollable row (not on dismissed) */}
          {view !== 'dismissed' && (
            <div className="page-filter-row" style={{ marginBottom: 20, overflowX: 'auto' as const, scrollbarWidth: 'none' as const, flexWrap: 'nowrap' as const }}>
              <button className={`chip${activeTopic === null ? ' chip--active' : ''}`} onClick={() => handleTopicChange(null)}>
                {t('topicAll')}
              </button>
              {topics.map((tp) => (
                <button
                  key={tp.id}
                  className={`chip${activeTopic === tp.id ? ' chip--active' : ''}`}
                  onClick={() => handleTopicChange(tp.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  {tp.name}
                  <span
                    style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.6, marginLeft: 2 }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(tp.id) }}
                    title={`${tc('delete')} "${tp.name}"`}
                    role="button"
                    aria-label={`${tc('delete')} ${tp.name}`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDeleteTopic(tp.id)}
                  >
                    <X size={10} weight="bold" aria-hidden="true" />
                  </span>
                </button>
              ))}
              <button
                className="chip"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const }}
                onClick={openTopicModal}
                aria-label={t('topicCreate')}
              >
                <Plus size={12} weight="bold" aria-hidden="true" /> {t('addTopic')}
              </button>
            </div>
          )}

          {/* Item count */}
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, textAlign: 'right' as const }}>
            {total} {view === 'dismissed' ? t('tabDismissed').toLowerCase() : t('tabArticles').toLowerCase()}
          </div>

          {/* Stream */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {loading && items.length === 0 && (
              <div style={{ textAlign: 'center' as const, padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }} role="status" aria-live="polite">
                {t('loading')}
              </div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ textAlign: 'center' as const, padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
                {view === 'dismissed' ? t('noDismissed') : t('noArticles')}
              </div>
            )}
            {items.map((item) => (
              <FeedItemCard
                key={item.id}
                item={item}
                source={getSource(item.sourceId)}
                isDismissed={view === 'dismissed'}
                menuOpen={menuOpen}
                t={t}
                tc={tc}
                onRestore={handleRestore}
                onToggleSaved={handleToggleSaved}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss}
                onMarkNotRelevant={handleMarkNotRelevant}
                onArchive={handleArchive}
                onSaveToWorkspace={(id, title) => setWorkspacePicker({ id, title })}
                onDelete={handleDelete}
                onMenuToggle={(id) => setMenuOpen(menuOpen === id ? null : id)}
                onMenuClose={() => setMenuOpen(null)}
              />
            ))}
            {items.length < total && (
              <button className="btn btn-ghost" style={{ alignSelf: 'center', marginTop: 8 }} onClick={() => loadItems(items.length, false)}>
                {t('loadMore', { count: total - items.length })}
              </button>
            )}
          </div>
        </>
      )}

      {/* ── DATA VIEW ────────────────────────────────────────────────────── */}
      {view === 'data' && <DataView />}

      {/* ── SOURCES VIEW ─────────────────────────────────────────────────── */}
      {view === 'sources' && (
        <SourcesView
          topics={topics}
          onTopicsChange={setTopics}
        />
      )}

      {/* ── TOPIC MODAL ──────────────────────────────────────────────────── */}
      {topicModal && (
        <TopicModal
          sources={sources}
          topicError={topicError}
          newTopicName={newTopicName}
          topicSourceSel={topicSourceSel}
          savingTopic={savingTopic}
          onNameChange={setNewTopicName}
          onSourceToggle={(id, checked) => setTopicSourceSel((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))}
          onClose={() => setTopicModal(false)}
          onSave={handleCreateTopic}
          t={t}
          tc={tc}
        />
      )}

      {workspacePicker && (
        <WorkspacePicker
          itemType="feed_source"
          itemId={workspacePicker.id}
          itemTitle={workspacePicker.title}
          onClose={() => setWorkspacePicker(null)}
        />
      )}
    </div>
  )
}
