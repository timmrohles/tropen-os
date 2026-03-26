'use client'
// src/app/feeds/_components/DataSourceCard.tsx — single data source card + action menu

import {
  PlayCircle, PauseCircle, DotsThree, ArrowClockwise, Trash, PencilSimple,
  ClockCounterClockwise, ArrowSquareOut, Warning, Lock,
} from '@phosphor-icons/react'
import type { FeedDataSource } from '@/types/feeds'
import { relativeTime, authLabel, intervalLabel } from './DataSourceHelpers'

interface Props {
  source: FeedDataSource
  fetchingId: string | null
  fetchMsg: Record<string, string>
  menuOpen: string | null
  onMenuOpen: (id: string | null) => void
  onFetch: (src: FeedDataSource) => void
  onToggleActive: (src: FeedDataSource) => void
  onDelete: (src: FeedDataSource) => void
  onOpenHistory: (src: FeedDataSource) => void
  onEdit: (src: FeedDataSource) => void
  onShowToast: (msg: string) => void
}

export function DataSourceCard({
  source: src, fetchingId, fetchMsg, menuOpen,
  onMenuOpen, onFetch, onToggleActive, onDelete, onOpenHistory, onEdit, onShowToast,
}: Props) {
  return (
    <div
      className="card"
      style={{
        padding: '16px 18px',
        borderLeft: src.isActive ? '3px solid var(--accent)' : '3px solid var(--border)',
        opacity: src.isActive ? 1 : 0.65,
        position: 'relative',
      }}
      onClick={() => onMenuOpen(null)}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', background: 'var(--accent)' }}>
            API
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {src.method}
          </span>
          {src.authType && src.authType !== 'none' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-tertiary)' }}>
              <Lock size={11} weight="fill" aria-hidden="true" />
              {authLabel(src.authType)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-icon"
            title={src.isActive ? 'Pausieren' : 'Aktivieren'}
            aria-label={src.isActive ? 'Quelle pausieren' : 'Quelle aktivieren'}
            onClick={() => onToggleActive(src)}
          >
            {src.isActive
              ? <PauseCircle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
              : <PlayCircle  size={16} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />}
          </button>
          <button
            className="btn-icon"
            aria-label="Daten jetzt abrufen"
            disabled={fetchingId === src.id}
            onClick={() => onFetch(src)}
          >
            <ArrowClockwise
              size={16} weight="bold" aria-hidden="true"
              style={{ animation: fetchingId === src.id ? 'spin 1s linear infinite' : undefined }}
            />
          </button>
          <button
            className="btn-icon"
            aria-label="Weitere Aktionen"
            aria-haspopup="true"
            aria-expanded={menuOpen === src.id}
            onClick={(e) => { e.stopPropagation(); onMenuOpen(menuOpen === src.id ? null : src.id) }}
          >
            <DotsThree size={16} weight="bold" aria-hidden="true" />
          </button>
          {menuOpen === src.id && (
            <div
              className="dropdown"
              style={{ position: 'absolute', right: 12, top: 44, zIndex: 20, minWidth: 190 }}
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button role="menuitem" className="dropdown-item" onClick={() => onOpenHistory(src)}>
                <ClockCounterClockwise size={14} weight="bold" aria-hidden="true" /> Verlauf
              </button>
              <button role="menuitem" className="dropdown-item" onClick={() => onEdit(src)}>
                <PencilSimple size={14} weight="bold" aria-hidden="true" /> Bearbeiten
              </button>
              <div className="dropdown-divider" />
              <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => onDelete(src)}>
                <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Name + URL */}
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{src.name}</div>
      {src.description && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{src.description}</div>
      )}
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
        {src.url}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, flexWrap: 'wrap' }}>
        {src.lastFetchedAt && <span>Letzter Abruf: {relativeTime(src.lastFetchedAt)}</span>}
        {src.recordCount > 0 && <span>{src.recordCount.toLocaleString('de-DE')} Datensätze</span>}
        <span>{intervalLabel(src.fetchInterval)}</span>
      </div>

      {/* Error state */}
      {src.lastError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 10px', borderRadius: 6, background: 'var(--warning-bg)', border: '1px solid var(--warning)', fontSize: 12, color: 'var(--warning)', marginBottom: 8 }}>
          <Warning size={14} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>Letzter Fetch fehlgeschlagen: {src.lastError}</span>
        </div>
      )}

      {/* Fetch in progress */}
      {fetchingId === src.id && (
        <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowClockwise size={12} weight="bold" aria-hidden="true" /> Wird abgerufen…
        </div>
      )}
      {fetchMsg[src.id] && fetchingId !== src.id && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{fetchMsg[src.id]}</div>
      )}

      {/* JSON preview from schemaPreview */}
      {src.schemaPreview && !src.lastError && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Vorschau</div>
          <pre style={{
            fontFamily: 'var(--font-mono, "DM Mono", monospace)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '8px 10px',
            margin: 0,
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: 72,
          }}>
            {JSON.stringify(src.schemaPreview, null, 2).split('\n').slice(0, 4).join('\n')}
          </pre>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onClick={(e) => { e.stopPropagation(); onShowToast('Kommt bald – wird mit Plan D/E integriert') }}
        >
          <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> In Projekt
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onClick={(e) => { e.stopPropagation(); onShowToast('Kommt bald – wird mit Plan D/E integriert') }}
        >
          <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> In Workspace
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onClick={(e) => { e.stopPropagation(); onOpenHistory(src) }}
        >
          <ClockCounterClockwise size={13} weight="bold" aria-hidden="true" /> Verlauf
        </button>
      </div>
    </div>
  )
}
