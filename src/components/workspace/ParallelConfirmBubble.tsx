'use client'

import React from 'react'
import { Lightbulb } from '@phosphor-icons/react'
import ParrotIcon from '@/components/ParrotIcon'
import type { ParallelIntent } from '@/lib/chat/detect-parallel-intent'

interface ParallelConfirmBubbleProps {
  intent: ParallelIntent
  loading: boolean
  onConfirm: () => void
  onDeny: () => void
}

export default function ParallelConfirmBubble({ intent, loading, onConfirm, onDeny }: ParallelConfirmBubbleProps) {
  return (
    <div className="cmsg cmsg--assistant">
      <div className="cmsg-avatar-toro" aria-hidden="true">
        <ParrotIcon size={22} />
      </div>
      <div className="cmsg-bubble-wrap">
        <div
          className="cmsg-bubble cmsg-bubble--assistant"
          style={{ background: 'var(--accent-light)', border: '1px solid rgba(45,122,80,0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Lightbulb size={15} weight="fill" color="var(--accent)" aria-hidden="true" />
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)' }}>Parallele Tabs</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Ich erkenne <strong>{intent.count} verschiedene Aspekte</strong>:{' '}
            {intent.labels.join(', ')}. Soll ich diese in separaten Tabs öffnen, damit du sie parallel bearbeiten kannst?
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Erstelle Tabs…' : `Ja, in ${intent.count} Tabs`}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onDeny}
              disabled={loading}
            >
              Nein, alles zusammen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
