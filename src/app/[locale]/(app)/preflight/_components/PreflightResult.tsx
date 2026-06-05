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
import type { PreflightResult, Gap } from '@/lib/preflight/types'
import { AppSection } from '@/components/app-ui/AppSection'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  result: PreflightResult
}

type StartpaketTab = 'decision-log' | 'claude-md' | 'migration' | 'env-example'

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

// ─── Reifegrad-Signal (Summary bar) ──────────────────────────────────────────

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
      {/* Blocker-Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasBlockers ? (
          <Warning size={18} weight="fill" color="var(--error)" aria-hidden="true" />
        ) : (
          <CheckCircle size={18} weight="fill" color="var(--teal)" aria-hidden="true" />
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: hasBlockers ? 'var(--error)' : 'var(--teal)' }}>
          {hasBlockers
            ? `${red.length} offen — zuerst entscheiden`
            : 'Keine Blocker'}
        </span>
      </div>

      <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />

      {/* Entschieden */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle size={14} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
          {decidedCount} entschieden
        </span>
      </div>

      {/* Geparkt */}
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

      {/* N/A */}
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

// ─── Gap Card ─────────────────────────────────────────────────────────────────

function GapCard({ gap }: { gap: Gap }) {
  const isRed = gap.kosten === 'red'

  return (
    <div
      style={{
        padding: '14px 16px',
        borderLeft: `3px solid ${isRed ? 'var(--error)' : 'var(--status-risky)'}`,
        background: 'var(--bg-surface)',
        border: `1px solid var(--border)`,
        borderLeftWidth: 3,
        borderRadius: '0 6px 6px 0',
        marginBottom: 10,
      }}
    >
      {/* Domain + Frage */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {gap.domain}
          </span>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {gap.frage}
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            background: isRed ? 'rgba(168,48,30,0.10)' : 'rgba(229,160,0,0.10)',
            color: isRed ? 'var(--error)' : 'var(--status-risky)',
          }}
        >
          {isRed ? 'Blocker' : 'Optional'}
        </span>
      </div>

      {/* Warum */}
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
        {gap.warum}
      </p>

      {/* Default */}
      {gap.default && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 1 }}>
            Standard:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', lineHeight: 1.5 }}>
            {gap.default}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Gaps Section ─────────────────────────────────────────────────────────────

function GapsSection({ gaps }: { gaps: PreflightResult['gaps'] }) {
  const { red, yellow } = gaps

  if (red.length === 0 && yellow.length === 0) {
    return (
      <AppSection header="LÜCKEN">
        <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>
          Keine offenen Lücken — alle Entscheidungen getroffen.
        </div>
      </AppSection>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {red.length > 0 && (
        <AppSection
          header={`ZUERST ENTSCHEIDEN · ${red.length}`}
          headerRight="Blocker"
          style={{ marginBottom: 12 }}
        >
          <div style={{ padding: '12px 16px' }}>
            {red.map(gap => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </AppSection>
      )}

      {yellow.length > 0 && (
        <AppSection
          header={`KANN SPÄTER · ${yellow.length}`}
          headerRight="Geparkt"
        >
          <div style={{ padding: '12px 16px' }}>
            {yellow.map(gap => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </AppSection>
      )}
    </div>
  )
}

// ─── Code Block with Copy + Download ─────────────────────────────────────────

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

const TAB_CONFIG: Array<{ id: StartpaketTab; label: string; icon: React.ReactNode; filename: string; language: string }> = [
  { id: 'decision-log', label: 'Decision Log',    icon: <Notepad size={12} weight="bold" aria-hidden="true" />,   filename: 'decision-log.md',    language: 'markdown' },
  { id: 'claude-md',   label: 'CLAUDE.md',        icon: <FileText size={12} weight="bold" aria-hidden="true" />,  filename: 'CLAUDE.md',          language: 'markdown' },
  { id: 'migration',   label: 'Migration',        icon: <Database size={12} weight="bold" aria-hidden="true" />,  filename: 'migration.sql',      language: 'sql'      },
  { id: 'env-example', label: '.env.example',     icon: <Key size={12} weight="bold" aria-hidden="true" />,       filename: '.env.example',       language: 'text'     },
]

function StartpaketSection({ startpaket }: { startpaket: PreflightResult['startpaket'] }) {
  const [activeTab, setActiveTab] = useState<StartpaketTab>('decision-log')

  const getContent = (tab: StartpaketTab): string | null => {
    switch (tab) {
      case 'decision-log': return startpaket.decisionLog
      case 'claude-md':   return startpaket.claudeMd
      case 'migration':   return startpaket.migrationDraft?.sql ?? null
      case 'env-example': return startpaket.envExample
    }
  }

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab)!
  const content = getContent(activeTab)
  const migration = startpaket.migrationDraft

  return (
    <div>
      {/* Tab bar */}
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

      {/* Tab content */}
      <div
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          borderTop: 'none',
        }}
      >
        {/* Migration warnings */}
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

        {/* No migration case */}
        {activeTab === 'migration' && !migration && (
          <div style={{ padding: '24px 16px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Kein Schema erkannt — keine Migration generiert.
          </div>
        )}

        {/* Code block */}
        {content !== null && (
          <CodePanel
            content={content}
            filename={activeConfig.filename}
            language={activeConfig.language}
          />
        )}
        {content === null && ['decision-log', 'claude-md', 'env-example'].includes(activeTab) && (
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
  const { gaps, startpaket } = result

  return (
    <div style={{ marginTop: 32 }}>
      {/* Reifegrad-Signal */}
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
