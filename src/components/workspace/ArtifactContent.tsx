'use client'

// Sub-components for ArtifactRenderer — split out to keep ArtifactRenderer.tsx under 300 lines.

import React from 'react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import {
  FloppyDisk, ArrowsOut, Code, FileText, Table, ListBullets, Atom, Play,
  ChatCircle, ArrowSquareOut, ProjectorScreen, CaretLeft, CaretRight,
  DownloadSimple, ChartBar, Warning, ArrowClockwise,
} from '@phosphor-icons/react'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'

const CodeBlock = dynamic(() => import('./CodeBlock'), { ssr: false })

export interface ArtifactActionEvent {
  type: string
  value: unknown
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function typeIcon(type: ArtifactSegment['artifactType']) {
  switch (type) {
    case 'react':        return <Atom size={14} weight="bold" aria-hidden="true" />
    case 'chart':        return <ChartBar size={14} weight="bold" aria-hidden="true" />
    case 'code':         return <Code size={14} weight="bold" aria-hidden="true" />
    case 'document':     return <FileText size={14} weight="bold" aria-hidden="true" />
    case 'table':        return <Table size={14} weight="bold" aria-hidden="true" />
    case 'list':         return <ListBullets size={14} weight="bold" aria-hidden="true" />
    case 'presentation': return <ProjectorScreen size={14} weight="bold" aria-hidden="true" />
    default:             return <Code size={14} weight="bold" aria-hidden="true" />
  }
}

export function typeLabel(type: ArtifactSegment['artifactType']): string {
  switch (type) {
    case 'react':        return 'React'
    case 'chart':        return 'Chart'
    case 'code':         return 'Code'
    case 'document':     return 'Dokument'
    case 'table':        return 'Tabelle'
    case 'list':         return 'Liste'
    case 'presentation': return 'Präsentation'
    default:             return 'Artefakt'
  }
}

export function codeLanguage(artifact: ArtifactSegment): string {
  if (artifact.language) return artifact.language
  if (artifact.artifactType === 'react') return 'jsx'
  if (artifact.artifactType === 'table') return 'html'
  return 'text'
}

// ─── ArtifactToolbar ─────────────────────────────────────────────────────────

export interface ToolbarProps {
  artifact: ArtifactSegment
  isReact: boolean
  isPresentation: boolean
  isChart: boolean
  previewOpen: boolean
  expanded: boolean
  iframeHtml: string | null
  canSave: boolean
  saved: boolean
  saving: boolean
  exporting: boolean
  t: ReturnType<typeof useTranslations>
  onTogglePreview: () => void
  onToggleExpand: () => void
  onSave: () => void
  onExportPptx: () => void
  onExportHtml: () => void
}

export function ArtifactToolbar({
  artifact, isReact, isPresentation, isChart,
  previewOpen, expanded, iframeHtml,
  canSave, saved, saving, exporting, t,
  onTogglePreview, onToggleExpand, onSave, onExportPptx, onExportHtml,
}: ToolbarProps) {
  const isInteractive = isReact || isPresentation || isChart
  return (
    <div className="artifact-header">
      <span className="artifact-type-icon">{typeIcon(artifact.artifactType)}</span>
      <span className="artifact-type-label">{typeLabel(artifact.artifactType)}</span>
      <span className="artifact-name">{artifact.name}</span>
      <div className="artifact-actions">
        {isInteractive && (
          <button onClick={onTogglePreview} title={previewOpen ? t('showSource') : t('openPreview')} className="artifact-action-btn">
            {previewOpen ? <Code size={13} weight="bold" /> : <Play size={13} weight="bold" />}
            <span>{previewOpen ? t('code') : t('preview')}</span>
          </button>
        )}
        {isReact && previewOpen && (
          <button
            onClick={onToggleExpand}
            title={expanded ? t('collapse') : t('expand')}
            className="artifact-action-btn artifact-action-btn--icon"
            aria-label={expanded ? t('collapse') : t('expand')}
          >
            <ArrowsOut size={13} weight="bold" />
          </button>
        )}
        {canSave && (
          <button onClick={onSave} disabled={saving} title={t('saveArtifact')} className="artifact-action-btn">
            <FloppyDisk size={13} weight="bold" />
            <span>{saving ? t('saving') : t('save')}</span>
          </button>
        )}
        {saved && <span className="artifact-saved-badge">{t('saved')}</span>}
        {isPresentation && (
          <button onClick={onExportPptx} disabled={exporting} title={t('exportPptx')} className="artifact-action-btn">
            <DownloadSimple size={13} weight="bold" />
            <span>{exporting ? t('exporting') : 'PPTX'}</span>
          </button>
        )}
        {isReact && iframeHtml && (
          <button onClick={onExportHtml} title={t('exportHtml')} className="artifact-action-btn">
            <DownloadSimple size={13} weight="bold" />
            <span>HTML</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── ChartContent ─────────────────────────────────────────────────────────────

interface ChartContentProps { chartIframeHtml: string | null; previewHeight: number; name: string }
export function ChartContent({ chartIframeHtml, previewHeight, name }: ChartContentProps) {
  return (
    <iframe
      srcDoc={chartIframeHtml ?? ''}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: previewHeight, border: 'none', display: 'block' }}
      title={name}
    />
  )
}

// ─── PresentationContent ──────────────────────────────────────────────────────

interface PresentationContentProps {
  content: string
  previewHeight: number
  name: string
  currentSlide: number
  totalSlides: number
}
export function PresentationContent({ content, previewHeight, name, currentSlide, totalSlides }: PresentationContentProps) {
  return (
    <>
      <iframe
        srcDoc={content}
        sandbox="allow-scripts allow-same-origin"
        style={{ width: '100%', height: previewHeight, border: 'none', display: 'block' }}
        title={name}
      />
      {totalSlides > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-tertiary)' }}>
          <CaretLeft size={13} weight="bold" aria-hidden="true" />
          <span>Slide {currentSlide} / {totalSlides}</span>
          <CaretRight size={13} weight="bold" aria-hidden="true" />
        </div>
      )}
    </>
  )
}

// ─── ArtifactActionChoice ────────────────────────────────────────────────────

interface ActionChoiceProps {
  lastAction: ArtifactActionEvent
  onSendDirect: (text: string) => void
  onDismiss: () => void
  t: ReturnType<typeof useTranslations>
}

export function ArtifactActionChoice({ lastAction, onSendDirect, onDismiss, t }: ActionChoiceProps) {
  const value = String(lastAction.value)
  return (
    <div className="artifact-action-choice">
      <span className="artifact-action-choice__label">
        {t('selectionLabel')} <strong>{value}</strong>
      </span>
      <button
        className="artifact-action-btn"
        onClick={() => { onSendDirect(`Lass uns "${value}" besprechen.`); onDismiss() }}
      >
        <ChatCircle size={13} weight="bold" />
        <span>{t('discussWithToro')}</span>
      </button>
      <button
        className="artifact-action-btn"
        onClick={() => { onSendDirect(`Öffne "${value}" in einem neuen Chat mit mehr Details.`); onDismiss() }}
      >
        <ArrowSquareOut size={13} weight="bold" />
        <span>{t('deepDive')}</span>
      </button>
      <button className="artifact-action-btn artifact-action-btn--ghost" onClick={onDismiss}>✕</button>
    </div>
  )
}

// ─── ReactContent ─────────────────────────────────────────────────────────────

export interface ReactContentProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  transformError: string | null
  iframeHtml: string | null
  showErrorDetails: boolean
  previewHeight: number
  name: string
  lastAction: ArtifactActionEvent | null
  onSendDirect?: (text: string) => void
  onRetry: () => void
  onToggleErrorDetails: () => void
  onDismissAction: () => void
  t: ReturnType<typeof useTranslations>
}

