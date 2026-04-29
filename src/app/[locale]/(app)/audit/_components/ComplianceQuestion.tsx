'use client'
import { useState } from 'react'

interface Props {
  projectId: string
  questionKey: string
  question: string
  type: 'boolean' | 'text' | 'select'
  options?: string[]
  initialValue?: unknown
  hint?: string
}

const BTN: React.CSSProperties = {
  padding: '4px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
  border: '1px solid var(--border)', fontFamily: 'var(--font-mono)',
  background: 'transparent', color: 'var(--text-secondary)', transition: 'all 80ms',
}

export function ComplianceQuestion({ projectId, questionKey, question, type, options, initialValue, hint }: Props) {
  const [value, setValue] = useState<unknown>(initialValue ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(newValue: unknown) {
    setSaving(true)
    setValue(newValue)
    try {
      await fetch('/api/audit/compliance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, questionKey, questionValue: newValue, scope: 'detail' }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>{question}</p>
        {hint && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {type === 'boolean' && (
          <>
            <button
              onClick={() => save(true)}
              disabled={saving}
              style={{ ...BTN, ...(value === true ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}) }}
            >Ja</button>
            <button
              onClick={() => save(false)}
              disabled={saving}
              style={{ ...BTN, ...(value === false ? { background: 'var(--error)', color: '#fff', borderColor: 'var(--error)' } : {}) }}
            >Nein</button>
          </>
        )}
        {type === 'select' && options && (
          <select
            value={value as string ?? ''}
            onChange={e => save(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-mono)' }}
          >
            <option value="">Auswählen…</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {saved && <span style={{ fontSize: 11, color: 'var(--status-success)' }}>✓</span>}
      </div>
    </div>
  )
}
