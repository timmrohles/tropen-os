'use client'

import { useState, useCallback } from 'react'
import {
  Warning,
  CheckCircle,
  Clock,
  Copy,
  DownloadSimple,
  FileText,
  Database,
  Key,
  Notepad,
} from '@phosphor-icons/react'
import type { PreflightResult } from '@/lib/preflight/types'
import { GapsSection } from './GapCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  result: PreflightResult
}

type StartpaketTab = 'decision-log' | 'conventions' | 'migration' | 'env-example'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [text])

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={handleCopy}
      style={{ fontSize: 12, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
    >
      <Copy size={12} weight="bold" aria-hidden="true" />
      {copied ? 'Kopiert' : 'Kopieren'}
    </button>
  )
}

// ─── Result Summary ───────────────────────────────────────────────────────────

function ResultSummaryBox({ summary }: { summary: PreflightResult['summary'] }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        background: 'var(--surface-tint)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        marginBottom: 20,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
          padding: '2px 8px',
          background: 'var(--accent-light)',
          borderRadius: 4,
        }}
      >
        {summary.projectLabel}
      </span>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
        }}
      >
        {summary.headline}
      </p>
    </div>
  )
}

// ─── Reifegrad-Signal (counts bar) ───────────────────────────────────────────

function ReifegradSignal({ gaps }: { gaps: PreflightResult['gaps'] }) {
  const { red, yellow, decidedCount, naCount } = gaps
  const hasBlockers = red.length > 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        background: hasBlockers ? 'var(--surface-warm)' : 'var(--teal-light)',
        border: `1px solid ${hasBlockers ? 'var(--border)' : 'rgba(30,112,112,0.18)'}`,
        borderRadius: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
        rowGap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasBlockers ? (
          <Warning size={18} weight="fill" color="var(--error)" aria-hidden="true" />
        ) : (
          <CheckCircle size={18} weight="fill" color="var(--teal)" aria-hidden="true" />
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: hasBlockers ? 'var(--error)' : 'var(--teal)' }}>
          {hasBlockers ? `${red.length} offen — zuerst entscheiden` : 'Keine Blocker'}
        </span>
      </div>

      <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle size={14} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
          {decidedCount} entschieden
        </span>
      </div>

      {yellow.length > 0 && (
        <>
          <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              {yellow.length} geparkt
            </span>
          </div>
        </>
      )}

      {naCount > 0 && (
        <>
          <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {naCount} nicht relevant
          </span>
        </>
      )}
    </div>
  )
}

// ─── Code Panel ───────────────────────────────────────────────────────────────

interface CodePanelProps {
  content: string
  filename: string
  language?: string
}

function CodePanel({ content, filename, language = 'text' }: CodePanelProps) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-warm)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          {filename}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <CopyButton text={content} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadText(content, filename)}
            style={{ fontSize: 12, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <DownloadSimple size={12} weight="bold" aria-hidden="true" />
            Download
          </button>
        </div>
      </div>
      <pre
        aria-label={`${language} code: ${filename}`}
        style={{
          margin: 0,
          padding: '16px',
          fontSize: 12,
          lineHeight: 1.7,
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          color: 'var(--text-secondary)',
          background: 'var(--active-bg)',
          overflowX: 'auto',
          whiteSpace: 'pre',
          maxHeight: 480,
          overflowY: 'auto',
        }}
      >
        <code>{content}</code>
      </pre>
    </div>
  )
}

// ─── Startpaket Section ───────────────────────────────────────────────────────

function StartpaketSection({ startpaket }: { startpaket: PreflightResult['startpaket'] }) {
  const [activeTab, setActiveTab] = useState<StartpaketTab>('decision-log')

  // Conventions tab uses filename + content from the result (tool-correct: CLAUDE.md / .cursorrules / …)
  const conventionsFilename = startpaket.conventions.filename
  const conventionsContent = startpaket.conventions.content

  type TabConfig = {
    id: StartpaketTab
    label: string
    icon: React.ReactNode
    filename: string
    language: string
  }

  const TAB_CONFIG: TabConfig[] = [
    { id: 'decision-log', label: 'Decision Log',       icon: <Notepad size={12} weight="bold" aria-hidden="true" />,   filename: 'decision-log.md',   language: 'markdown' },
    { id: 'conventions',  label: conventionsFilename,  icon: <FileText size={12} weight="bold" aria-hidden="true" />,  filename: conventionsFilename, language: 'markdown' },
    { id: 'migration',    label: 'Migration',          icon: <Database size={12} weight="bold" aria-hidden="true" />,  filename: 'migration.sql',     language: 'sql'      },
    { id: 'env-example',  label: '.env.example',       icon: <Key size={12} weight="bold" aria-hidden="true" />,       filename: '.env.example',      language: 'text'     },
  ]

  const getContent = (tab: StartpaketTab): string | null => {
    switch (tab) {
      case 'decision-log': return startpaket.decisionLog
      case 'conventions':  return conventionsContent
      case 'migration':    return startpaket.migrationDraft?.sql ?? null
      case 'env-example':  return startpaket.envExample
    }
  }

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab)!
  const content = getContent(activeTab)
  const migration = startpaket.migrationDraft

  return (
    <div>
      <div className="app-tabs" role="tablist">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`app-tab${activeTab === tab.id ? ' app-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          borderTop: 'none',
        }}
      >
        {activeTab === 'migration' && migration && migration.warnings.length > 0 && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(229,160,0,0.08)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Warning size={16} weight="fill" color="var(--status-risky)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <div>
              <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Entwurf — prüfen, nicht blind anwenden
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {migration.warnings.map((w, i) => (
                  <li key={`warn-${i}`}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'migration' && !migration && (
          <div style={{ padding: '24px 16px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Kein Schema erkannt — keine Migration generiert.
          </div>
        )}

        {content !== null && (
          <CodePanel
            content={content}
            filename={activeConfig.filename}
            language={activeConfig.language}
          />
        )}
        {content === null && ['decision-log', 'conventions', 'env-example'].includes(activeTab) && (
          <div style={{ padding: '24px 16px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Kein Inhalt verfügbar.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function PreflightResult({ result }: Props) {
  const { summary, gaps, startpaket } = result

  return (
    <div style={{ marginTop: 32 }}>
      {/* Result Summary — prominent box at the very top */}
      <ResultSummaryBox summary={summary} />

      {/* Reifegrad-Signal (counts bar) */}
      <ReifegradSignal gaps={gaps} />

      {/* Lücken-Liste */}
      <GapsSection gaps={gaps} />

      {/* Startpaket */}
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
          color: 'var(--accent)', marginBottom: 16, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 28, height: 1, background: 'var(--border)', flexShrink: 0 }} />
          Startpaket
        </div>
        <StartpaketSection startpaket={startpaket} />
      </div>
    </div>
  )
}
