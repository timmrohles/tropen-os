'use client'

import { useState } from 'react'
import { Code } from '@phosphor-icons/react'
import type { GeneratedFix, FileDiff } from '@/lib/fix-engine/types'
import type { DiffHunk } from '@/lib/fix-engine/types'

export const RISK_CONFIG = {
  safe:     { label: 'Sicher',   bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',         color: 'var(--accent)' },
  moderate: { label: 'Moderat',  bg: 'color-mix(in srgb, var(--text-secondary) 15%, transparent)', color: 'var(--text-secondary)' },
  critical: { label: 'Kritisch', bg: 'color-mix(in srgb, var(--error) 12%, transparent)',           color: 'var(--error)' },
}

export const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'var(--accent)',
  medium: 'var(--text-secondary)',
  low:    'var(--error)',
}

export const CONFIDENCE_LABEL: Record<string, string> = {
  high:   'Hoch',
  medium: 'Mittel',
  low:    'Gering',
}

const FALSE_POSITIVE_KEYWORDS = ['incorrect', 'not empty', 'properly handles', 'false positive', 'already', 'does exist', 'is present', 'no issue']

export function isFalsePositive(fix: GeneratedFix): boolean {
  if (fix.diffs.length > 0) return false
  if (fix.confidence !== 'high') return false
  const lower = fix.explanation.toLowerCase()
  return FALSE_POSITIVE_KEYWORDS.some((kw) => lower.includes(kw))
}

export function AffectedFilesList({ files }: { files: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const preview = files.slice(0, 3)
  const rest = files.length - 3

  return (
    <div style={{
      marginBottom: 10,
      padding: '8px 12px',
      borderRadius: 6,
      background: 'color-mix(in srgb, var(--text-secondary) 8%, transparent)',
      border: '1px solid var(--border)',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: expanded || rest <= 0 ? 6 : 0 }}>
        <Code size={13} weight="bold" color="var(--text-secondary)" aria-hidden="true" />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          {files.length} betroffene Dateien
        </span>
        {rest > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? 'Weniger anzeigen' : `+${rest} weitere`}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(expanded ? files : preview).map((fp) => (
          <code key={fp} style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block' }}>
            {fp}
          </code>
        ))}
      </div>
    </div>
  )
}

export function DiffHunkView({ hunk }: { hunk: DiffHunk }) {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5 }}>
      <div style={{
        padding: '2px 8px',
        background: 'color-mix(in srgb, var(--text-tertiary) 15%, transparent)',
        color: 'var(--text-tertiary)',
        fontSize: 11,
      }}>
        @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@
      </div>
      {hunk.lines.map((line, i) => {
        const type = line[0]
        const content = line.slice(1)
        const bg = type === '+' ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
          : type === '-' ? 'color-mix(in srgb, var(--error) 12%, transparent)'
          : 'transparent'
        const color = type === '+' ? 'var(--accent)'
          : type === '-' ? 'var(--error)'
          : 'var(--text-secondary)'
        return (
          <div key={i} style={{ display: 'flex', background: bg }}>
            <span style={{
              width: 20, flexShrink: 0, textAlign: 'center',
              color, fontWeight: type !== ' ' ? 700 : 400,
            }}>
              {type === '+' ? '+' : type === '-' ? '-' : ' '}
            </span>
            <span style={{ color: 'var(--text-primary)', whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {content}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function FileDiffView({ diff }: { diff: FileDiff }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 8,
    }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '8px 12px',
          background: 'color-mix(in srgb, var(--text-secondary) 6%, transparent)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Code size={13} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
        <code style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{diff.filePath}</code>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {diff.hunks.length} Hunk{diff.hunks.length !== 1 ? 's' : ''}
        </span>
      </button>
      {expanded && (
        <div style={{ overflow: 'auto', maxHeight: 400 }}>
          {diff.hunks.map((hunk, i) => (
            <DiffHunkView key={i} hunk={hunk} />
          ))}
        </div>
      )}
    </div>
  )
}
