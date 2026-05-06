'use client'

import React from 'react'
import PerspectiveMessage from './PerspectiveMessage'
import type { PerspectiveMsg } from '@/hooks/usePerspectives'

interface ChatStatusBarProps {
  isSearching: boolean
  routing: { task_type: string; agent: string; model_class: string; model: string } | null
  memoryExtracting: boolean
  perspectiveMsg: PerspectiveMsg | null
}

export default function ChatStatusBar({ isSearching, routing, memoryExtracting, perspectiveMsg }: ChatStatusBarProps) {
  return (
    <>
      {isSearching && !routing && (
        <div className="carea-routing-meta carea-routing-meta--searching">
          <span className="carea-searching-dot" aria-hidden="true" />
          <span style={{ fontStyle: 'italic' }}>Suche im Web…</span>
        </div>
      )}
      {routing && (
        <div className="carea-routing-meta">
          <span>{routing.model}</span>
          <span className="carea-routing-dot">·</span>
          <span>{routing.model_class}</span>
          <span className="carea-routing-dot">·</span>
          <span>{routing.task_type}</span>
          <span className="carea-routing-dot">·</span>
          <span>🌱</span>
          {memoryExtracting && (
            <>
              <span className="carea-routing-dot">·</span>
              <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
                Gedächtnis wird gespeichert…
              </span>
            </>
          )}
        </div>
      )}
      {perspectiveMsg && (
        <PerspectiveMessage
          avatarEmoji={perspectiveMsg.avatarEmoji}
          avatarName={perspectiveMsg.avatarName}
          text={perspectiveMsg.text}
          pending={!perspectiveMsg.done}
        />
      )}
    </>
  )
}
