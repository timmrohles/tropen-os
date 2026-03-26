'use client'

import React from 'react'
import { X, Columns } from '@phosphor-icons/react'
import ArtifactRenderer from './ArtifactRenderer'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'

interface SplitArtifactPanelProps {
  artifact: ArtifactSegment
  conversationId?: string
  organizationId?: string
  onClose: () => void
  onSendDirect?: (text: string) => void
}

export default function SplitArtifactPanel({
  artifact,
  conversationId,
  organizationId,
  onClose,
  onSendDirect,
}: SplitArtifactPanelProps) {
  return (
    <div className="split-panel">
      <div className="split-panel-header">
        <Columns size={13} weight="bold" className="split-panel-icon" aria-hidden="true" />
        <span className="split-panel-title">Geteilter Bildschirm</span>
        <button
          className="split-panel-close"
          onClick={onClose}
          aria-label="Geteilter Bildschirm schließen"
          title="Schließen"
        >
          <X size={13} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <div className="split-panel-content">
        <ArtifactRenderer
          artifact={artifact}
          conversationId={conversationId}
          organizationId={organizationId}
          onSendDirect={onSendDirect}
        />
      </div>
    </div>
  )
}
