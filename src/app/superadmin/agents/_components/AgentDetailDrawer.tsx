'use client'

import { useEffect, useRef } from 'react'
import { X, ArrowSquareOut, FileText, Tag, Robot, Lightning } from '@phosphor-icons/react'
import { AgentHealthBadge, type AgentStatus } from './AgentHealthBadge'
import type { AgentTableRow } from '../agents.types'

interface Props {
  agent: AgentTableRow
  onClose: () => void
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 400, display: 'flex', justifyContent: 'flex-end',
  },
  drawer: {
    width: '520px', maxWidth: '90vw', height: '100%',
    background: 'var(--bg-surface)', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', overflowY: 'auto',
    animation: 'slideInRight 200ms ease-out',
  },
  header: {
    padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
    position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1,
  },
  title: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
  meta: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 },
  body: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  row: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: {
    fontSize: 11, padding: '2px 7px', borderRadius: 4,
    background: 'var(--bg-surface-2, rgba(0,0,0,0.06))', color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  chipAccent: {
    fontSize: 11, padding: '2px 7px', borderRadius: 4,
    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    color: 'var(--accent)', border: 'none',
  },
  statCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px',
    background: 'color-mix(in srgb, var(--text-primary) 4%, transparent)',
    borderRadius: 8, flex: 1, gap: 2,
  },
  statNum: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' },
  statLabel: { fontSize: 11, color: 'var(--text-secondary)' },
  pre: {
    fontSize: 11, lineHeight: 1.6,
    background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
    borderRadius: 6, padding: '12px 14px',
    border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: 400, overflowY: 'auto', color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono, monospace)',
  },
  divider: { height: 1, background: 'var(--border)', margin: '4px 0' },
}

export function AgentDetailDrawer({ agent, onClose }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const createdLabel = agent.createdBy === 'manual' ? 'Manuell' : 'Komitee'

  // Extract rule lines from markdown content
  const ruleLines = agent.markdownContent
    ? agent.markdownContent
        .split('\n')
        .filter((l) => /^###\s+R\d+/.test(l))
        .map((l) => l.replace(/^###\s+/, '').trim())
    : []

  return (
    <div style={s.backdrop} onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label={`Agent: ${agent.name}`}>
      <div ref={drawerRef} style={s.drawer}>
        {/* Header */}
        <div style={s.header}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Robot size={20} color="var(--text-primary)" weight="fill" aria-hidden="true" />
              <h2 style={s.title}>{agent.name}_AGENT</h2>
              <AgentHealthBadge status={agent.status as AgentStatus} lastCheckAt={agent.lastCheckAt} />
            </div>
            <p style={s.meta}>
              v{agent.version} · {createdLabel} · {agent.ruleCount} Regeln
              {agent.lastUpdated && ` · Aktualisiert ${new Date(agent.lastUpdated).toLocaleDateString('de-DE')}`}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Schließen">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={s.statCard}>
              <span style={s.statNum}>{agent.ruleCount}</span>
              <span style={s.statLabel}>Regeln</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statNum}>{agent.categoryIds.length}</span>
              <span style={s.statLabel}>Kategorien</span>
            </div>
            <div style={s.statCard}>
              <span style={{ ...s.statNum, color: agent.findingsCount > 0 ? '#dc2626' : 'var(--accent)' }}>
                {agent.findingsCount}
              </span>
              <span style={s.statLabel}>Findings</span>
            </div>
          </div>

          {/* Categories */}
          <div style={s.section}>
            <span style={s.sectionLabel}>
              <Tag size={11} aria-hidden="true" /> Audit-Kategorien
            </span>
            <div style={s.row}>
              {agent.categoryNames.map((cat) => (
                <span key={cat} style={s.chipAccent}>{cat}</span>
              ))}
            </div>
          </div>

          {/* Themes */}
          {agent.themes.length > 0 && (
            <div style={s.section}>
              <span style={s.sectionLabel}>Themen</span>
              <div style={s.row}>
                {agent.themes.map((t) => (
                  <span key={t} style={s.chip}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Rules list */}
          {ruleLines.length > 0 && (
            <div style={s.section}>
              <span style={s.sectionLabel}>
                <Lightning size={11} aria-hidden="true" /> Regelübersicht
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ruleLines.map((rule, i) => {
                  const isCritical = rule.includes('BLOCKER') || rule.includes('BLOCKED')
                  return (
                    <div key={i} style={{
                      fontSize: 12, padding: '5px 10px', borderRadius: 5,
                      background: isCritical
                        ? 'color-mix(in srgb, #dc2626 8%, transparent)'
                        : 'color-mix(in srgb, var(--text-primary) 4%, transparent)',
                      color: 'var(--text-primary)',
                      borderLeft: `3px solid ${isCritical ? '#dc2626' : 'var(--border)'}`,
                    }}>
                      {rule}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={s.divider} />

          {/* Markdown preview */}
          <div style={s.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={s.sectionLabel}>
                <FileText size={11} aria-hidden="true" /> Dokument-Vorschau
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>docs/agents/{agent.filename}</span>
            </div>
            <pre style={s.pre}>
              {agent.markdownContent
                ? agent.markdownContent.slice(0, 4000) + (agent.markdownContent.length > 4000 ? '\n\n[... abgeschnitten]' : '')
                : '— Kein Inhalt verfügbar —'}
            </pre>
          </div>

          {/* Last check info */}
          <div style={{ ...s.section, ...s.meta, marginTop: 4 }}>
            {agent.lastCheckAt
              ? `Letzter Audit-Check: ${new Date(agent.lastCheckAt).toLocaleString('de-DE')}`
              : 'Noch kein Audit-Check für diesen Agenten'}
          </div>
        </div>
      </div>
    </div>
  )
}
