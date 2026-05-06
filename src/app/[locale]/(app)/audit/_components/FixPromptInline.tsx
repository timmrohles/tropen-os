'use client'

import React, { useState } from 'react'

// ── FixPromptInline ────────────────────────────────────────────────────────────

export function FixPromptInline({ ruleId, message, severity, filePath, autoLoad, onHide, onFixed }: {
  ruleId: string; message: string; severity: string; filePath: string | null; autoLoad?: boolean; onHide?: () => void; onFixed?: () => void
}) {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  React.useEffect(() => {
    if (autoLoad) void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad])

  async function load() {
    if (prompt || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/audit/fix-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, message, severity, filePath }),
      })
      const data = await res.json() as { prompt?: string }
      setPrompt(data.prompt ?? null)
    } finally { setLoading(false) }
  }

  async function copy() {
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!prompt && !loading) {
    return (
      <button onClick={load} style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
        Fix-Prompt anzeigen
      </button>
    )
  }
  if (loading) return <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Lädt…</span>

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--active-bg)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ color: '#e8e6e1', padding: '10px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 200, overflow: 'auto' }}>
        {prompt}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={copy} style={{ fontSize: 11, fontFamily: 'inherit', color: '#ffffff', background: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['Verbergen', 'Erledigt'] as const).map(label => {
            if (label === 'Erledigt' && !onFixed) return null
            return (
              <button
                key={label}
                type="button"
                onClick={label === 'Verbergen' ? () => { setPrompt(null); onHide?.() } : onFixed}
                style={{ fontSize: 11, fontFamily: 'inherit', fontWeight: 'normal', color: '#ffffff', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '3px 10px', lineHeight: 1 }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
