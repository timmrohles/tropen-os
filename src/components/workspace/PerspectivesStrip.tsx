'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Info, Plus, X } from '@phosphor-icons/react'
import PerspectivesBottomSheet from './PerspectivesBottomSheet'

interface Avatar {
  id: string
  name: string
  emoji: string
  scope: 'system' | 'org' | 'user'
  is_pinned: boolean
  user_sort_order: number
  context_default: string
}

interface PerspectivesStripProps {
  conversationId: string
  onRefreshMessages: () => void
  onDismiss?: () => void
}

export default function PerspectivesStrip({ conversationId, onRefreshMessages, onDismiss }: PerspectivesStripProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch('/api/perspectives/avatars')
      if (!res.ok) return
      const data = await res.json() as { avatars: Avatar[] }
      const sorted = (data.avatars ?? []).sort((a, b) => a.user_sort_order - b.user_sort_order)
      setAvatars(sorted)
      // Pre-select pinned avatars
      setSelectedIds(new Set(sorted.filter(a => a.is_pinned).map(a => a.id)))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAvatars() }, [fetchAvatars])

  // Close info popover on outside click
  useEffect(() => {
    if (!infoOpen) return
    function handleClick(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [infoOpen])

  function toggleAvatar(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBefragen() {
    if (selectedIds.size === 0) return
    setSheetOpen(true)
  }

  const displayedAvatars = showAll ? avatars : avatars.filter(a => a.is_pinned)

  if (loading || avatars.length === 0) return null

  return (
    <>
      <div className="persp-strip">
        {/* Info button */}
        <div style={{ position: 'relative' }} ref={infoRef}>
          <button
            className="persp-strip-icon-btn"
            onClick={() => setInfoOpen(v => !v)}
            aria-label="Perspectives – Info"
            title="Was ist Perspectives?"
          >
            <Info size={15} weight="bold" aria-hidden="true" />
          </button>
          {infoOpen && (
            <div className="persp-info-popover">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Eye size={14} weight="fill" aria-hidden="true" />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Perspectives</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Lass mehrere KI-Perspektiven gleichzeitig auf dein Gespräch blicken.
                Wähle Avatare aus und klicke <strong>Befragen</strong> – sie antworten parallel.
              </p>
            </div>
          )}
        </div>

        {/* Avatar pills */}
        <div className="persp-strip-avatars">
          {displayedAvatars.map(avatar => {
            const active = selectedIds.has(avatar.id)
            return (
              <button
                key={avatar.id}
                className={`persp-avatar-pill${active ? ' persp-avatar-pill--active' : ''}`}
                onClick={() => toggleAvatar(avatar.id)}
                title={avatar.name}
                aria-pressed={active}
              >
                <span aria-hidden="true">{avatar.emoji}</span>
                <span className="persp-avatar-pill-name">{avatar.name}</span>
              </button>
            )
          })}
        </div>

        {/* Show more / less toggle */}
        {avatars.length > displayedAvatars.length || showAll ? (
          <button
            className="persp-strip-icon-btn"
            onClick={() => setShowAll(v => !v)}
            aria-label={showAll ? 'Weniger Avatare' : 'Alle Avatare anzeigen'}
            title={showAll ? 'Weniger' : `+${avatars.length - displayedAvatars.length} mehr`}
          >
            {showAll
              ? <X size={13} weight="bold" aria-hidden="true" />
              : <Plus size={14} weight="bold" aria-hidden="true" />
            }
          </button>
        ) : null}

        {/* Befragen button */}
        <button
          className={`persp-befragen-btn${selectedIds.size === 0 ? ' persp-befragen-btn--disabled' : ''}`}
          onClick={handleBefragen}
          disabled={selectedIds.size === 0}
        >
          <Eye size={14} weight="fill" aria-hidden="true" />
          Befragen
        </button>

        {/* Dismiss */}
        {onDismiss && (
          <button
            className="persp-strip-icon-btn"
            onClick={onDismiss}
            aria-label="Perspectives schließen"
            title="Schließen"
          >
            <X size={13} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>

      {sheetOpen && (
        <PerspectivesBottomSheet
          avatarIds={[...selectedIds]}
          avatars={avatars.filter(a => selectedIds.has(a.id))}
          conversationId={conversationId}
          onClose={() => { setSheetOpen(false); onDismiss?.() }}
          onRefreshMessages={onRefreshMessages}
        />
      )}
    </>
  )
}
