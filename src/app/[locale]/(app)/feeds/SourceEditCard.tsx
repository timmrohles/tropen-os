'use client'
// src/app/[locale]/(app)/feeds/SourceEditCard.tsx — Inline edit form for a feed source
import { X } from '@phosphor-icons/react'
import type { FeedSource, FeedRun, FeedTopic } from '@/types/feeds'
import RunHistoryPanel from './_components/RunHistoryPanel'

interface SourceEditCardProps {
  editing: FeedSource
  editName: string
  editUrl: string
  editMinScore: number
  saving: boolean
  editError: string
  runHistory: FeedRun[]
  loadingRuns: boolean
  topics: FeedTopic[]
  onNameChange: (v: string) => void
  onUrlChange: (v: string) => void
  onMinScoreChange: (v: number) => void
  onSave: () => void
  onCancel: () => void
  onToggleTopic: (topicId: string, sourceId: string, add: boolean) => void
  onRefreshRuns: () => void
}

export default function SourceEditCard({
  editing, editName, editUrl, editMinScore, saving, editError,
  runHistory, loadingRuns, topics,
  onNameChange, onUrlChange, onMinScoreChange,
  onSave, onCancel, onToggleTopic, onRefreshRuns,
}: SourceEditCardProps) {
  return (
    <div className="card" style={{ padding: 24, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span className="card-header-label">Quelle bearbeiten</span>
        <button className="btn-icon" aria-label="Schließen" onClick={onCancel}><X size={14} weight="bold" /></button>
      </div>
      {editError && (
        <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, fontSize: 13, color: 'var(--error)', marginBottom: 16 }}>
          {editError}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name</label>
          <input
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            value={editName} onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        {editing.type !== 'email' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>URL</label>
            <input
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              value={editUrl} onChange={(e) => onUrlChange(e.target.value)} placeholder="https://…"
            />
          </div>
        )}
        <div style={{ gridColumn: editing.type === 'email' ? undefined : '1 / -1' }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Mindest-Score ({editMinScore})
          </label>
          <input type="range" min={1} max={10} value={editMinScore}
            onChange={(e) => onMinScoreChange(Number(e.target.value))}
            style={{ width: '100%' }} aria-label="Mindest-Score" />
          <p className="form-hint">
            Artikel werden von KI auf Relevanz bewertet (Score 1–10).{' '}
            Nur Artikel <strong>ab diesem Score</strong> werden angezeigt.{' '}
            <span className="form-hint-option">5 – großzügig</span>{' '}
            <span className="form-hint-recommended">6 – empfohlen</span>{' '}
            <span className="form-hint-option">8 – streng</span>
          </p>
        </div>
      </div>

      {topics.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
            Themen
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topics.map((t) => {
              const assigned = t.sourceIds.includes(editing.id)
              return (
                <label key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={assigned}
                    onChange={(e) => onToggleTopic(t.id, editing.id, e.target.checked)}
                  />
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                    background: assigned ? (t.color ?? 'var(--accent)') : 'var(--border)',
                    color: assigned ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  }}>
                    {t.name}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <div className="card-divider" style={{ marginBottom: 16 }} />
        <RunHistoryPanel
          runs={runHistory}
          loading={loadingRuns}
          onRefresh={onRefreshRuns}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
