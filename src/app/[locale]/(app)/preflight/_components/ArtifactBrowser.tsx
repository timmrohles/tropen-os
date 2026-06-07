'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { File, Copy, DownloadSimple, Check } from '@phosphor-icons/react'
import { downloadTextFile } from '@/lib/download'
import type { Startpaket } from '@/lib/preflight/types'

// CodeBlock MUSS lazy geladen werden (CLAUDE.md-Regel: react-syntax-highlighter ~170kB nie eager bundeln)
const CodeBlock = dynamic(() => import('@/components/workspace/CodeBlock'), { ssr: false })

interface FileEntry { filename: string; content: string; language: string }

function deriveFiles(sp: Startpaket): FileEntry[] {
  const files: FileEntry[] = [
    { filename: sp.conventions.filename, content: sp.conventions.content, language: 'markdown' },
    { filename: 'DECISIONS.md', content: sp.decisionLog, language: 'markdown' },
    { filename: '.env.example', content: sp.envExample, language: 'bash' },
  ]
  if (sp.migrationDraft?.sql) {
    files.push({ filename: 'migration.sql', content: sp.migrationDraft.sql, language: 'sql' })
  }
  return files
}

export function ArtifactBrowser({ startpaket }: { startpaket: Startpaket }) {
  const files = useMemo(() => deriveFiles(startpaket), [startpaket])
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const active = files[selected]

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(c => (c === key ? null : c)), 1800)
    })
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', minHeight: 240, flexWrap: 'wrap' }}>
        {/* Dateiliste */}
        <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: 10, flexShrink: 0 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 6px 8px' }}>Dateien</p>
          {files.map((f, i) => (
            <button key={f.filename} type="button" onClick={() => setSelected(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                padding: '6px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
                background: i === selected ? 'var(--teal-light)' : 'transparent',
                color: i === selected ? 'var(--teal)' : 'var(--text-secondary)' }}>
              <File size={14} weight="bold" aria-hidden="true" />{f.filename}
            </button>
          ))}
        </div>

        {/* Vorschau */}
        <div style={{ flex: 1, minWidth: 280, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{active.filename}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(active.filename, active.content)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                {copied === active.filename ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                {copied === active.filename ? 'Kopiert' : 'Kopieren'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadTextFile(active.filename, active.content)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <DownloadSimple size={13} weight="bold" />Download
              </button>
            </div>
          </div>
          <CodeBlock language={active.language} customStyle={{ maxHeight: 360, overflow: 'auto', margin: 0 }}>
            {active.content || '(leer)'}
          </CodeBlock>
        </div>
      </div>
    </div>
  )
}
