'use client'
// src/app/feeds/new/page.tsx
// Multi-step wizard for creating a new feed source.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  const addKw = (kw: string, list: string[], setList: (v: string[]) => void) => {
    const trimmed = kw.trim()
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed])
  }

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

  const canNext = step === 1 ? true
    : step === 2 ? (name.trim().length > 0 && (type === 'email' || url.trim().length > 0) && (type !== 'url' || disclaimerChecked))
    : true

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

      {step === 1 && (
        <>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Welche Art von Quelle möchtest du hinzufügen?</p>
          <div style={s.types}>
            {TYPES.map(({ type: t, icon, name: n, desc }) => (
              <div
                key={t}
                role="button"
                tabIndex={0}
                style={{ ...s.typeCard, ...(type === t ? s.typeCardActive : {}) }}
                onClick={() => setType(t)}
                onKeyDown={(e) => e.key === 'Enter' && setType(t)}
                aria-pressed={type === t}
              >
                <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <div style={s.typeName}>{n}</div>
                <div style={s.typeDesc}>{desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={s.field}>
            <label htmlFor="source-name" style={s.label}>Name der Quelle</label>
            <input id="source-name" style={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. TechCrunch AI" />
          </div>

          {type === 'email' ? (
            <div style={s.field}>
              <label style={s.label}>Inbound-Adresse</label>
              <div style={s.hint}>Eine eindeutige Adresse wird beim Speichern generiert. Abonniere deinen Newsletter mit dieser Adresse.</div>
            </div>
          ) : (
            <div style={s.field}>
              <label htmlFor="source-url" style={s.label}>{type === 'rss' ? 'Feed-URL' : type === 'api' ? 'API-Endpoint' : 'Seiten-URL'}</label>
              <input id="source-url" style={s.input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" type="url" />
            </div>
          )}

          {type === 'url' && (
            <>
              <div style={s.warn} role="alert">
                <strong>Rechtlicher Hinweis:</strong> Web-Scraping kann gegen die Nutzungsbedingungen einer Website verstoßen. Stelle sicher, dass du berechtigt bist, diese Seite automatisiert abzurufen. Prüfe robots.txt und AGB der Zielseite. Tropen OS prüft robots.txt automatisch und übernimmt keine Haftung.
              </div>
              <div style={s.field}>
                <label style={{ ...s.label, display: 'flex', gap: 8, cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={disclaimerChecked}
                    onChange={(e) => setDisclaimerChecked(e.target.checked)}
                    aria-label="Rechtlichen Hinweis bestätigen"
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  Ich habe die rechtliche Situation geprüft und übernehme die Verantwortung.
                </label>
              </div>
              <div style={s.field}>
                <label htmlFor="css-selector" style={s.label}>CSS-Selektor (optional)</label>
                <input id="css-selector" style={s.input} value={cssSelector} onChange={(e) => setCssSelector(e.target.value)} placeholder="article.news-item" />
                <div style={s.hint}>Welche Elemente sollen extrahiert werden? Leer = automatisch.</div>
              </div>
            </>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div style={s.field}>
            <label htmlFor="kw-include" style={s.label}>Keywords — mindestens eines muss vorkommen</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="kw-include"
                style={{ ...s.input, flex: 1 }}
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addKw(kwInput, keywordsInclude, setKeywordsInclude); setKwInput('') } }}
                placeholder="z.B. AI, LLM"
              />
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => { addKw(kwInput, keywordsInclude, setKeywordsInclude); setKwInput('') }}
                aria-label="Keyword hinzufügen"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} weight="bold" aria-hidden="true" /> Hinzufügen
              </button>
            </div>
            <div style={s.chips} aria-label="Ausgewählte Keywords">
              {keywordsInclude.map((kw) => (
                <span key={kw} className="chip chip--active" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {kw}
                  <button type="button" className="btn-icon" onClick={() => setKeywordsInclude(keywordsInclude.filter((k) => k !== kw))} aria-label={`${kw} entfernen`}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div style={s.field}>
            <label htmlFor="kw-exclude" style={s.label}>Keywords ausschließen</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="kw-exclude"
                style={{ ...s.input, flex: 1 }}
                value={kwExInput}
                onChange={(e) => setKwExInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addKw(kwExInput, keywordsExclude, setKeywordsExclude); setKwExInput('') } }}
                placeholder="z.B. sponsored, Werbung"
              />
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => { addKw(kwExInput, keywordsExclude, setKeywordsExclude); setKwExInput('') }}
                aria-label="Ausschluss-Keyword hinzufügen"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} weight="bold" aria-hidden="true" /> Hinzufügen
              </button>
            </div>
            <div style={s.chips} aria-label="Ausgeschlossene Keywords">
              {keywordsExclude.map((kw) => (
                <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'var(--error-bg)', border: '1px solid var(--error)', fontSize: 12, color: 'var(--error)' }}>
                  {kw}
                  <button type="button" className="btn-icon" onClick={() => setKeywordsExclude(keywordsExclude.filter((k) => k !== kw))} aria-label={`${kw} entfernen`}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div style={s.field}>
            <label htmlFor="min-score" style={s.label}>Relevanz-Schwelle: {minScore}/10</label>
            <input
              id="min-score"
              type="range"
              min={1}
              max={10}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
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
      )}

      {step === 4 && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Soll dieser Feed automatisch Wissen in ein Projekt oder einen Workspace einspeisen?
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Zuordnungen können nach dem Speichern in den Quellen-Einstellungen konfiguriert werden.
          </p>
        </div>
      )}

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
