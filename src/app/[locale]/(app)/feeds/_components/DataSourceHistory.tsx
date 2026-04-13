'use client'
// src/app/feeds/_components/DataSourceHistory.tsx — history drawer (table)

import { X, Check } from '@phosphor-icons/react'
import type { FeedDataSource, FeedDataRecord } from '@/types/feeds'

interface Props {
  source: FeedDataSource
  records: FeedDataRecord[]
  loading: boolean
  onClose: () => void
}

export function DataSourceHistory({ source, records, loading, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.45)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', zIndex: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Abruf-Verlauf: ${source.name}`}
    >
      <div
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--bg-surface-solid)',
          borderLeft: '1px solid var(--border)',
          padding: 24,
          overflowY: 'auto',
          animation: 'slideInRight 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Abruf-Verlauf</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{source.name}</div>
          </div>
          <button className="btn-icon" aria-label="Schließen" onClick={onClose}>
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Wird geladen…</div>
        )}

        {!loading && records.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Noch keine Abrufe.</div>
        )}

        {!loading && records.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px 8px 0', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zeitpunkt</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px 8px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datensätze</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px 8px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '6px 10px 8px 0', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dauer</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px 8px 0', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(rec.fetchedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {rec.error ? '—' : (rec.recordCount ?? 0).toLocaleString('de-DE')}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {rec.error
                        ? <span style={{ color: 'var(--error)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={13} weight="bold" />{rec.httpStatus ?? 'Fehler'}</span>
                        : <span style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} weight="bold" />OK</span>}
                    </td>
                    <td style={{ padding: '8px 0 8px 10px', color: 'var(--text-tertiary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {rec.fetchDurationMs != null ? `${rec.fetchDurationMs}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}
