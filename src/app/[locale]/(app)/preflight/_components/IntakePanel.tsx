'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadSimple, ArrowRight, Warning, X, Info } from '@phosphor-icons/react'
import type { PreflightPivots } from '@/lib/preflight/types'

const ACCEPTED_EXTENSIONS = ['.md', '.txt']
const ACCEPTED_TEXT_TYPES = ['text/plain', 'text/markdown', 'application/octet-stream']

const PLACEHOLDER = `Füge hier dein Konzept, deine README, dein PRD oder eine kurze Beschreibung ein …

Beispiele:
• Next.js SaaS mit Supabase Auth, Stripe-Zahlungen und einer KI-Chat-Funktion
• Internes Tool zur Dokumentenverarbeitung mit Datei-Upload, OCR und PDF-Export
• README oder PRD deines Projekts`

export const DEFAULT_PIVOTS: PreflightPivots = {
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu',
  stack: 'Next.js + Supabase', platform: 'web', commercialModel: 'none',
}

const STACK_OPTIONS = ['Next.js + Supabase', 'Next.js + Postgres/Prisma', 'React + Firebase', 'Astro', 'Remix', 'SvelteKit', 'Plain HTML/CSS/JS']

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)',
  marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase',
}

function isAcceptedFile(file: File): boolean {
  const n = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some(e => n.endsWith(e)) || ACCEPTED_TEXT_TYPES.includes(file.type)
}
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = e => resolve((e.target?.result as string) ?? '')
    r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    r.readAsText(file, 'utf-8')
  })
}

export interface IntakePanelProps {
  name: string
  onNameChange: (v: string) => void
  pivots: PreflightPivots
  onPivotsChange: (p: PreflightPivots) => void
  input: string
  onInputChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
  error: string | null
  onClearError: () => void
}

