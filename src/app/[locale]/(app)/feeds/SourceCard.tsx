'use client'
// src/app/[locale]/(app)/feeds/SourceCard.tsx — Individual feed source card
import {
  PauseCircle, PlayCircle, DotsThree, PencilSimple, Copy, Trash, Warning, ArrowClockwise,
} from '@phosphor-icons/react'
import type { FeedSource, FeedRun, FeedTopic } from '@/types/feeds'
import {
  estimateFeedCost, estimateArticlesPerWeek, formatCostPerWeek,
} from '@/lib/feed-cost-estimator'
import RunHistoryPanel from './_components/RunHistoryPanel'
import DistributionsPanel from './_components/DistributionsPanel'

const SOURCE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: 'var(--tropen-process)',
  api:   'var(--tropen-output)',
  url:   'var(--text-tertiary)',
}

interface SourceCardProps {
  src: FeedSource
  srcTopics: FeedTopic[]
  menuOpen: string | null
  expandedPanel: Record<string, 'runs' | 'outputs' | null>
  fetchingId: string | null
  fetchMsg: Record<string, string>
  runHistory: FeedRun[]
  loadingRuns: boolean
  isEditing: boolean
  projects: { id: string; name: string }[]
  workspaces: { id: string; name: string }[]
  onOpenEdit: (src: FeedSource) => void
  onPause: (src: FeedSource) => void
  onResume: (src: FeedSource) => void
  onCopy: (src: FeedSource) => void
  onDelete: (src: FeedSource) => void
  onFetchNow: (src: FeedSource) => void
  onMenuToggle: (id: string) => void
  onPanelToggle: (id: string, panel: 'runs' | 'outputs') => void
  onFetchRuns: (sourceId: string) => void
}

export default function SourceCard({
  src, srcTopics, menuOpen, expandedPanel, fetchingId, fetchMsg,
  runHistory, loadingRuns, isEditing, projects, workspaces,
  onOpenEdit, onPause, onResume, onCopy, onDelete, onFetchNow,
  onMenuToggle, onPanelToggle, onFetchRuns,
}: SourceCardProps) {
  const est = estimateFeedCost(estimateArticlesPerWeek(src.type), src.minScore)

  return (
    <div
      className="card"
      style={{
        padding: '16px 18px', cursor: 'pointer',
        borderLeft: src.status === 'active' ? '3px solid var(--accent)' : src.status === 'error' ? '3px solid var(--error)' : '3px solid var(--border)',
        opacity: src.status === 'active' ? 1 : 0.65,
        outline: isEditing ? '2px solid var(--accent)' : undefined,
        position: 'relative',
      }}
      onClick={() => onOpenEdit(src)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-inverse)', background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)' }}>
          {src.type.toUpperCase()}
        </span>
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon"
            title={src.status === 'active' ? 'Pausieren' : 'Aktivieren'}
            aria-label={src.status === 'active' ? 'Quelle pausieren' : 'Quelle aktivieren'}
            onClick={() => src.status === 'active' ? onPause(src) : onResume(src)}>
            {src.status === 'active'
              ? <PauseCircle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
              : <PlayCircle  size={16} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />}
          </button>
          <button className="btn-icon" aria-label="Weitere Aktionen" aria-haspopup="true"
            aria-expanded={menuOpen === src.id}
            onClick={(e) => { e.stopPropagation(); onMenuToggle(src.id) }}>
            <DotsThree size={16} weight="bold" aria-hidden="true" />
          </button>
          {menuOpen === src.id && (
            <div className="dropdown" style={{ position: 'absolute', right: 12, top: 44, zIndex: 20, minWidth: 180 }}
              role="menu" onClick={(e) => e.stopPropagation()}>
              <button role="menuitem" className="dropdown-item" onClick={() => onFetchNow(src)}
                disabled={fetchingId === src.id || src.type === 'email'}>
                <ArrowClockwise size={14} weight="bold" aria-hidden="true" />
                {fetchingId === src.id ? 'Wird gefetcht…' : 'Jetzt fetchen'}
              </button>
              <div className="dropdown-divider" />
              <button role="menuitem" className="dropdown-item" onClick={() => onOpenEdit(src)}>
                <PencilSimple size={14} weight="bold" aria-hidden="true" /> Bearbeiten
              </button>
              <button role="menuitem" className="dropdown-item" onClick={() => onCopy(src)}>
                <Copy size={14} weight="bold" aria-hidden="true" /> Duplizieren
              </button>
              <div className="dropdown-divider" />
              <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => onDelete(src)}>
                <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{src.name}</div>
      {src.url && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {src.url}
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
        ~{est.articlesPerWeek} Artikel/Woche · {formatCostPerWeek(est.weeklyEur)}/Woche
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
        <span>Min. Score: {src.minScore}</span>
        {src.lastFetchedAt && <span>Zuletzt: {new Date(src.lastFetchedAt).toLocaleDateString('de-DE')}</span>}
        {src.errorCount > 0 && (
          <span style={{ color: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Warning size={12} weight="fill" aria-hidden="true" /> {src.errorCount} Fehler
          </span>
        )}
      </div>

      {fetchingId === src.id && (
        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowClockwise size={12} weight="bold" aria-hidden="true" /> Wird gefetcht…
        </div>
      )}
      {fetchMsg[src.id] && fetchingId !== src.id && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
          {fetchMsg[src.id]}
        </div>
      )}

      {src.keywordsInclude.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {src.keywordsInclude.slice(0, 3).map((k, i) => (
            <span key={i} className="chip" style={{ fontSize: 11 }}>{k}</span>
          ))}
          {src.keywordsInclude.length > 3 && (
            <span className="chip" style={{ fontSize: 11 }}>+{src.keywordsInclude.length - 3}</span>
          )}
        </div>
      )}

      {srcTopics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {srcTopics.map((t) => (
            <span key={t.id} style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500,
              background: t.color ?? 'var(--accent)', color: 'var(--text-inverse)',
            }}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }} onClick={(e) => e.stopPropagation()}>
        <button
          className={`chip${expandedPanel[src.id] === 'runs' ? ' chip--active' : ''}`}
          onClick={() => onPanelToggle(src.id, 'runs')}
        >
          Run-Historie
        </button>
        <button
          className={`chip${expandedPanel[src.id] === 'outputs' ? ' chip--active' : ''}`}
          onClick={() => onPanelToggle(src.id, 'outputs')}
        >
          Outputs
        </button>
      </div>

      {expandedPanel[src.id] === 'runs' && (
        <div onClick={(e) => e.stopPropagation()}>
          <RunHistoryPanel
            runs={runHistory}
            loading={loadingRuns}
            onRefresh={() => onFetchRuns(src.id)}
          />
        </div>
      )}
      {expandedPanel[src.id] === 'outputs' && (
        <div onClick={(e) => e.stopPropagation()}>
          <DistributionsPanel
            sourceId={src.id}
            projects={projects}
            workspaces={workspaces}
          />
        </div>
      )}
    </div>
  )
}
