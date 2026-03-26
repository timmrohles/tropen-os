'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { X, MagnifyingGlass, ChatCircle } from '@phosphor-icons/react'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface SearchResult {
  id: string
  conversation_id: string
  conversation_title: string | null
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

interface SearchDrawerProps {
  open: boolean
  onClose: () => void
  workspaceId?: string | null
  onOpenConversation?: (conversationId: string) => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} style={{ background: 'var(--accent-light)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>{part}</mark> : part
  )
}

export default function SearchDrawer({ open, onClose, workspaceId, onOpenConversation }: SearchDrawerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: q.trim() })
      if (workspaceId) params.set('workspaceId', workspaceId)
      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, doSearch])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]) }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        className="modal-backdrop"
        style={{ zIndex: 200 }}
      />
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Suche" style={{
        position: 'fixed', top: 52, left: 'var(--current-sidebar-offset, 0px)', right: 0, zIndex: 201,
        background: '#ffffff', borderBottom: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        animation: 'slideDown 200ms ease-out',
        maxHeight: 'calc(100vh - 52px)', overflowY: 'auto',
      }}>
        {/* Search Input */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MagnifyingGlass size={18} weight="bold" color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nachrichten und Chats durchsuchen…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15 }}
          />
          <button className="btn-icon" onClick={onClose} aria-label="Schließen">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Results */}
        <div style={{ padding: '8px 24px 16px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Suche…</div>
          ) : query.trim().length < 2 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Mindestens 2 Zeichen eingeben…</div>
          ) : results.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Keine Ergebnisse für &bdquo;{query}&ldquo;</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {results.length} Treffer
              </div>
              {results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => { onOpenConversation?.(r.conversation_id); onClose() }}
                  style={{
                    padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
                    border: '1px solid var(--border-muted)', cursor: onOpenConversation ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <ChatCircle size={12} weight="bold" color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {r.conversation_title ?? 'Untitled'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                      {r.role === 'assistant' ? 'Toro' : 'Du'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {highlight(r.content, query)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { transform: translateY(-12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </>
  )
}
