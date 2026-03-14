'use client'
// src/app/feeds/page.tsx — Newscenter
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { markItemRead, toggleItemSaved, markItemNotRelevant, archiveItem, deleteItem } from '@/actions/feeds'
import type { FeedItem, FeedSource } from '@/types/feeds'
import { BookmarkSimple, ArrowSquareOut, Check, DotsThree, ThumbsDown, Archive, Trash } from '@phosphor-icons/react'

const BADGE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: '#7C6FF7',
  api:   '#F7A44A',
  url:   '#888',
}

const s: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: 'var(--bg-base)' },
  sidebar:    { width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 0' },
  sideSection:{ padding: '0 16px 8px' },
  sideLabel:  { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 },
  sideItem:   { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)', transition: 'background 120ms' },
  sideItemActive: { background: 'var(--active-bg)', color: 'var(--active-text, #fff)' },
  stream:     { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 12 },
  topBar:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  searchInput:{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none' },
  card:       { background: 'var(--bg-surface)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)', transition: 'border-color 120ms', position: 'relative' },
  cardUnread: { borderLeft: '3px solid var(--accent)' },
  badge:      { display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 6 },
  title:      { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 },
  summary:    { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 },
  facts:      { display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 },
  fact:       { fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-base)', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--border)' },
  actions:    { display: 'flex', gap: 8, alignItems: 'center' },
  actionBtn:  { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' },
  score:      { position: 'absolute' as const, top: 10, right: 12, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' },
  empty:      { textAlign: 'center' as const, padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 },
  menu:       { position: 'absolute' as const, right: 12, top: 36, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10, minWidth: 180 },
  menuItem:   { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' },
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

  // Load sources (client-side, user's org only via RLS)
  useEffect(() => {
    supabase.from('feed_sources').select('*').eq('is_active', true).order('name')
      .then(({ data }) => {
        if (data) setSources(data.map(mapSource))
      })
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
      readTimers.current.forEach((t) => clearTimeout(t))
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

  const allTags = Array.from(new Set(
    items.flatMap((it) => it.keyFacts ?? []).filter(Boolean)
  )).slice(0, 20)

  return (
    <div style={s.page} onClick={() => setMenuOpen(null)}>
      {/* Left Sidebar */}
      <div style={s.sidebar} onClick={(e) => e.stopPropagation()}>
        <div style={s.sideSection}>
          <div style={s.sideLabel}>Quellen</div>
          <div
            role="button"
            tabIndex={0}
            style={{ ...s.sideItem, ...(selectedSource === null ? s.sideItemActive : {}) }}
            onClick={() => setSelectedSource(null)}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedSource(null)}
          >
            Alle Quellen
          </div>
          {sources.map((src) => (
            <div
              key={src.id}
              role="button"
              tabIndex={0}
              style={{ ...s.sideItem, ...(selectedSource === src.id ? s.sideItemActive : {}) }}
              onClick={() => setSelectedSource(src.id)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedSource(src.id)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: BADGE_COLOR[src.type] ?? '#888', flexShrink: 0 }} aria-hidden="true" />
              {src.name}
            </div>
          ))}
        </div>
        {allTags.length > 0 && (
          <div style={{ ...s.sideSection, marginTop: 16 }}>
            <div style={s.sideLabel}>Themen</div>
            {allTags.map((tag) => (
              <div
                key={tag}
                role="button"
                tabIndex={0}
                style={{ ...s.sideItem, fontSize: 12 }}
                onClick={() => { setSearch(tag); loadItems(0, true) }}
                onKeyDown={(e) => e.key === 'Enter' && (setSearch(tag), loadItems(0, true))}
              >
                #{tag}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Stream */}
      <div style={s.stream}>
        <div style={s.topBar}>
          <input
            style={s.searchInput}
            placeholder="Suche in Feeds..."
            value={search}
            aria-label="Feed-Suche"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' as const }}>
            {total} Artikel
          </span>
          <a href="/feeds/new" className="btn btn-primary" style={{ whiteSpace: 'nowrap' as const }}>
            + Quelle
          </a>
        </div>

        {loading && items.length === 0 && (
          <div style={s.empty} role="status" aria-live="polite">Wird geladen…</div>
        )}

        {!loading && items.length === 0 && (
          <div style={s.empty}>Keine Artikel gefunden.</div>
        )}

        {items.map((item) => {
          const src = getSource(item.sourceId)
          const isUnread = item.status === 'unread'
          return (
            <div
              key={item.id}
              data-item-id={item.id}
              ref={isUnread ? registerCard : undefined}
              style={{ ...s.card, ...(isUnread ? s.cardUnread : {}) }}
              onClick={() => setMenuOpen(null)}
            >
              {item.score && (
                <span style={s.score} aria-label={`Relevanz: ${item.score} von 10`}>{item.score}/10</span>
              )}
              {src && (
                <div style={{ ...s.badge, background: BADGE_COLOR[src.type] ?? '#888' }}>
                  {src.name}
                </div>
              )}
              <div style={s.title}>{item.title}</div>
              {item.summary && <div style={s.summary}>{item.summary}</div>}
              {item.keyFacts && item.keyFacts.length > 0 && (
                <div style={s.facts}>
                  {item.keyFacts.slice(0, 4).map((f, i) => (
                    <span key={i} style={s.fact}>• {f}</span>
                  ))}
                </div>
              )}
              <div style={s.actions}>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{ ...s.actionBtn, textDecoration: 'none' }}
                    aria-label={`Artikel öffnen: ${item.title}`}
                  >
                    <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> Quelle
                  </a>
                )}
                <button
                  style={{ ...s.actionBtn, color: item.isSaved ? 'var(--accent)' : 'var(--text-secondary)' }}
                  onClick={async (e) => {
                    e.stopPropagation()
                    await toggleItemSaved(item.id, !item.isSaved)
                    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, isSaved: !it.isSaved } : it))
                  }}
                  aria-pressed={item.isSaved}
                  aria-label={item.isSaved ? 'Aus Merkliste entfernen' : 'Zur Merkliste hinzufügen'}
                >
                  <BookmarkSimple size={13} weight={item.isSaved ? 'fill' : 'regular'} aria-hidden="true" />
                  {item.isSaved ? 'Gespeichert' : 'Merken'}
                </button>
                <button
                  style={s.actionBtn}
                  onClick={async (e) => {
                    e.stopPropagation()
                    await markItemRead(item.id)
                    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: 'read' } : it))
                  }}
                  aria-label="Als gelesen markieren"
                >
                  <Check size={13} weight="bold" aria-hidden="true" /> Abhaken
                </button>
                <button
                  style={{ ...s.actionBtn, marginLeft: 'auto' }}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === item.id ? null : item.id) }}
                  aria-label="Weitere Aktionen"
                  aria-haspopup="true"
                  aria-expanded={menuOpen === item.id}
                >
                  <DotsThree size={16} weight="bold" aria-hidden="true" />
                </button>

                {menuOpen === item.id && (
                  <div style={s.menu} role="menu" onClick={(e) => e.stopPropagation()}>
                    <div
                      role="menuitem"
                      tabIndex={0}
                      style={s.menuItem}
                      onClick={async () => { await markItemNotRelevant(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}
                      onKeyDown={(e) => e.key === 'Enter' && (markItemNotRelevant(item.id), setItems((prev) => prev.filter((it) => it.id !== item.id)), setMenuOpen(null))}
                    >
                      <ThumbsDown size={14} weight="bold" aria-hidden="true" /> Nicht passend
                    </div>
                    <div
                      role="menuitem"
                      tabIndex={0}
                      style={s.menuItem}
                      onClick={async () => { await archiveItem(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}
                      onKeyDown={(e) => e.key === 'Enter' && (archiveItem(item.id), setItems((prev) => prev.filter((it) => it.id !== item.id)), setMenuOpen(null))}
                    >
                      <Archive size={14} weight="bold" aria-hidden="true" /> Archivieren
                    </div>
                    <div
                      role="menuitem"
                      tabIndex={0}
                      style={{ ...s.menuItem, color: '#e53e3e' }}
                      onClick={async () => { await deleteItem(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}
                      onKeyDown={(e) => e.key === 'Enter' && (deleteItem(item.id), setItems((prev) => prev.filter((it) => it.id !== item.id)), setMenuOpen(null))}
                    >
                      <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
                    </div>
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
