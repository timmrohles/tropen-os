'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Plus, X } from '@phosphor-icons/react'
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

interface PerspectivesBarProps {
  conversationId: string
  onRefreshMessages: () => void
  onClose: () => void
}

export default function PerspectivesBar({ conversationId, onRefreshMessages, onClose }: PerspectivesBarProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch('/api/perspectives/avatars')
      if (!res.ok) return
      const data = await res.json() as { avatars: Avatar[] }
      const sorted = (data.avatars ?? []).sort((a, b) => a.user_sort_order - b.user_sort_order)
      setAvatars(sorted)
      setSelectedIds(new Set(sorted.filter(a => a.is_pinned).map(a => a.id)))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAvatars() }, [fetchAvatars])

  // Escape schließt
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

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

  const pinnedAvatars = avatars.filter(a => a.is_pinned)
  const displayedAvatars = showAll ? avatars : pinnedAvatars
  const hiddenCount = avatars.length - pinnedAvatars.length

  if (loading || avatars.length === 0) return null

  return (
    <>
      <div className="persp-bar" role="toolbar" aria-label="Perspectives auswählen">
        <Eye size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />

        <div className="persp-bar-avatars">
          {displayedAvatars.map(avatar => {
            const active = selectedIds.has(avatar.id)
            return (
              <button
                key={avatar.id}
                className={`persp-bar-chip${active ? ' persp-bar-chip--active' : ''}`}
                onClick={() => toggleAvatar(avatar.id)}
                aria-pressed={active}
                aria-label={`${avatar.name} ${active ? 'aktiv' : 'inaktiv'}`}
                title={avatar.name}
              >
                <span aria-hidden="true">{avatar.emoji}</span>
                {avatar.name}
              </button>
            )
          })}

          {(hiddenCount > 0 || showAll) && (
            <button
              className="persp-bar-chip persp-bar-chip--more"
              onClick={() => setShowAll(v => !v)}
              aria-label={showAll ? 'Weniger Avatare' : `${hiddenCount} weitere Avatare anzeigen`}
              title={showAll ? 'Weniger' : `+${hiddenCount} mehr`}
            >
              {showAll ? <X size={11} weight="bold" aria-hidden="true" /> : <><Plus size={11} weight="bold" aria-hidden="true" />{hiddenCount}</>}
            </button>
          )}
        </div>

        <button
          className={`btn btn-primary btn-sm${selectedIds.size === 0 ? ' btn-disabled' : ''}`}
          onClick={handleBefragen}
          disabled={selectedIds.size === 0}
          style={{ flexShrink: 0 }}
        >
          Befragen
        </button>

        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Perspectives schließen"
          title="Schließen"
          style={{ flexShrink: 0 }}
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {sheetOpen && (
        <PerspectivesBottomSheet
          avatarIds={[...selectedIds]}
          avatars={avatars.filter(a => selectedIds.has(a.id))}
          conversationId={conversationId}
          onClose={() => { setSheetOpen(false); onClose() }}
          onRefreshMessages={onRefreshMessages}
        />
      )}
    </>
  )
}
