'use client'
// src/app/feeds/new/page.tsx
// Multi-step wizard for creating a new feed source.
import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createFeedSource, triggerFetch } from '@/actions/feeds'
import type { FeedSourceType } from '@/types/feeds'
import { Rss, Envelope, Plugs, Globe, Plus, ArrowLeft, ArrowRight } from '@phosphor-icons/react'

type Step = 1 | 2 | 3 | 4

const s: Record<string, React.CSSProperties> = {
  types:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 },
  typeCard:{ padding: '20px 16px', border: '2px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'center' as const, transition: 'border-color 150ms', background: 'var(--bg-surface)' },
  typeCardActive: { borderColor: 'var(--accent)', background: 'var(--accent-subtle)' },
  typeName:{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 },
  typeDesc:{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 },
  field:   { marginBottom: 16 },
  label:   { fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 },
  input:   { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const },
  hint:    { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 },
  warn:    { padding: '12px 16px', background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 8, fontSize: 13, color: 'var(--warning)', marginBottom: 16, lineHeight: 1.5 },
  chips:   { display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 8 },
  nav:     { display: 'flex', justifyContent: 'space-between', marginTop: 32 },
  steps:   { display: 'flex', gap: 8, marginBottom: 32 },
  stepDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)' },
  stepDotActive: { background: 'var(--accent)' },
}

