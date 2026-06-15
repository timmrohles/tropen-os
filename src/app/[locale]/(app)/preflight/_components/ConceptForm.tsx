'use client'

import { useState } from 'react'
import { MagicWand, Warning } from '@phosphor-icons/react'
import type { PreflightConcept } from '@/lib/preflight/concept-types'

interface Props {
  projectId: string
  seed: string
  initial?: PreflightConcept
  onDone: (result: unknown) => void
}

interface FieldDef {
  key: 'wasFuerWen' | 'kernFunktionen' | 'nutzerDaten' | 'verkauf'
  label: string
  help: string
}

const FIELDS: FieldDef[] = [
  { key: 'wasFuerWen', label: 'Was & für wen', help: 'Was baust du, und für welche Nutzer?' },
  { key: 'kernFunktionen', label: 'Kern-Funktionen', help: 'Die 3–5 wichtigsten Dinge, die Nutzer damit tun.' },
  { key: 'nutzerDaten', label: 'Nutzer & Daten', help: 'Wer meldet sich an, welche Daten entstehen?' },
  { key: 'verkauf', label: 'Verkauf / Geschäftsmodell', help: 'Kostenlos, Shop, Abo, Marktplatz …?' },
]

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2,
}
const HELP_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6, lineHeight: 1.4,
}

export function ConceptForm({ projectId, seed, initial, onDone }: Props) {
  const [fields, setFields] = useState({
    wasFuerWen: initial?.wasFuerWen ?? '',
    kernFunktionen: initial?.kernFunktionen ?? '',
    nutzerDaten: initial?.nutzerDaten ?? '',
    verkauf: initial?.verkauf ?? '',
  })
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = (k: FieldDef['key'], v: string) => setFields(f => ({ ...f, [k]: v }))
  const allEmpty = FIELDS.every(f => fields[f.key].trim() === '')

  const handleSuggest = async () => {
    setSuggesting(true)
    setSuggestError(null)
    try {
      const res = await fetch('/api/preflight/concept/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed }),
      })
      if (!res.ok) throw new Error('suggest failed')
      const json = await res.json() as { suggestions: Record<FieldDef['key'], string> }
      const s = json.suggestions
      // nur LEERE Felder füllen — vom Nutzer Getipptes nicht überschreiben
      setFields(f => ({
        wasFuerWen: f.wasFuerWen.trim() === '' ? (s.wasFuerWen ?? '') : f.wasFuerWen,
        kernFunktionen: f.kernFunktionen.trim() === '' ? (s.kernFunktionen ?? '') : f.kernFunktionen,
        nutzerDaten: f.nutzerDaten.trim() === '' ? (s.nutzerDaten ?? '') : f.nutzerDaten,
        verkauf: f.verkauf.trim() === '' ? (s.verkauf ?? '') : f.verkauf,
      }))
    } catch {
      setSuggestError('Vorschlag konnte nicht geladen werden. Versuche es erneut.')
    } finally {
      setSuggesting(false)
    }
  }

  const handleSubmit = async () => {
    if (allEmpty || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/preflight/projects/${projectId}/concept`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'form', ...fields }),
      })
      if (!res.ok) throw new Error('submit failed')
      const json = await res.json() as { result: unknown }
      onDone(json.result)
    } catch {
      setSubmitError('Konzept konnte nicht analysiert werden. Versuche es erneut.')
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSuggest()} disabled={suggesting}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <MagicWand size={14} weight="bold" aria-hidden="true" />
          {suggesting ? 'Hole Vorschlag …' : 'KI-Vorschlag holen'}
        </button>
      </div>

      {suggestError && (
        <p role="alert" style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--error)', lineHeight: 1.5 }}>{suggestError}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {FIELDS.map(f => (
          <div key={f.key}>
            <label htmlFor={`concept-${f.key}`} style={LABEL_STYLE}>{f.label}</label>
            <span style={HELP_STYLE}>{f.help}</span>
            <textarea id={`concept-${f.key}`} className="input" value={fields[f.key]} disabled={submitting}
              onChange={e => set(f.key, e.target.value)} rows={3}
              style={{ width: '100%', resize: 'vertical', fontSize: 13, lineHeight: 1.6 }} />
          </div>
        ))}
      </div>

      {submitError && (
        <div role="alert" style={{ marginTop: 14, padding: '10px 14px', border: '1px solid var(--error)', borderRadius: 6,
          background: 'rgba(168,48,30,0.06)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Warning size={16} weight="fill" color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--error)', flex: 1 }}>{submitError}</p>
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-primary" onClick={() => void handleSubmit()} disabled={allEmpty || submitting}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
          {submitting
            ? (<><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} aria-hidden="true" />Analysiere …</>)
            : 'Konzept übernehmen & analysieren'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
