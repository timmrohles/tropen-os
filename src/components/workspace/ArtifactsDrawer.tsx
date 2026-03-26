'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { X, Code, Table, FileText, ListBullets, DownloadSimple, Atom } from '@phosphor-icons/react'
import Link from 'next/link'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface Artifact {
  id: string
  name: string
  type: 'code' | 'table' | 'document' | 'list' | 'react' | 'data' | 'image' | 'other'
  language: string | null
  content: string
  created_at: string
  message_id: string | null
}

interface ArtifactsDrawerProps {
  conversationId: string
  workspaceId?: string
  open: boolean
  onClose: () => void
}

function typeIcon(type: Artifact['type']) {
  switch (type) {
    case 'react':    return <Atom size={16} weight="bold" />
    case 'code':     return <Code size={16} weight="bold" />
    case 'table':    return <Table size={16} weight="bold" />
    case 'document': return <FileText size={16} weight="bold" />
    case 'list':     return <ListBullets size={16} weight="bold" />
    default:         return <Code size={16} weight="bold" />
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
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

export default function ArtifactsDrawer({ conversationId, workspaceId, open, onClose }: ArtifactsDrawerProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(false)
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  const fetchArtifacts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/artifacts?conversationId=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setArtifacts(data)
      }
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    if (open) fetchArtifacts()
  }, [open, fetchArtifacts])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="modal-backdrop"
        style={{ zIndex: 200 }}
      />

      {/* Drawer panel */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Artefakte dieses Chats"
        style={{
          position: 'fixed',
          top: 52,
          left: 0,
          right: 0,
          zIndex: 201,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'slideDown 200ms ease-out',
          maxHeight: 'calc(100vh - 52px)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-muted)',
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>
            Artefakte dieses Chats
          </span>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px 24px 8px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
              Laden…
            </div>
          ) : artifacts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
              Noch keine Artefakte in diesem Chat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {artifacts.map((art) => (
                <div
                  key={art.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 8,
                    border: '1px solid var(--border-muted)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {typeIcon(art.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {art.name}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                      {art.type}{art.language ? ` · ${art.language}` : ''} · {formatDate(art.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadArtifact(art)}
                    title="Herunterladen"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <DownloadSimple size={16} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer link */}
        <div
          style={{
            padding: '12px 24px 16px',
            borderTop: artifacts.length > 0 ? '1px solid var(--border-muted)' : 'none',
            marginTop: artifacts.length > 0 ? 8 : 0,
          }}
        >
          <Link
            href={workspaceId ? `/workspace?ws=${workspaceId}&conv=${conversationId}` : '/workspace'}
            onClick={onClose}
            style={{
              color: 'var(--accent)',
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Alle Artefakte im Department →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes slideDown {
          from { transform: translateY(-12px); opacity: 0 }
          to   { transform: translateY(0);     opacity: 1 }
        }
      `}</style>
    </>
  )
}