const TYPES: Array<{ type: FeedSourceType; icon: React.ReactNode; name: string; desc: string }> = [
  { type: 'rss',   icon: <Rss size={28} weight="fill" color="var(--text-primary)" />,      name: 'RSS-Feed',   desc: 'Einfachste Option' },
  { type: 'email', icon: <Envelope size={28} weight="fill" color="var(--text-primary)" />,  name: 'Newsletter', desc: 'Über Inbound-Adresse' },
  { type: 'api',   icon: <Plugs size={28} weight="fill" color="var(--text-primary)" />,     name: 'API',        desc: 'Eigene Konfiguration' },
  { type: 'url',   icon: <Globe size={28} weight="fill" color="var(--text-primary)" />,     name: 'Website',    desc: '⚠ Rechtl. beachten' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function isStep2Valid(type: FeedSourceType, name: string, url: string, disclaimerChecked: boolean): boolean {
  if (!name.trim()) return false
  if (type !== 'email' && !url.trim()) return false
  if (type === 'url' && !disclaimerChecked) return false
  return true
}

function addKeyword(kw: string, list: string[], setList: (v: string[]) => void) {
  const trimmed = kw.trim()
  if (trimmed && !list.includes(trimmed)) setList([...list, trimmed])
}

// ── Step sub-components ───────────────────────────────────────────────────────

function StepTypeSelect({ type, onSelect }: { type: FeedSourceType; onSelect: (t: FeedSourceType) => void }) {
  return (
    <>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Welche Art von Quelle möchtest du hinzufügen?</p>
      <div style={s.types}>
        {TYPES.map(({ type: t, icon, name: n, desc }) => (
          <div
            key={t}
            role="button"
            tabIndex={0}
            style={{ ...s.typeCard, ...(type === t ? s.typeCardActive : {}) }}
            onClick={() => onSelect(t)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(t)}
            aria-pressed={type === t}
          >
            <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={s.typeName}>{n}</div>
            <div style={s.typeDesc}>{desc}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function UrlField({ type, url, onUrlChange }: { type: FeedSourceType; url: string; onUrlChange: (v: string) => void }) {
  const label = type === 'rss' ? 'Feed-URL' : type === 'api' ? 'API-Endpoint' : 'Seiten-URL'
  return (
    <div style={s.field}>
      <label htmlFor="source-url" style={s.label}>{label}</label>
      <input id="source-url" style={s.input} value={url} onChange={(e) => onUrlChange(e.target.value)} placeholder="https://" type="url" />
    </div>
  )
}

function ScrapingDisclaimer({ cssSelector, onCssSelectorChange, disclaimerChecked, onDisclaimerChange }: {
  cssSelector: string
  onCssSelectorChange: (v: string) => void
  disclaimerChecked: boolean
  onDisclaimerChange: (v: boolean) => void
}) {
  return (
    <>
      <div style={s.warn} role="alert">
        <strong>Rechtlicher Hinweis:</strong> Web-Scraping kann gegen die Nutzungsbedingungen einer Website verstoßen. Stelle sicher, dass du berechtigt bist, diese Seite automatisiert abzurufen. Prüfe robots.txt und AGB der Zielseite. Tropen OS prüft robots.txt automatisch und übernimmt keine Haftung.
      </div>
      <div style={s.field}>
        <label style={{ ...s.label, display: 'flex', gap: 8, cursor: 'pointer', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={disclaimerChecked}
            onChange={(e) => onDisclaimerChange(e.target.checked)}
            aria-label="Rechtlichen Hinweis bestätigen"
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          Ich habe die rechtliche Situation geprüft und übernehme die Verantwortung.
        </label>
      </div>
      <div style={s.field}>
        <label htmlFor="css-selector" style={s.label}>CSS-Selektor (optional)</label>
        <input id="css-selector" style={s.input} value={cssSelector} onChange={(e) => onCssSelectorChange(e.target.value)} placeholder="article.news-item" />
        <div style={s.hint}>Welche Elemente sollen extrahiert werden? Leer = automatisch.</div>
      </div>
    </>
  )
}

function StepDetails({ type, name, url, cssSelector, disclaimerChecked, onNameChange, onUrlChange, onCssSelectorChange, onDisclaimerChange }: {
  type: FeedSourceType
  name: string
  url: string
  cssSelector: string
  disclaimerChecked: boolean
  onNameChange: (v: string) => void
  onUrlChange: (v: string) => void
  onCssSelectorChange: (v: string) => void
  onDisclaimerChange: (v: boolean) => void
}) {
  return (
    <>
      <div style={s.field}>
        <label htmlFor="source-name" style={s.label}>Name der Quelle</label>
        <input id="source-name" style={s.input} value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="z.B. TechCrunch AI" />
      </div>

      {type === 'email' ? (
        <div style={s.field}>
          <label style={s.label}>Inbound-Adresse</label>
          <div style={s.hint}>Eine eindeutige Adresse wird beim Speichern generiert. Abonniere deinen Newsletter mit dieser Adresse.</div>
        </div>
      ) : (
        <UrlField type={type} url={url} onUrlChange={onUrlChange} />
      )}

      {type === 'url' && (
        <ScrapingDisclaimer
          cssSelector={cssSelector}
          onCssSelectorChange={onCssSelectorChange}
          disclaimerChecked={disclaimerChecked}
          onDisclaimerChange={onDisclaimerChange}
        />
      )}
    </>
  )
}

function KeywordChip({ kw, onRemove, danger }: { kw: string; onRemove: () => void; danger?: boolean }) {
  if (danger) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 12, color: 'var(--error)' }}>
        {kw}
        <button type="button" className="btn-icon" onClick={onRemove} aria-label={`${kw} entfernen`}>×</button>
      </span>
    )
  }
  return (
    <span className="chip chip--active" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {kw}
      <button type="button" className="btn-icon" onClick={onRemove} aria-label={`${kw} entfernen`}>×</button>
    </span>
  )
}

function KeywordField({ id, label, value, chips, chipsDanger, ariaChipsLabel, onValueChange, onAdd, onRemove }: {
  id: string
  label: string
  value: string
  chips: string[]
  chipsDanger?: boolean
  ariaChipsLabel: string
  onValueChange: (v: string) => void
  onAdd: () => void
  onRemove: (kw: string) => void
}) {
  return (
    <div style={s.field}>
      <label htmlFor={id} style={s.label}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id={id}
          style={{ ...s.input, flex: 1 }}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAdd() }}
          placeholder={id === 'kw-include' ? 'z.B. AI, LLM' : 'z.B. sponsored, Werbung'}
        />
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={onAdd}
          aria-label="Keyword hinzufügen"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={14} weight="bold" aria-hidden="true" /> Hinzufügen
        </button>
      </div>
      <div style={s.chips} aria-label={ariaChipsLabel}>
        {chips.map((kw) => (
          <KeywordChip key={kw} kw={kw} onRemove={() => onRemove(kw)} danger={chipsDanger} />
        ))}
      </div>
    </div>
  )
}

function StepFilters({ keywordsInclude, keywordsExclude, minScore, kwInput, kwExInput, onKwInputChange, onKwExInputChange, onAddInclude, onAddExclude, onRemoveInclude, onRemoveExclude, onMinScoreChange }: {
  keywordsInclude: string[]
  keywordsExclude: string[]
  minScore: number
  kwInput: string
  kwExInput: string
  onKwInputChange: (v: string) => void
  onKwExInputChange: (v: string) => void
  onAddInclude: () => void
  onAddExclude: () => void
  onRemoveInclude: (kw: string) => void
  onRemoveExclude: (kw: string) => void
  onMinScoreChange: (v: number) => void
}) {
  return (
    <>
      <KeywordField
        id="kw-include"
        label="Keywords — mindestens eines muss vorkommen"
        value={kwInput}
        chips={keywordsInclude}
        ariaChipsLabel="Ausgewählte Keywords"
        onValueChange={onKwInputChange}
        onAdd={onAddInclude}
        onRemove={onRemoveInclude}
      />
      <KeywordField
        id="kw-exclude"
        label="Keywords ausschließen"
        value={kwExInput}
        chips={keywordsExclude}
        chipsDanger
        ariaChipsLabel="Ausgeschlossene Keywords"
        onValueChange={onKwExInputChange}
        onAdd={onAddExclude}
        onRemove={onRemoveExclude}
      />
      <div style={s.field}>
        <label htmlFor="min-score" style={s.label}>Relevanz-Schwelle: {minScore}/10</label>
        <input
          id="min-score"
          type="range"
          min={1}
          max={10}
          value={minScore}
          onChange={(e) => onMinScoreChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={minScore}
          aria-label={`Relevanz-Schwelle: ${minScore} von 10`}
        />
        <p className="form-hint">
          Artikel werden von KI auf Relevanz bewertet (Score 1–10).{' '}
          Nur Artikel <strong>ab diesem Score</strong> werden angezeigt.{' '}
          <span className="form-hint-option">5 – großzügig</span>{' '}
          <span className="form-hint-recommended">6 – empfohlen</span>{' '}
          <span className="form-hint-option">8 – streng</span>
        </p>
      </div>
    </>
  )
}

function StepOutputs() {
  return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Soll dieser Feed automatisch Wissen in ein Projekt oder einen Workspace einspeisen?
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
        Zuordnungen können nach dem Speichern in den Quellen-Einstellungen konfiguriert werden.
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewFeedPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [type, setType] = useState<FeedSourceType>('rss')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [cssSelector, setCssSelector] = useState('')
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)
  const [keywordsInclude, setKeywordsInclude] = useState<string[]>([])
  const [keywordsExclude, setKeywordsExclude] = useState<string[]>([])
  const [minScore, setMinScore] = useState(6)
  const [kwInput, setKwInput] = useState('')
  const [kwExInput, setKwExInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchResult, setFetchResult] = useState<{ itemsSaved: number } | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    if (type !== 'email' && !url.trim()) { setError('URL ist erforderlich'); return }
    if (type === 'url' && !disclaimerChecked) { setError('Bitte bestätige den Disclaimer'); return }

    setSaving(true)
    const config: Record<string, unknown> = { polling_interval_minutes: type === 'url' ? 360 : 60 }
    if (type === 'url') { config.css_selector = cssSelector; config.disclaimer_acknowledged = true }

    const result = await createFeedSource({ name, type, url: url || undefined, config, keywordsInclude, keywordsExclude, minScore })
    setSaving(false)
    if ('error' in result) { setError(result.error ?? ''); return }

    // Trigger initial fetch for non-email sources (email comes via inbound webhook)
    if (type !== 'email' && result.source?.id) {
      setFetching(true)
      const fetchRes = await triggerFetch(result.source.id)
      setFetching(false)
      setFetchResult({ itemsSaved: fetchRes.itemsSaved })
      // Short delay so user sees the result, then navigate
      await new Promise((r) => setTimeout(r, 2000))
    }

    router.push('/feeds')
  }

  const canNext = step !== 2 || isStep2Valid(type, name, url, disclaimerChecked)

  const addInclude = () => { addKeyword(kwInput, keywordsInclude, setKeywordsInclude); setKwInput('') }
  const addExclude = () => { addKeyword(kwExInput, keywordsExclude, setKeywordsExclude); setKwExInput('') }

  return (
    <div className="content-narrow">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">Neue Feed-Quelle</h1>
          <p className="page-header-sub">Schritt {step} von 4</p>
        </div>
      </div>

      <div style={s.steps} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
        {([1,2,3,4] as const).map((n) => (
          <div key={n} style={{ ...s.stepDot, ...(step >= n ? s.stepDotActive : {}) }} />
        ))}
      </div>

      {step === 1 && <StepTypeSelect type={type} onSelect={setType} />}

      {step === 2 && (
        <StepDetails
          type={type}
          name={name}
          url={url}
          cssSelector={cssSelector}
          disclaimerChecked={disclaimerChecked}
          onNameChange={setName}
          onUrlChange={setUrl}
          onCssSelectorChange={setCssSelector}
          onDisclaimerChange={setDisclaimerChecked}
        />
      )}

      {step === 3 && (
        <StepFilters
          keywordsInclude={keywordsInclude}
          keywordsExclude={keywordsExclude}
          minScore={minScore}
          kwInput={kwInput}
          kwExInput={kwExInput}
          onKwInputChange={setKwInput}
          onKwExInputChange={setKwExInput}
          onAddInclude={addInclude}
          onAddExclude={addExclude}
          onRemoveInclude={(kw) => setKeywordsInclude(keywordsInclude.filter((k) => k !== kw))}
          onRemoveExclude={(kw) => setKeywordsExclude(keywordsExclude.filter((k) => k !== kw))}
          onMinScoreChange={setMinScore}
        />
      )}

      {step === 4 && <StepOutputs />}

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: 8, fontSize: 13, color: 'var(--error)', marginTop: 12, lineHeight: 1.5 }} role="alert">
          {error}
        </div>
      )}

      <div style={s.nav}>
        <button
          className="btn btn-ghost"
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={() => step > 1 ? setStep((prev) => (prev - 1) as Step) : router.push('/feeds')}
        >
          <ArrowLeft size={14} weight="bold" aria-hidden="true" />
          {step === 1 ? 'Abbrechen' : 'Zurück'}
        </button>
        {step < 4 ? (
          <button
            className="btn btn-primary"
            type="button"
            disabled={!canNext}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setStep((prev) => (prev + 1) as Step)}
          >
            Weiter <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            type="button"
            disabled={saving || fetching}
            onClick={handleSubmit}
            aria-busy={saving || fetching}
          >
            {saving ? 'Wird gespeichert…' : fetching ? 'Erster Fetch läuft…' : fetchResult ? `${fetchResult.itemsSaved} Artikel gefunden — weiter…` : 'Quelle erstellen'}
          </button>
        )}
      </div>
    </div>
  )
}
