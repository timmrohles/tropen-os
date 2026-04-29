'use client'

import { Tag } from '@phosphor-icons/react'
import type { FeedSource } from '@/types/feeds'

const SOURCE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: 'var(--tropen-process)',
  api:   'var(--tropen-output)',
  url:   'var(--text-tertiary)',
}

interface Props {
  sources: FeedSource[]
  topicError: string
  newTopicName: string
  topicSourceSel: string[]
  savingTopic: boolean
  onNameChange: (v: string) => void
  onSourceToggle: (id: string, checked: boolean) => void
  onClose: () => void
  onSave: () => void
  t: (key: string) => string
  tc: (key: string) => string
}

export function TopicModal({
  sources, topicError, newTopicName, topicSourceSel, savingTopic,
  onNameChange, onSourceToggle, onClose, onSave, t, tc,
}: Props) {
  return (
    <div
      className="modal-overlay" style={{ zIndex: 100, padding: 16 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('newTopicTitle')}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 480, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            <Tag size={16} weight="fill" color="var(--accent)" aria-hidden="true" /> {t('newTopicTitle')}
          </span>
          <button className="btn-icon" aria-label={tc('close')} onClick={onClose}>✕</button>
        </div>

        {topicError && (
          <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 8, fontSize: 13, color: 'var(--error)', marginBottom: 16 }}>
            {topicError}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t('topicNameLabel')}</label>
          <input
            autoFocus
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            value={newTopicName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave()}
            placeholder={t('topicNamePlaceholder')}
            maxLength={100}
          />
        </div>

        {sources.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('topicSourcesLabel')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sources.map((src) => (
                <label key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: topicSourceSel.includes(src.id) ? 'var(--accent-light)' : undefined }}>
                  <input
                    type="checkbox"
                    checked={topicSourceSel.includes(src.id)}
                    onChange={(e) => onSourceToggle(src.id, e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{src.name}</span>
                  <span style={{ fontSize: 11, color: '#fff', background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)', padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>
                    {src.type.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>{tc('cancel')}</button>
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={savingTopic || !newTopicName.trim()}
            aria-busy={savingTopic}
          >
            {savingTopic ? t('topicCreating') : t('topicCreate')}
          </button>
        </div>
      </div>
    </div>
  )
}
