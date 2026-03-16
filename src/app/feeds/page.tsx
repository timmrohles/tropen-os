'use client'
// src/app/feeds/page.tsx — Newscenter
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { markItemRead, toggleItemSaved, markItemNotRelevant, archiveItem, deleteItem } from '@/actions/feeds'
import type { FeedItem, FeedSource } from '@/types/feeds'
import {
  BookmarkSimple, ArrowSquareOut, CheckCircle, DotsThree,
  ThumbsDown, Archive, Trash, Rss, MagnifyingGlass,
} from '@phosphor-icons/react'

const SOURCE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: 'var(--tropen-process)',
  api:   'var(--tropen-output)',
  url:   'var(--text-tertiary)',
}

const PAGE_SIZE = 20

export default function FeedsPage() {
  const supabase = createClient()
  const [sources, setSources] = useState<FeedSource[]>([])
  const [items, setItems] = useState<FeedItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const readTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    supabase.from('feed_sources').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setSources(data.map(mapSource)) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadItems = useCallback(async (offset = 0, replace = true) => {
    setLoading(true)
    let q = supabase
      .from('feed_items')
      .select('*', { count: 'exact' })
      .neq('status', 'deleted')
      .order('fetched_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (selectedSource) q = q.eq('source_id', selectedSource)
    if (search.length > 2) q = q.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)

    const { data, count } = await q
    const mapped = (data ?? []).map(mapItem)
    setItems((prev) => replace ? mapped : [...prev, ...mapped])
    setTotal(count ?? 0)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, search])

  useEffect(() => { loadItems(0, true) }, [loadItems])

  // IntersectionObserver — auto-mark as read after 2s in viewport
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.itemId
        if (!id) continue
        if (entry.isIntersecting) {
          const timer = setTimeout(async () => {
            await markItemRead(id)
            setItems((prev) => prev.map((it) => it.id === id && it.status === 'unread' ? { ...it, status: 'read' } : it))
          }, 2000)
          readTimers.current.set(id, timer)
        } else {
          const timer = readTimers.current.get(id)
          if (timer) { clearTimeout(timer); readTimers.current.delete(id) }
        }
      }
    }, { threshold: 0.5 })
    return () => {
      observerRef.current?.disconnect()
      for (const [, t] of readTimers.current) clearTimeout(t)
    }
  }, [])

  const registerCard = useCallback((el: HTMLDivElement | null) => {
    if (el && observerRef.current) observerRef.current.observe(el)
  }, [])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadItems(0, true), 300)
  }

  const getSource = (id: string) => sources.find((s) => s.id === id)

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
          <a href="/feeds/new" className="btn btn-primary">+ Quelle</a>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative' as const, flex: 1, minWidth: 200 }}>
          <MagnifyingGlass
            size={14}
            weight="bold"
            color="var(--text-tertiary)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' as const }}
            aria-hidden="true"
          />
          <input
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const }}
            placeholder="Feeds durchsuchen…"
            value={search}
            aria-label="Feed-Suche"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          <button
            className={`chip${selectedSource === null ? ' chip--active' : ''}`}
            onClick={() => setSelectedSource(null)}
          >
            Alle {total > 0 && <span className="badge" style={{ marginLeft: 4 }}>{total}</span>}
          </button>
          {sources.map((src) => (
            <button
              key={src.id}
              className={`chip${selectedSource === src.id ? ' chip--active' : ''}`}
              onClick={() => setSelectedSource(src.id)}
            >
              {src.name}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' as const, marginLeft: 'auto' }}>
          {total} Artikel
        </span>
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
              Keine Artikel gefunden.
            </div>
          )}

          {items.map((item) => {
            const src = getSource(item.sourceId)
            const isUnread = item.status === 'unread'
            return (
              <div
                key={item.id}
                data-item-id={item.id}
                ref={isUnread ? registerCard : undefined}
                className="card"
                style={{ padding: '14px 16px', borderLeft: isUnread ? '3px solid var(--accent)' : undefined, position: 'relative' as const }}
                onClick={() => setMenuOpen(null)}
              >
                {item.score && (
                  <span
                    style={{ position: 'absolute' as const, top: 10, right: 12, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}
                    aria-label={`Relevanz: ${item.score} von 10`}
                  >
                    {item.score}/10
                  </span>
                )}
                {src && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-inverse)', background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)', marginBottom: 6 }}>
                    {src.name}
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
                  {item.title}
                </div>
                {item.summary && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                    {item.summary}
                  </div>
                )}
                {item.keyFacts && item.keyFacts.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 }}>
                    {item.keyFacts.slice(0, 4).map((f, i) => (
                      <span key={i} className="chip" style={{ fontSize: 12 }}>• {f}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-ghost btn-sm"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      aria-label={`Artikel öffnen: ${item.title}`}
                    >
                      <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> Quelle
                    </a>
                  )}
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
                      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: 'read' } : it))
                    }}
                    aria-label="Als gelesen markieren"
                  >
                    <CheckCircle size={13} weight="bold" aria-hidden="true" /> Abhaken
                  </button>
                  <button
                    className="btn-icon"
                    style={{ marginLeft: 'auto' }}
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === item.id ? null : item.id) }}
                    aria-label="Weitere Aktionen"
                    aria-haspopup="true"
                    aria-expanded={menuOpen === item.id}
                  >
                    <DotsThree size={16} weight="bold" aria-hidden="true" />
                  </button>

                  {menuOpen === item.id && (
                    <div
                      className="dropdown"
                      style={{ position: 'absolute' as const, right: 12, top: 44, zIndex: 10, minWidth: 180 }}
                      role="menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        role="menuitem"
                        className="dropdown-item"
                        onClick={async () => { await markItemNotRelevant(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}
                      >
                        <ThumbsDown size={14} weight="bold" aria-hidden="true" /> Nicht passend
                      </button>
                      <button
                        role="menuitem"
                        className="dropdown-item"
                        onClick={async () => { await archiveItem(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}
                      >
                        <Archive size={14} weight="bold" aria-hidden="true" /> Archivieren
                      </button>
                      <div className="dropdown-divider" />
                      <button
                        role="menuitem"
                        className="dropdown-item dropdown-item--danger"
                        onClick={async () => { await deleteItem(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}
                      >
                        <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {items.length < total && (
            <button
              className="btn btn-ghost"
              style={{ alignSelf: 'center', marginTop: 8 }}
              onClick={() => loadItems(items.length, false)}
            >
              Mehr laden ({total - items.length} weitere)
            </button>
          )}
      </div>
    </div>
  )
}

// Client-side mappers (snake_case Supabase → camelCase interface)
function mapSource(r: Record<string, unknown>): FeedSource {
  return {
    id: r.id as string, organizationId: r.organization_id as string,
    userId: (r.user_id as string) ?? null, name: r.name as string,
    type: r.type as FeedSource['type'], url: (r.url as string) ?? null,
    config: (r.config as Record<string, unknown>) ?? {},
    keywordsInclude: (r.keywords_include as string[]) ?? [],
    keywordsExclude: (r.keywords_exclude as string[]) ?? [],
    domainsAllow: (r.domains_allow as string[]) ?? [],
    minScore: r.min_score as number, schemaId: (r.schema_id as string) ?? null,
    isActive: r.is_active as boolean, lastFetchedAt: (r.last_fetched_at as string) ?? null,
    errorCount: r.error_count as number, lastError: (r.last_error as string) ?? null,
    createdAt: r.created_at as string, updatedAt: r.updated_at as string,
  }
}

function mapItem(r: Record<string, unknown>): FeedItem {
  return {
    id: r.id as string, sourceId: r.source_id as string, organizationId: r.organization_id as string,
    title: r.title as string, content: (r.content as string) ?? null,
    summary: (r.summary as string) ?? null, keyFacts: (r.key_facts as string[]) ?? null,
    url: (r.url as string) ?? null, author: (r.author as string) ?? null,
    publishedAt: (r.published_at as string) ?? null, fetchedAt: r.fetched_at as string,
    stage: r.stage as 1 | 2 | 3, score: (r.score as number) ?? null,
    scoreReason: (r.score_reason as string) ?? null, status: r.status as FeedItem['status'],
    isSaved: r.is_saved as boolean, contentHash: (r.content_hash as string) ?? null,
    expiresAt: (r.expires_at as string) ?? null, archivedSummary: (r.archived_summary as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {}, createdAt: r.created_at as string,
  }
}
