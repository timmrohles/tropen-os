'use client'

import React from 'react'
import ArtifactRenderer from './ArtifactRenderer'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'

interface ArtifactItem {
  id: string
  type: string
  name: string
  language: string | null
  content: string
}

interface ArtifactsViewProps {
  items: ArtifactItem[]
  loading: boolean
  conversationId: string
  organizationId?: string
  onSendDirect: (text: string) => void
  onBack: () => void
}

export default function ArtifactsView({
  items,
  loading,
  conversationId,
  organizationId,
  onSendDirect,
  onBack,
}: ArtifactsViewProps) {
  return (
    <div className="carea-messages" style={{ gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Artefakte dieses Chats
        </span>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
        >
          ← Zurück zum Chat
        </button>
      </div>
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Laden…</div>
      ) : items.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine Artefakte in diesem Chat.</div>
      ) : (
        items.map(art => (
          <div key={art.id}>
            <ArtifactRenderer
              artifact={{
                segType: 'artifact',
                artifactType: art.type as ArtifactSegment['artifactType'],
                name: art.name,
                language: art.language ?? undefined,
                content: art.content,
              }}
              conversationId={conversationId}
              organizationId={organizationId}
              onSendDirect={onSendDirect}
            />
          </div>
        ))
      )}
    </div>
  )
}