export function IntakePanel(props: IntakePanelProps) {
  const { name, onNameChange, pivots, onPivotsChange, input, onInputChange, onSubmit, isLoading, error, onClearError } = props
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof PreflightPivots>(k: K, v: PreflightPivots[K]) => onPivotsChange({ ...pivots, [k]: v })

  const handleFile = useCallback(async (file: File) => {
    setFileError(null)
    if (!isAcceptedFile(file)) {
      setFileError('Direkt gelesen werden nur .md und .txt. Für .docx/.pdf bitte den Text per Copy-Paste oben einfügen.')
      return
    }
    try {
      const text = await readFileAsText(file)
      const header = `# ${file.name}\n\n`
      onInputChange(input ? `${input}\n\n---\n\n${header}${text}` : `${header}${text}`)
    } catch { setFileError('Datei konnte nicht gelesen werden.') }
  }, [input, onInputChange])

  return (
    <form onSubmit={e => { e.preventDefault(); if (input.trim() && !isLoading) onSubmit() }} noValidate>
      {/* Name */}
      <label htmlFor="pf-name" style={LABEL_STYLE}>Projektname (optional)</label>
      <input id="pf-name" className="input" value={name} disabled={isLoading}
        onChange={e => onNameChange(e.target.value)} placeholder="Wird sonst aus der Analyse abgeleitet"
        style={{ width: '100%', fontSize: 13, marginBottom: 14 }} />

      {/* Pivots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px 12px', marginBottom: 14 }}>
        <div>
          <label htmlFor="pf-tool" style={LABEL_STYLE}>Womit baust du?</label>
          <select id="pf-tool" className="input" disabled={isLoading} value={pivots.buildTool}
            onChange={e => set('buildTool', e.target.value as PreflightPivots['buildTool'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="cursor">Cursor</option><option value="claude-code">Claude Code</option>
            <option value="lovable">Lovable</option><option value="bolt">Bolt</option>
            <option value="other">Anderes</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-bm" style={LABEL_STYLE}>Wer nutzt es?</label>
          <select id="pf-bm" className="input" disabled={isLoading} value={pivots.businessModel}
            onChange={e => set('businessModel', e.target.value as PreflightPivots['businessModel'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="b2c">Endkunden (B2C)</option><option value="b2b">Unternehmen (B2B)</option>
            <option value="internal">Intern</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-ar" style={LABEL_STYLE}>Wo sitzen die Nutzer?</label>
          <select id="pf-ar" className="input" disabled={isLoading} value={pivots.audienceRegion}
            onChange={e => set('audienceRegion', e.target.value as PreflightPivots['audienceRegion'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="eu">EU</option><option value="non_eu">Außerhalb EU</option>
            <option value="global">Weltweit</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-host" style={LABEL_STYLE}>Wo gehostet?</label>
          <select id="pf-host" className="input" disabled={isLoading} value={pivots.hosting}
            onChange={e => set('hosting', e.target.value as PreflightPivots['hosting'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="eu">EU</option><option value="non_eu">Außerhalb EU</option>
            <option value="global">Weltweit</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-platform" style={LABEL_STYLE}>Web oder App?</label>
          <select id="pf-platform" className="input" disabled={isLoading} value={pivots.platform}
            onChange={e => set('platform', e.target.value as PreflightPivots['platform'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="web">Web-App</option>
            <option value="native">Native App (Store)</option>
            <option value="both">Beides</option>
            <option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-commercial" style={LABEL_STYLE}>Verkauf?</label>
          <select id="pf-commercial" className="input" disabled={isLoading} value={pivots.commercialModel}
            onChange={e => set('commercialModel', e.target.value as PreflightPivots['commercialModel'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="none">Kein Verkauf</option>
            <option value="shop">Shop (Einmalkauf)</option>
            <option value="subscription">Abo</option>
            <option value="marketplace">Marktplatz</option>
            <option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pf-stack" style={LABEL_STYLE}>Stack</label>
          <select id="pf-stack" className="input" disabled={isLoading}
            value={STACK_OPTIONS.includes(pivots.stack) ? pivots.stack : (pivots.stack === '' ? '__unsure__' : '__other__')}
            onChange={e => {
              const v = e.target.value
              if (v === '__unsure__') set('stack', '')
              else if (v === '__other__') set('stack', ' ')
              else set('stack', v)
            }}
            style={{ width: '100%', fontSize: 13 }}>
            {STACK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="__other__">Anderes …</option>
            <option value="__unsure__">Weiß nicht</option>
          </select>
          {!STACK_OPTIONS.includes(pivots.stack) && pivots.stack !== '' && (
            <input type="text" className="input" disabled={isLoading} value={pivots.stack.trim()}
              onChange={e => set('stack', e.target.value)} placeholder="z.B. Vue + Laravel"
              style={{ width: '100%', fontSize: 13, marginTop: 6 }} aria-label="Eigener Stack" />
          )}
        </div>
      </div>

      {/* Konzept */}
      <div style={{ background: 'var(--surface-cool)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
          Damit die Analyse etwas taugt, sollte deine Beschreibung enthalten:
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
          <li><b>Was &amp; für wen</b> — was die App tut, für welche Nutzer (1 Satz)</li>
          <li><b>Kern-Funktionen</b> — was Nutzer konkret tun können (3–5 Stichpunkte)</li>
          <li><b>Nutzer &amp; Daten</b> — Logins/Konten? welche Daten?</li>
          <li><b>Verkauf?</b> — kostenlos, Shop oder Abo?</li>
        </ul>
        <p style={{ margin: '6px 0 0', fontSize: 11, fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
          Fehlt das meiste, ist die Analyse generisch — eine geführte Entwicklung dazu kommt bald.
        </p>
      </div>
      <label htmlFor="pf-input" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
        Projekt-Beschreibung, README oder PRD
      </label>
      <textarea id="pf-input" className="input" value={input} disabled={isLoading}
        onChange={e => onInputChange(e.target.value)} placeholder={PLACEHOLDER} rows={9}
        style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }} aria-required="true" />

      {/* Datei */}
      <button type="button" disabled={isLoading} onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!isLoading) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && !isLoading) void handleFile(f) }}
        aria-label="Datei hochladen (.md oder .txt)"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 10,
          padding: '10px 16px', border: `1px dashed ${dragOver ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 6,
          background: dragOver ? 'var(--teal-light)' : 'transparent', color: 'var(--text-secondary)', fontSize: 13,
          cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}>
        <UploadSimple size={16} weight="bold" aria-hidden="true" />
        Datei hochladen (.md / .txt) — oder hier ablegen
      </button>
      <input ref={inputRef} type="file" accept=".md,.txt,text/plain,text/markdown" style={{ display: 'none' }}
        tabIndex={-1} aria-hidden="true"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = '' }} />
      {fileError && <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--error)', lineHeight: 1.5 }}>{fileError}</p>}

      {/* Fehler */}
      {error && (
        <div role="alert" style={{ marginTop: 12, padding: '10px 14px', border: '1px solid var(--error)', borderRadius: 6,
          background: 'rgba(168,48,30,0.06)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Warning size={16} weight="fill" color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--error)', flex: 1 }}>{error}</p>
          <button type="button" className="btn-icon" onClick={onClearError} aria-label="Fehlermeldung schließen" style={{ flexShrink: 0 }}>
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Submit */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !input.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
          {isLoading
            ? (<><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} aria-hidden="true" />Analysiere …</>)
            : (<>Analysieren<ArrowRight size={14} weight="bold" aria-hidden="true" /></>)}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
