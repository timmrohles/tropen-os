'use client'

import { useState, useRef, useCallback } from 'react'
import {
  CheckSquare,
  UploadSimple,
  ArrowRight,
  Warning,
  X,
} from '@phosphor-icons/react'
import type { PreflightResult as PreflightResultType, PreflightPivots } from '@/lib/preflight/types'
import { PreflightResult } from './_components/PreflightResult'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'result'; result: PreflightResultType }

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TEXT_TYPES = ['text/plain', 'text/markdown', 'application/octet-stream']
const ACCEPTED_EXTENSIONS = ['.md', '.txt']

const PLACEHOLDER = `Füge hier dein Konzept, deine README, dein PRD oder eine kurze Beschreibung ein …

Beispiele:
• Next.js SaaS mit Supabase Auth, Stripe-Zahlungen und einer KI-Chat-Funktion
• Internes Tool zur Dokumentenverarbeitung mit Datei-Upload, OCR und PDF-Export
• README oder PRD deines Projekts`

const DEFAULT_PIVOTS: PreflightPivots = {
  buildTool: 'cursor',
  businessModel: 'b2c',
  audienceRegion: 'eu',
  hosting: 'eu',
  stack: 'Next.js + Supabase',
}

// ─── File helpers ──────────────────────────────────────────────────────────────

function isAcceptedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  return (
    ACCEPTED_EXTENSIONS.some(ext => lowerName.endsWith(ext)) ||
    ACCEPTED_TEXT_TYPES.includes(file.type)
  )
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string ?? '')
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsText(file, 'utf-8')
  })
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFile: (filename: string, content: string) => void
  disabled: boolean
}

function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setFileError(null)
    if (!isAcceptedFile(file)) {
      setFileError('Direkt gelesen werden nur .md und .txt. Für .docx/.pdf bitte den Text per Copy-Paste oben einfügen — Datei-Import für weitere Formate folgt.')
      return
    }
    try {
      const text = await readFileAsText(file)
      onFile(file.name, text)
    } catch {
      setFileError('Datei konnte nicht gelesen werden.')
    }
  }, [onFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }, [disabled, handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    // reset input so same file can be re-selected
    e.target.value = ''
  }, [handleFile])

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        aria-label="Datei hochladen (.md oder .txt)"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          border: `1px dashed ${dragOver ? 'var(--teal)' : 'var(--border)'}`,
          borderRadius: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: dragOver ? 'var(--teal-light)' : 'transparent',
          color: 'var(--text-secondary)',
          fontSize: 13,
          transition: 'border-color 120ms, background 120ms',
          width: '100%',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <UploadSimple size={16} weight="bold" aria-hidden="true" />
        Datei hochladen (.md / .txt) — oder hier ablegen
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.txt,text/plain,text/markdown"
        style={{ display: 'none' }}
        onChange={handleChange}
        tabIndex={-1}
        aria-hidden="true"
      />
      {fileError && (
        <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--error)', lineHeight: 1.5 }}>
          {fileError}
        </p>
      )}
    </div>
  )
}

// ─── Intake Pivots ────────────────────────────────────────────────────────────

interface IntakePivotsProps {
  pivots: PreflightPivots
  onChange: (pivots: PreflightPivots) => void
  disabled: boolean
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--text-tertiary)',
  marginBottom: 5,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
}

