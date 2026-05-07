'use client'

import React, { useState } from 'react'

// ── FixPromptInline ────────────────────────────────────────────────────────────

export function FixPromptInline({ ruleId, message, severity, filePath, autoLoad, onHide, onFixed, onDeferred }: {
  ruleId: string; message: string; severity: string; filePath: string | null; autoLoad?: boolean; onHide?: () => void; onFixed?: () => void; onDeferred?: () => void
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
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--accent)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setPrompt(null); onHide?.() }}
          aria-label="Schließen"
          style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1, padding: 2 }}
        >✕</button>
        <div style={{ color: 'var(--code-fg)', padding: '10px 28px 10px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 200, overflow: 'auto' }}>
          {prompt}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={copy} style={{ fontSize: 11, fontFamily: 'inherit', color: '#ffffff', background: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
        {onDeferred && (
          <button type="button" onClick={onDeferred} style={{ fontSize: 11, fontFamily: 'inherit', color: '#ffffff', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '3px 10px', lineHeight: 1 }}>
            Aufschieben
          </button>
        )}
        {onFixed && (
          <button type="button" onClick={onFixed} style={{ fontSize: 11, fontFamily: 'inherit', color: '#ffffff', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '3px 10px', lineHeight: 1 }}>
            Erledigt
          </button>
        )}
      </div>
    </div>
  )
}
