'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Atom, ChartBar, ChatCircle, Code, DownloadSimple, File, FileText, Image,
  ListBullets, PencilSimple, ShareNetwork, Table, Trash, DotsThree,
} from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'

export type ArtifactType = 'code' | 'table' | 'document' | 'list' | 'react' | 'data' | 'image' | 'other'

export interface Artifact {
  id: string
  name: string
  type: ArtifactType
  language: string | null
  content: string
  created_at: string
  conversation_id: string
  message_id: string | null
}

export const ALL_TYPES: ArtifactType[] = ['code', 'table', 'document', 'list', 'react', 'data', 'image', 'other']

export function getTypeConfig(t: (key: string) => string): Record<ArtifactType, { label: string; icon: React.ReactNode }> {
  return {
    code:     { label: t('types.code'),     icon: <Code size={14} weight="bold" /> },
    table:    { label: t('types.table'),    icon: <Table size={14} weight="bold" /> },
    document: { label: t('types.document'), icon: <FileText size={14} weight="bold" /> },
    list:     { label: t('types.list'),     icon: <ListBullets size={14} weight="bold" /> },
    react:    { label: t('types.react'),    icon: <Atom size={14} weight="bold" /> },
    data:     { label: t('types.data'),     icon: <ChartBar size={14} weight="bold" /> },
    // eslint-disable-next-line jsx-a11y/alt-text
    image:    { label: t('types.image'),    icon: <Image size={14} weight="bold" aria-hidden="true" /> },
    other:    { label: t('types.other'),    icon: <File size={14} weight="bold" /> },
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function downloadArtifact(artifact: Artifact) {
  const ext = artifact.type === 'code' && artifact.language ? `.${artifact.language}` : '.txt'
  const blob = new Blob([artifact.content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${artifact.name}${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

export type MenuLabels = {
  rename: string
  saveToWorkspace: string
  deleting: string
  delete: string
  moreOptions: string
}

export function ArtifactMenu({
  artifact, onRename, onDelete, deleting, labels,
}: {
  artifact: Artifact
  onRename: (a: Artifact) => void
  onDelete: (a: Artifact) => void
  deleting: string | null
  labels: MenuLabels
}) {
  const [open, setOpen] = useState(false)
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        <button className="btn-icon" onClick={() => setOpen(p => !p)} aria-label={labels.moreOptions} title={labels.moreOptions}>
          <DotsThree size={16} weight="bold" />
        </button>
        {open && (
          <div className="dropdown animate-dropdown" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 180, zIndex: 50 }}>
            <button className="dropdown-item" onClick={() => { setOpen(false); onRename(artifact) }}>
              <PencilSimple size={14} weight="bold" /> {labels.rename}
            </button>
            <button className="dropdown-item" onClick={() => { setOpen(false); setShowWorkspacePicker(true) }}>
              <ShareNetwork size={14} weight="bold" /> {labels.saveToWorkspace}
            </button>
            <div className="dropdown-divider" />
            <button
              className="dropdown-item dropdown-item--danger"
              onClick={() => { setOpen(false); onDelete(artifact) }}
              disabled={deleting === artifact.id}
            >
              <Trash size={14} weight="bold" />
              {deleting === artifact.id ? labels.deleting : labels.delete}
            </button>
          </div>
        )}
      </div>
      {showWorkspacePicker && (
        <WorkspacePicker
          itemType="artifact"
          itemId={artifact.id}
          itemTitle={artifact.name}
          onClose={() => setShowWorkspacePicker(false)}
        />
      )}
    </>
  )
}

export function ArtifactPreview({ art }: { art: Artifact }) {
  if (art.type === 'image') {
    return (
      <div className="artifact-card-image-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.content} alt={art.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
      </div>
    )
  }
  return (
    <div className="artifact-card-preview">
      {art.content.slice(0, 120)}{art.content.length > 120 ? '…' : ''}
    </div>
  )
}

interface ArtifactCardProps {
  art: Artifact
  cfg: { label: string; icon: React.ReactNode }
  renamingId: string | null
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement | null>
  deletingId: string | null
  menuLabels: MenuLabels
  onPreview: (a: Artifact) => void
  onStartRename: (a: Artifact) => void
  onDelete: (a: Artifact) => void
  onRenameValueChange: (v: string) => void
  onRenameCommit: (a: Artifact) => void
  onRenameClear: () => void
  t: (key: string) => string
}

export function ArtifactCard({
  art, cfg, renamingId, renameValue, renameInputRef, deletingId,
  menuLabels, onPreview, onStartRename, onDelete,
  onRenameValueChange, onRenameCommit, onRenameClear, t,
}: ArtifactCardProps) {
  const isRenaming = renamingId === art.id

  return (
    <div
      className="card artifact-card"
      onClick={() => onPreview(art)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onPreview(art)}
      aria-label={`${art.name} ${t('openChat').toLowerCase()}`}
      style={{ cursor: 'pointer' }}
    >
      <div className="artifact-card-header">
        <div className="artifact-card-type">
          {cfg.icon}
          {cfg.label}
          {art.language ? ` · ${art.language}` : ''}
        </div>
        <div className="artifact-card-actions" onClick={e => e.stopPropagation()}>
          <button className="btn-icon" onClick={() => downloadArtifact(art)} title={t('download')} aria-label={`${art.name} ${t('download').toLowerCase()}`}>
            <DownloadSimple size={14} weight="bold" />
          </button>
          <ArtifactMenu artifact={art} onRename={onStartRename} onDelete={onDelete} deleting={deletingId} labels={menuLabels} />
        </div>
      </div>

      {isRenaming ? (
        <input
          ref={renameInputRef}
          onClick={e => e.stopPropagation()}
          value={renameValue}
          onChange={e => onRenameValueChange(e.target.value)}
          onBlur={() => onRenameCommit(art)}
          onKeyDown={e => {
            if (e.key === 'Enter') onRenameCommit(art)
            if (e.key === 'Escape') onRenameClear()
          }}
          style={{
            width: '100%', background: 'var(--bg-input)',
            border: '1px solid var(--accent)', borderRadius: 6,
            padding: '4px 8px', color: 'var(--text-primary)',
            fontSize: 13, fontWeight: 600, outline: 'none',
          }}
        />
      ) : (
        <div className="artifact-card-title">{art.name}</div>
      )}

      <ArtifactPreview art={art} />

      <div className="artifact-card-footer">
        <span className="artifact-card-date">{formatDate(art.created_at)}</span>
        {art.conversation_id && (
          <a href={`/workspaces?conv=${art.conversation_id}`} className="artifact-card-chat-link" aria-label={t('openInChat')}>
            <ChatCircle size={13} weight="bold" />
            {t('openInChat')}
          </a>
        )}
      </div>
    </div>
  )
}