function IntakePivots({ pivots, onChange, disabled }: IntakePivotsProps) {
  const set = <K extends keyof PreflightPivots>(key: K, value: PreflightPivots[K]) =>
    onChange({ ...pivots, [key]: value })

  return (
    <div>
      {/* Hint */}
      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
        Kurz bestätigen oder anpassen — das schärft die Analyse.
      </p>

      {/* Grid of 4 selects + 1 text input */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '10px 14px',
      }}>
        {/* Build Tool */}
        <div>
          <label htmlFor="pivot-build-tool" style={LABEL_STYLE}>
            Womit baust du?
          </label>
          <select
            id="pivot-build-tool"
            className="input"
            disabled={disabled}
            value={pivots.buildTool}
            onChange={e => set('buildTool', e.target.value as PreflightPivots['buildTool'])}
            style={{ width: '100%', fontSize: 13 }}
          >
            <option value="cursor">Cursor</option>
            <option value="claude-code">Claude Code</option>
            <option value="lovable">Lovable</option>
            <option value="bolt">Bolt</option>
            <option value="other">Anderes</option>
          </select>
        </div>

        {/* Business Model */}
        <div>
          <label htmlFor="pivot-business-model" style={LABEL_STYLE}>
            Wer nutzt es?
          </label>
          <select
            id="pivot-business-model"
            className="input"
            disabled={disabled}
            value={pivots.businessModel}
            onChange={e => set('businessModel', e.target.value as PreflightPivots['businessModel'])}
            style={{ width: '100%', fontSize: 13 }}
          >
            <option value="b2c">Endkunden (B2C)</option>
            <option value="b2b">Unternehmen (B2B)</option>
            <option value="internal">Intern</option>
          </select>
        </div>

        {/* Audience Region */}
        <div>
          <label htmlFor="pivot-audience-region" style={LABEL_STYLE}>
            Wo sitzen die Nutzer?
          </label>
          <select
            id="pivot-audience-region"
            className="input"
            disabled={disabled}
            value={pivots.audienceRegion}
            onChange={e => set('audienceRegion', e.target.value as PreflightPivots['audienceRegion'])}
            style={{ width: '100%', fontSize: 13 }}
          >
            <option value="eu">EU</option>
            <option value="non_eu">Außerhalb EU</option>
            <option value="global">Weltweit</option>
            <option value="unsure">Weiß nicht</option>
          </select>
        </div>

        {/* Hosting */}
        <div>
          <label htmlFor="pivot-hosting" style={LABEL_STYLE}>
            Wo gehostet?
          </label>
          <select
            id="pivot-hosting"
            className="input"
            disabled={disabled}
            value={pivots.hosting}
            onChange={e => set('hosting', e.target.value as PreflightPivots['hosting'])}
            style={{ width: '100%', fontSize: 13 }}
          >
            <option value="eu">EU</option>
            <option value="non_eu">Außerhalb EU</option>
            <option value="global">Weltweit</option>
            <option value="unsure">Weiß nicht</option>
          </select>
        </div>

        {/* Stack — spans full width on wider screens via auto-fill */}
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="pivot-stack" style={LABEL_STYLE}>
            Stack
          </label>
          <input
            id="pivot-stack"
            type="text"
            className="input"
            disabled={disabled}
            value={pivots.stack}
            onChange={e => set('stack', e.target.value)}
            placeholder="z.B. Next.js + Supabase + Stripe"
            style={{ width: '100%', fontSize: 13 }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default function PreflightPage() {
  const [input, setInput] = useState('')
  const [pivots, setPivots] = useState<PreflightPivots>(DEFAULT_PIVOTS)
  const [state, setState] = useState<PageState>({ phase: 'idle' })

  const isLoading = state.phase === 'loading'

  const handleFile = useCallback((filename: string, content: string) => {
    setInput(prev => {
      const header = `# ${filename}\n\n`
      return prev ? `${prev}\n\n---\n\n${header}${content}` : `${header}${content}`
    })
  }, [])

  const handleClearError = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  const handleClearResult = useCallback(() => {
    setState({ phase: 'idle' })
    setInput('')
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setState({ phase: 'loading' })

    try {
      const res = await fetch('/api/preflight/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed, pivots }),
      })

      const json = await res.json() as { error?: string; gaps?: unknown; startpaket?: unknown }

      if (!res.ok) {
        setState({ phase: 'error', message: json.error ?? 'Ein Fehler ist aufgetreten.' })
        return
      }

      setState({
        phase: 'result',
        result: json as unknown as PreflightResultType,
      })
    } catch {
      setState({ phase: 'error', message: 'Netzwerkfehler — bitte erneut versuchen.' })
    }
  }, [input, pivots, isLoading])

  return (
    <div className="content-max">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <CheckSquare size={30} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Pre-Flight
          </h1>
          <p className="page-header-sub">
            Starte jedes Projekt auf einer sicheren Grundlage — Lückenanalyse, Entscheidungs-Log und Startpaket in einem Schritt.
          </p>
        </div>
        {state.phase === 'result' && (
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClearResult}
            >
              <X size={14} weight="bold" aria-hidden="true" />
              Neu starten
            </button>
          </div>
        )}
      </div>

      {/* Input form — hidden once we have a result */}
      {state.phase !== 'result' && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="card">
            <div className="card-body" style={{ padding: '20px 20px 16px' }}>

              {/* ── Intake Pivots ─────────────────────────────────────── */}
              <div style={{
                marginBottom: 20,
                paddingBottom: 18,
                borderBottom: '1px solid var(--border)',
              }}>
                <IntakePivots pivots={pivots} onChange={setPivots} disabled={isLoading} />
              </div>

              {/* ── Project description ───────────────────────────────── */}
              <label
                htmlFor="preflight-input"
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}
              >
                Projekt-Beschreibung, README oder PRD einfügen
              </label>
              <textarea
                id="preflight-input"
                className="input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={10}
                disabled={isLoading}
                style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }}
                aria-required="true"
                aria-describedby={state.phase === 'error' ? 'preflight-error' : undefined}
              />

              {/* File upload */}
              <div style={{ marginTop: 10 }}>
                <DropZone onFile={handleFile} disabled={isLoading} />
              </div>

              {/* Error */}
              {state.phase === 'error' && (
                <div
                  id="preflight-error"
                  role="alert"
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    border: '1px solid var(--error)',
                    borderRadius: 6,
                    background: 'rgba(168,48,30,0.06)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <Warning size={16} weight="fill" color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--error)', flex: 1 }}>
                    {state.message}
                  </p>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={handleClearError}
                    aria-label="Fehlermeldung schließen"
                    style={{ flexShrink: 0 }}
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>
              )}

              {/* Submit */}
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !input.trim()}
                  aria-disabled={isLoading || !input.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 140 }}
                >
                  {isLoading ? (
                    <>
                      <span
                        style={{
                          width: 14, height: 14, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          display: 'inline-block',
                          animation: 'spin 0.7s linear infinite',
                        }}
                        aria-hidden="true"
                      />
                      Analysiere …
                    </>
                  ) : (
                    <>
                      Analysieren
                      <ArrowRight size={14} weight="bold" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Loading state (standalone) */}
      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          style={{ marginTop: 8, fontSize: 13, color: 'var(--text-tertiary)' }}
        >
          Korsett wird analysiert — das dauert einen Moment …
        </p>
      )}

      {/* Result */}
      {state.phase === 'result' && (
        <PreflightResult result={state.result} />
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
