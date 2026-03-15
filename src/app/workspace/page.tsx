'use client'

import React from 'react'
import { SquaresFour, Clock } from '@phosphor-icons/react'

export default function WorkspacePage() {
  return (
    <div className="content-max">
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div className="page-header-text">
          <h1 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SquaresFour size={24} color="var(--accent)" weight="fill" />
            Workspace
          </h1>
          <p className="page-header-sub">Visuelles Karten-System für strukturiertes Arbeiten</p>
        </div>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 16, padding: '64px 0', color: 'var(--text-tertiary)',
      }}>
        <Clock size={48} weight="bold" color="var(--accent)" />
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          Kommt bald
        </p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, textAlign: 'center' }}>
          Das Workspace-Karten-System befindet sich in der Entwicklung (Phase 2).
        </p>
      </div>
    </div>
  )
}
