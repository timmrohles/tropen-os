'use client'
// src/app/feeds/page.tsx — Newscenter
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  listFeedItems, listFeedSources,
  markItemRead, toggleItemSaved, markItemNotRelevant, archiveItem, deleteItem,
  dismissItem, restoreItem,
} from '@/actions/feeds'
import { listTopics, createTopic, deleteTopic } from '@/actions/feed-topics'
import type { FeedItem, FeedSource, FeedTopic } from '@/types/feeds'
import {
  BookmarkSimple, ArrowSquareOut, CheckCircle, DotsThree,
  ThumbsDown, Archive, Trash, Rss, MagnifyingGlass,
  EyeSlash, ArrowCounterClockwise, Tag, Plus, X, ShareNetwork,
} from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'
import SourcesView from './SourcesView'
import DataView from './DataView'
import NotificationBadge from './_components/NotificationBadge'

const SOURCE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: 'var(--tropen-process)',
  api:   'var(--tropen-output)',
  url:   'var(--text-tertiary)',
}

const PAGE_SIZE = 20

type View = 'articles' | 'saved' | 'dismissed' | 'data' | 'sources'

export default function FeedsPage() {
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
  viewRef.current        = view
  activeTopicRef.current = activeTopic
  searchRef.current      = search

  useEffect(() => {
    listFeedSources().then((data) => setSources(data))
    listTopics().then((data) => setTopics(data))
  }, [])

  // Truly stable — all values read from refs
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

  // ── Topic modal ───────────────────────────────────────────────────────────

  const openTopicModal = () => {
    setNewTopicName('')
    setTopicSourceSel([])
    setTopicError('')
    setTopicModal(true)
  }

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) { setTopicError('Name ist erforderlich'); return }
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
    setTopics((prev) => prev.filter((t) => t.id !== topicId))
    if (activeTopic === topicId) handleTopicChange(null)
  }

  useEffect(() => {
    if (!topicModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTopicModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [topicModal])

  // ── Shared item card renderer ─────────────────────────────────────────────

  const renderItem = (item: FeedItem) => {
    const src          = getSource(item.sourceId)
    const isUnread     = item.status === 'unread'
    const isDismissed  = view === 'dismissed'

    return (
      <div
        key={item.id}
        className="card"
        style={{
          padding: '14px 16px',
          borderLeft: isUnread && !isDismissed ? '3px solid var(--accent)' : undefined,
          position: 'relative' as const,
        }}
        onClick={() => setMenuOpen(null)}
      >
        {item.score && (
          <span style={{ position: 'absolute' as const, top: 10, right: 12, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}
            aria-label={`Relevanz: ${item.score} von 10`}>
            {item.score}/10
          </span>
        )}
        {src && (
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)', marginBottom: 6 }}>
            {src.name}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>{item.title}</div>
        {item.summary && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{item.summary}</div>
        )}
        {item.keyFacts && item.keyFacts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 }}>
            {item.keyFacts.slice(0, 4).map((f, i) => (
              <span key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px' }}>• {f}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer noopener" className="btn btn-ghost btn-sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              aria-label={`Artikel öffnen: ${item.title}`}>
              <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> Quelle
            </a>
          )}

          {isDismissed ? (
            // Dismissed view: restore only
            <button
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}
              onClick={async (e) => {
                e.stopPropagation()
                await restoreItem(item.id)
                setItems((prev) => prev.filter((it) => it.id !== item.id))
                setTotal((prev) => Math.max(0, prev - 1))
              }}
              aria-label="Artikel wiederherstellen"
            >
              <ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" /> Wiederherstellen
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: item.isSaved ? 'var(--accent)' : undefined, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={async (e) => {
                  e.stopPropagation()
                  await toggleItemSaved(item.id, !item.isSaved)
                  setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, isSaved: !it.isSaved } : it))
                }}
                aria-pressed={item.isSaved}
                aria-label={item.isSaved ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen'}
              >
                <BookmarkSimple size={13} weight={item.isSaved ? 'fill' : 'bold'} aria-hidden="true" />
                {item.isSaved ? 'Gespeichert' : 'Merken'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={async (e) => {
                  e.stopPropagation()
                  await markItemRead(item.id)
                  setItems((prev) => prev.filter((it) => it.id !== item.id))
                  setTotal((prev) => Math.max(0, prev - 1))
                }}
                aria-label="Als gelesen markieren"
              >
                <CheckCircle size={13} weight="bold" aria-hidden="true" /> Abhaken
              </button>
              <button
                className="btn-icon" style={{ marginLeft: 'auto' }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === item.id ? null : item.id) }}
                aria-label="Weitere Aktionen" aria-haspopup="true" aria-expanded={menuOpen === item.id}
              >
                <DotsThree size={16} weight="bold" aria-hidden="true" />
              </button>
              {menuOpen === item.id && (
                <div className="dropdown" style={{ position: 'absolute' as const, right: 12, top: 44, zIndex: 10, minWidth: 180 }}
                  role="menu" onClick={(e) => e.stopPropagation()}>
                  <button role="menuitem" className="dropdown-item"
                    onClick={async () => {
                      await dismissItem(item.id)
                      setItems((prev) => prev.filter((it) => it.id !== item.id))
                      setTotal((prev) => Math.max(0, prev - 1))
                      setMenuOpen(null)
                    }}>
                    <EyeSlash size={14} weight="bold" aria-hidden="true" /> Ausblenden
                  </button>
                  <button role="menuitem" className="dropdown-item"
                    onClick={async () => {
                      await markItemNotRelevant(item.id)
                      setItems((prev) => prev.filter((it) => it.id !== item.id))
                      setMenuOpen(null)
                    }}>
                    <ThumbsDown size={14} weight="bold" aria-hidden="true" /> Nicht passend
                  </button>
                  <button role="menuitem" className="dropdown-item"
                    onClick={async () => {
                      await archiveItem(item.id)
                      setItems((prev) => prev.filter((it) => it.id !== item.id))
                      setMenuOpen(null)
                    }}>
                    <Archive size={14} weight="bold" aria-hidden="true" /> Archivieren
                  </button>
                  <button role="menuitem" className="dropdown-item"
                    onClick={() => { setMenuOpen(null); setWorkspacePicker({ id: item.id, title: item.title }) }}>
                    <ShareNetwork size={14} weight="bold" aria-hidden="true" /> In Workspace ablegen
                  </button>
                  <div className="dropdown-divider" />
                  <button role="menuitem" className="dropdown-item dropdown-item--danger"
                    onClick={async () => {
                      await deleteItem(item.id)
                      setItems((prev) => prev.filter((it) => it.id !== item.id))
                      setMenuOpen(null)
                    }}>
                    <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="content-max" onClick={() => setMenuOpen(null)}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Rss size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Newscenter
          </h1>
          <p className="page-header-sub">Deine kuratierten Feed-Quellen</p>
        </div>
        <div className="page-header-actions">
          <NotificationBadge />
          <a href="/feeds/new" className="btn btn-primary">+ Quelle</a>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button className={`chip${view === 'articles'  ? ' chip--active' : ''}`} onClick={() => handleViewChange('articles')}>
          Artikel
          {view === 'articles' && total > 0 && (
            <span style={{ marginLeft: 5, background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 700, padding: '1px 5px' }}>
              {total}
            </span>
          )}

        </button>
        <button className={`chip${view === 'saved'     ? ' chip--active' : ''}`} onClick={() => handleViewChange('saved')}>Gespeichert</button>
        <button className={`chip${view === 'dismissed' ? ' chip--active' : ''}`} onClick={() => handleViewChange('dismissed')}>Ausgeblendet</button>
        <button className={`chip${view === 'data'      ? ' chip--active' : ''}`} onClick={() => handleViewChange('data')}>Daten</button>
        <button className={`chip${view === 'sources'   ? ' chip--active' : ''}`} onClick={() => handleViewChange('sources')}>Quellen verwalten</button>
      </div>

      {/* ── ARTICLES / SAVED / DISMISSED ──────────────────────────────────── */}
      {(view === 'articles' || view === 'saved' || view === 'dismissed') && (
        <>
          {/* Search */}
          <div className="search-bar-container" style={{ marginBottom: 12 }}>
            <MagnifyingGlass
              size={14} weight="bold" aria-hidden="true"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' as const }}
            />
            <input
              className="input"
              placeholder="Feeds durchsuchen…"
              value={search}
              aria-label="Feed-Suche"
              onChange={(e) => handleSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          {/* Topic filter pills — scrollable row (not on dismissed) */}
          {view !== 'dismissed' && (
            <div className="page-filter-row" style={{ marginBottom: 20, overflowX: 'auto' as const, scrollbarWidth: 'none' as const, flexWrap: 'nowrap' as const }}>
              <button className={`chip${activeTopic === null ? ' chip--active' : ''}`} onClick={() => handleTopicChange(null)}>
                Alle
              </button>
              {topics.map((t) => (
                <button
                  key={t.id}
                  className={`chip${activeTopic === t.id ? ' chip--active' : ''}`}
                  onClick={() => handleTopicChange(t.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  {t.name}
                  <span
                    style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.6, marginLeft: 2 }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id) }}
                    title={`Thema "${t.name}" löschen`}
                    role="button"
                    aria-label={`Thema ${t.name} löschen`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDeleteTopic(t.id)}
                  >
                    <X size={10} weight="bold" aria-hidden="true" />
                  </span>
                </button>
              ))}
              <button
                className="chip"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' as const }}
                onClick={openTopicModal}
                aria-label="Neues Thema anlegen"
              >
                <Plus size={12} weight="bold" aria-hidden="true" /> Thema
              </button>
            </div>
          )}

          {/* Item count */}
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12, textAlign: 'right' as const }}>
            {total} {view === 'dismissed' ? 'ausgeblendete Artikel' : 'Artikel'}
          </div>

          {/* Stream */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {loading && items.length === 0 && (
              <div style={{ textAlign: 'center' as const, padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }} role="status" aria-live="polite">
                Wird geladen…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ textAlign: 'center' as const, padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
                {view === 'dismissed' ? 'Keine ausgeblendeten Artikel.' : 'Keine Artikel gefunden.'}
              </div>
            )}
            {items.map((item) => renderItem(item))}
            {items.length < total && (
              <button className="btn btn-ghost" style={{ alignSelf: 'center', marginTop: 8 }} onClick={() => loadItems(items.length, false)}>
                Mehr laden ({total - items.length} weitere)
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
        <div
          className="modal-overlay" style={{ zIndex: 100, padding: 16 }}
          onClick={() => setTopicModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Neues Thema anlegen"
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 480, padding: 24, maxHeight: '80vh', overflowY: 'auto' as const }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                <Tag size={16} weight="fill" color="var(--accent)" aria-hidden="true" /> Neues Thema
              </span>
              <button className="btn-icon" aria-label="Schließen" onClick={() => setTopicModal(false)}>✕</button>
            </div>

            {topicError && (
              <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 8, fontSize: 13, color: 'var(--error)', marginBottom: 16 }}>
                {topicError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name</label>
              <input
                autoFocus
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const }}
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
                placeholder='z.B. "KI", "Marketing", "Wettbewerb"'
                maxLength={100}
              />
            </div>

            {sources.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Quellen zuweisen</label>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                  {sources.map((src) => (
                    <label key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: topicSourceSel.includes(src.id) ? 'var(--accent-light)' : undefined }}>
                      <input
                        type="checkbox"
                        checked={topicSourceSel.includes(src.id)}
                        onChange={(e) => setTopicSourceSel((prev) =>
                          e.target.checked ? [...prev, src.id] : prev.filter((id) => id !== src.id)
                        )}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{src.name}</span>
                      <span style={{ fontSize: 11, color: '#fff', background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)', padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>
                        {src.type.toUpperCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setTopicModal(false)}>Abbrechen</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTopic}
                disabled={savingTopic || !newTopicName.trim()}
                aria-busy={savingTopic}
              >
                {savingTopic ? 'Wird angelegt…' : 'Thema anlegen'}
              </button>
            </div>
          </div>
        </div>
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
