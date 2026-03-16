'use client'

import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Paperclip, BookmarkSimple, MagnifyingGlass } from '@phosphor-icons/react'
import Link from 'next/link'
import ArtifactsDrawer from './ArtifactsDrawer'

interface ChatHeaderStripProps {
  conversationId: string | null
  workspaceId?: string
  onOpenBookmarks?: () => void
  onOpenSearch?: () => void
}

export interface ChatHeaderStripHandle {
  refresh: () => void
}

const ChatHeaderStrip = forwardRef<ChatHeaderStripHandle, ChatHeaderStripProps>(
  function ChatHeaderStrip({ conversationId, workspaceId, onOpenBookmarks, onOpenSearch }, ref) {
    const [artifactCount, setArtifactCount] = useState(0)
    const [bookmarkCount, setBookmarkCount] = useState(0)
    const [drawerOpen, setDrawerOpen] = useState(false)

    const fetchCounts = useCallback(async () => {
      if (!conversationId || conversationId.startsWith('temp-')) {
        setArtifactCount(0)
        setBookmarkCount(0)
        return
      }
      try {
        const [artRes, bmRes] = await Promise.all([
          fetch(`/api/artifacts?conversationId=${conversationId}`),
          fetch(`/api/bookmarks?conversationId=${conversationId}`),
        ])
        if (artRes.ok) {
          const arts = await artRes.json()
          setArtifactCount(Array.isArray(arts) ? arts.length : 0)
        }
        if (bmRes.ok) {
          const bms = await bmRes.json()
          setBookmarkCount(Array.isArray(bms) ? bms.length : 0)
        }
      } catch {
        // silently ignore
      }
    }, [conversationId])

    useImperativeHandle(ref, () => ({ refresh: fetchCounts }), [fetchCounts])

    useEffect(() => {
      setDrawerOpen(false)
      fetchCounts()
    }, [conversationId, fetchCounts])

    if (!conversationId) return null
    if (artifactCount === 0 && bookmarkCount === 0) return null

    return (
      <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 20px',
            height: 36,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          {artifactCount > 0 && (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 12,
                padding: 0,
              }}
            >
              <Paperclip size={13} weight="bold" />
              <span>{artifactCount} Artefakt{artifactCount === 1 ? '' : 'e'}</span>
            </button>
          )}

          {bookmarkCount > 0 && (
            <button
              onClick={() => onOpenBookmarks?.()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 12, padding: 0,
              }}
            >
              <BookmarkSimple size={13} weight="bold" />
              <span>{bookmarkCount} Lesezeichen</span>
            </button>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={() => onOpenSearch?.()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              padding: 4, borderRadius: 4,
            }}
            title="Nachrichten durchsuchen"
            aria-label="Nachrichten durchsuchen"
          >
            <MagnifyingGlass size={13} weight="bold" />
          </button>

          <Link
            href={workspaceId && conversationId
              ? `/workspace?ws=${workspaceId}&conv=${conversationId}`
              : '/workspace'}
            style={{
              color: 'var(--text-muted)',
              fontSize: 12,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Department →
          </Link>
        </div>

        <ArtifactsDrawer
          conversationId={conversationId}
          workspaceId={workspaceId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </>
    )
  }
)

export default ChatHeaderStrip
