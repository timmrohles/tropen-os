'use client'

import React, { useRef } from 'react'
import {
  CloudArrowUp, FilePdf, FileDoc, FileText, FileCsv,
  Trash, CheckCircle, Warning, Spinner, Books, ArrowClockwise,
} from '@phosphor-icons/react'

export type DocStatus = 'processing' | 'ready' | 'error'

export interface KnowledgeDoc {
  id: string
  title: string
  file_type: string | null
  file_size: number | null
  status: DocStatus
  chunk_count: number
  created_at: string
  error_message: string | null
}

export interface UploadProgress {
  name: string
  percent: number
}

export const ACCEPTED_TYPES = '.pdf,.docx,.txt,.md,.csv'
export const MAX_SIZE_MB = 25

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileIcon(type: string | null) {
  switch (type?.toLowerCase()) {
    case 'pdf':  return <FilePdf size={20} weight="fill" style={{ color: 'var(--error)' }} />
    case 'docx': return <FileDoc size={20} weight="fill" style={{ color: 'var(--accent)' }} />
    case 'csv':  return <FileCsv size={20} weight="fill" style={{ color: 'var(--accent)' }} />
    default:     return <FileText size={20} weight="fill" style={{ color: 'var(--text-tertiary)' }} />
  }
}

export function isStuck(doc: KnowledgeDoc): boolean {
  if (doc.status !== 'processing') return false
  return Date.now() - new Date(doc.created_at).getTime() > 10 * 60 * 1000
}

// ─── DocStatusBadge ───────────────────────────────────────────────────────────

export function DocStatusBadge({ doc, t }: { doc: KnowledgeDoc; t: (key: string, opts?: Record<string, string | number>) => string }) {
  if (doc.status === 'ready') {
    return (
      <span className="kb-badge kb-badge--ready">
        <CheckCircle size={11} weight="fill" /> {t('statusReady')}
      </span>
    )
  }
  if (doc.status === 'processing' && !isStuck(doc)) {
    return (
      <span className="kb-badge kb-badge--processing">
        <Spinner size={11} className="animate-spin" /> {t('statusProcessing')}
      </span>
    )
  }
  if (doc.status === 'processing' && isStuck(doc)) {
    return (
      <span className="kb-badge kb-badge--error" title={t('stuckTitle')}>
        <Warning size={11} weight="fill" /> {t('statusStuck')}
      </span>
    )
  }
  return (
    <span className="kb-badge kb-badge--error" title={doc.error_message ?? ''}>
      <Warning size={11} weight="fill" /> {t('statusError')}
    </span>
  )
}

// ─── DocRow ───────────────────────────────────────────────────────────────────

export function DocRow({
  doc, onRetry, onDelete, t,
}: {
  doc: KnowledgeDoc
  onRetry: (id: string) => void
  onDelete: (id: string) => void
  t: (key: string, opts?: Record<string, string | number>) => string
}) {
  const showRetry = doc.status === 'error' || isStuck(doc)
  const showError = showRetry && doc.error_message

  return (
    <div className="kb-doc-row">
      <div className="kb-doc-icon">{fileIcon(doc.file_type)}</div>
      <div className="kb-doc-info">
        <div className="kb-doc-name">{doc.title}</div>
        <div className="kb-doc-meta">
          {doc.file_size ? formatBytes(doc.file_size) : ''}
          {doc.chunk_count > 0 && ` · ${t('chunks', { count: doc.chunk_count })}`}
          {` · ${new Date(doc.created_at).toLocaleDateString('de-DE')}`}
        </div>
        {showError && (
          <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 3 }}>{doc.error_message}</div>
        )}
      </div>
      <div className="kb-doc-status">
        <DocStatusBadge doc={doc} t={t} />
      </div>
      {showRetry && (
        <button className="kb-doc-delete" onClick={() => onRetry(doc.id)} aria-label={t('retryAriaLabel')} title={t('retryAriaLabel')}>
          <ArrowClockwise size={16} weight="bold" />
        </button>
      )}
      <button className="kb-doc-delete" onClick={() => onDelete(doc.id)} aria-label={t('deleteAriaLabel')}>
        <Trash size={16} weight="fill" />
      </button>
    </div>
  )
}

// ─── DocList ──────────────────────────────────────────────────────────────────

export function DocList({
  docs, loading, onRetry, onDelete, t,
}: {
  docs: KnowledgeDoc[]
  loading: boolean
  onRetry: (id: string) => void
  onDelete: (id: string) => void
  t: (key: string, opts?: Record<string, string | number>) => string
}) {
  if (loading) {
    return (
      <div className="kb-empty">
        <Spinner size={24} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    )
  }
  if (docs.length === 0) {
    return (
      <div className="kb-empty">
        <div className="kb-empty-icon"><Books size={40} weight="fill" /></div>
        <p className="kb-empty-text">{t('emptyText')}</p>
      </div>
    )
  }
  return (
    <div className="kb-doc-list">
      {docs.map(doc => (
        <DocRow key={doc.id} doc={doc} onRetry={onRetry} onDelete={onDelete} t={t} />
      ))}
    </div>
  )
}

// ─── KnowledgeContent ─────────────────────────────────────────────────────────

interface KnowledgeContentProps {
  docs: KnowledgeDoc[]
  loading: boolean
  uploads: UploadProgress[]
  uploadError: string | null
  dragOver: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (files: FileList) => void
  onFilePick: (files: FileList | null) => void
  onRetry: (id: string) => void
  onDelete: (id: string) => void
  t: (key: string, opts?: Record<string, string | number>) => string
}

export function KnowledgeContent({
  docs, loading, uploads, uploadError, dragOver, fileInputRef,
  onDragOver, onDragLeave, onDrop, onFilePick, onRetry, onDelete, t,
}: KnowledgeContentProps) {
  return (
    <>
      <div
        className={`kb-drop-zone${dragOver ? ' kb-drop-zone--active' : ''}`}
        onDragOver={e => { e.preventDefault(); onDragOver() }}
        onDragLeave={onDragLeave}
        onDrop={e => { e.preventDefault(); onDrop(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="kb-drop-icon"><CloudArrowUp size={36} weight="fill" /></div>
        <p className="kb-drop-title">{t('dropTitle')}</p>
        <p className="kb-drop-sub">{t('dropSub', { maxMb: MAX_SIZE_MB })}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          style={{ display: 'none' }}
          onChange={e => onFilePick(e.target.files)}
        />
      </div>

      {uploads.map(u => (
        <div key={u.name} className="kb-progress-wrap">
          <div className="kb-progress-label">{u.name}</div>
          <div className="kb-progress-bar">
            <div className="kb-progress-fill" style={{ width: `${u.percent}%` }} />
          </div>
        </div>
      ))}

      {uploadError && <p className="kb-error-msg">{uploadError}</p>}

      <DocList docs={docs} loading={loading} onRetry={onRetry} onDelete={onDelete} t={t} />
    </>
  )
}