export function ReactContent({
  iframeRef, transformError, iframeHtml, showErrorDetails,
  previewHeight, name, lastAction, onSendDirect,
  onRetry, onToggleErrorDetails, onDismissAction, t,
}: ReactContentProps) {
  return (
    <>
      {transformError ? (
        <div className="artifact-error-card">
          <div className="artifact-error-card__header">
            <Warning size={14} weight="fill" aria-hidden="true" />
            <span>{t('loadError')}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="artifact-action-btn" onClick={onRetry}>
                <ArrowClockwise size={13} weight="bold" />
                <span>{t('retry')}</span>
              </button>
              <button className="artifact-action-btn artifact-action-btn--ghost" onClick={onToggleErrorDetails}>
                {showErrorDetails ? t('hideDetails') : t('showDetails')}
              </button>
            </div>
          </div>
          {showErrorDetails && <pre className="artifact-error-card__details">{transformError}</pre>}
        </div>
      ) : iframeHtml ? (
        <iframe
          ref={iframeRef}
          srcDoc={iframeHtml}
          sandbox="allow-scripts"
          style={{ width: '100%', height: previewHeight, border: 'none', display: 'block' }}
          title={name}
        />
      ) : (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          {t('compiling')}
        </div>
      )}
      {lastAction && onSendDirect && (
        <ArtifactActionChoice
          lastAction={lastAction}
          onSendDirect={onSendDirect}
          onDismiss={onDismissAction}
          t={t}
        />
      )}
    </>
  )
}

// ─── CodeContent ──────────────────────────────────────────────────────────────

interface CodeContentProps { artifact: ArtifactSegment }
export function CodeContent({ artifact }: CodeContentProps) {
  return (
    <div className="artifact-code">
      <CodeBlock language={codeLanguage(artifact)} customStyle={{ borderRadius: 0, margin: 0 }}>
        {artifact.content}
      </CodeBlock>
    </div>
  )
}
