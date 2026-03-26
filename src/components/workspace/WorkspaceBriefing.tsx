'use client'

import { useState } from 'react'
import { Tray, ArrowsClockwise, Export, CheckSquare, Square } from '@phosphor-icons/react'
import { createCard } from '@/actions/cards'
import { createClient } from '@/utils/supabase/client'
import type { Card } from '@/db/schema'
import type { WorkspaceWithDetails } from '@/types/workspace'
import { StepWrapper, StepActions } from './BriefingSteps'

interface CardSuggestion {
  title: string
  card_type: 'input' | 'process' | 'output'
  description: string
}

interface Props {
  workspace: WorkspaceWithDetails
  onComplete: (cards: Card[]) => void
  onSkip: () => void
}

const TYPE_ICON = {
  input:   <Tray size={14} weight="fill" aria-hidden="true" />,
  process: <ArrowsClockwise size={14} weight="fill" aria-hidden="true" />,
  output:  <Export size={14} weight="fill" aria-hidden="true" />,
}

const TYPE_LABEL: Record<string, string> = {
  input:   'Eingabe',
  process: 'Analyse',
  output:  'Ergebnis',
}

const TYPE_COLOR: Record<string, string> = {
  input:   'var(--accent)',
  process: 'var(--tropen-process, #8B5CF6)',
  output:  'var(--tropen-output, #F59E0B)',
}

const COMPLEXITY_OPTIONS = [
  { value: 'Überschaubar (1–3 Karten)',  label: 'Überschaubar', sub: '1–3 Karten' },
  { value: 'Mittel (4–7 Karten)',         label: 'Mittel',       sub: '4–7 Karten' },
  { value: 'Komplex (8+ Karten)',         label: 'Komplex',      sub: '8+ Karten' },
]

const COLLAB_OPTIONS = [
  { value: 'Alleine',       label: 'Alleine' },
  { value: 'Mit dem Team',  label: 'Mit dem Team' },
]

const inp: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-surface-solid)',
  border: '1px solid var(--border-medium)',
  borderRadius: 8,
  padding: '10px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans, system-ui)',
  resize: 'none' as const,
}

export default function WorkspaceBriefing({ workspace, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('')
  const [baseline, setBaseline] = useState('')
  const [complexity, setComplexity] = useState('')
  const [collaboration, setCollaboration] = useState('')

  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<CardSuggestion[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStep4Complete(collab: string) {
    setCollaboration(collab)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workspaces/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, baseline, complexity, collaboration: collab }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const data: CardSuggestion[] = await res.json()
      setSuggestions(data)
      // Select all by default
      setSelected(new Set(data.map((_, i) => i)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Generieren')
    } finally {
      setLoading(false)
    }
  }

  function toggleCard(idx: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  async function handleCreateCards() {
    if (!suggestions) return
    setCreating(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const toCreate = suggestions.filter((_, i) => selected.has(i))
      const created: Card[] = []

      for (let i = 0; i < toCreate.length; i++) {
        const s = toCreate[i]
        const card = await createCard({
          workspaceId: workspace.id,
          title: s.title,
          type: s.card_type,
          description: s.description,
          status: 'draft',
          model: 'claude',
          positionX: 80 + (i % 3) * 260,
          positionY: 80 + Math.floor(i / 3) * 180,
          fields: [],
          sortOrder: i,
          createdBy: user?.id,
        })
        created.push(card)
      }

      // Mark briefing as complete in meta (no migration needed — uses JSONB)
      await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: { ...((workspace.meta ?? {}) as object), briefing_done: true } }),
      }).catch(() => {/* non-critical */})

      onComplete(created)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen der Karten')
    } finally {
      setCreating(false)
    }
  }

  function handleSkip() {
    // Mark briefing as skipped in meta
    fetch(`/api/workspaces/${workspace.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: { ...((workspace.meta ?? {}) as object), briefing_skipped: true } }),
    }).catch(() => {/* non-critical */})
    onSkip()
  }

  // ── Suggestions view ─────────────────────────────────────────────────────

  function handleBackToQuestions() {
    setSuggestions(null)
    setSelected(new Set())
    setError(null)
    setStep(4)
  }

  if (suggestions !== null) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: 560,
        padding: '0 24px',
        zIndex: 20,
      }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleBackToQuestions}
              style={{ padding: '3px 8px', fontSize: 12 }}
              aria-label="Zurück zu den Fragen"
            >
              ← Zurück
            </button>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              ✨ Toro schlägt vor
            </p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20, marginLeft: 0 }}>
            Wähle die Karten ab, die du nicht brauchst.
          </p>

          {error && (
            <p role="alert" style={{ fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>{error}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {suggestions.map((s, i) => {
              const isSelected = selected.has(i)
              const color = TYPE_COLOR[s.card_type]
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleCard(i)}
                  aria-pressed={isSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: isSelected ? 'var(--bg-surface)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--border-medium)' : 'var(--border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    opacity: isSelected ? 1 : 0.5,
                  }}
                >
                  <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }}>
                    {isSelected
                      ? <CheckSquare size={18} weight="fill" aria-hidden="true" />
                      : <Square size={18} weight="bold" aria-hidden="true" />
                    }
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.title}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 600,
                        color: color,
                        background: `${color}15`,
                        border: `1px solid ${color}30`,
                        padding: '1px 7px', borderRadius: 4,
                      }}>
                        {TYPE_ICON[s.card_type]}
                        {TYPE_LABEL[s.card_type]}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                      {s.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateCards}
              disabled={creating || selected.size === 0}
              aria-busy={creating}
            >
              {creating ? 'Erstelle Karten…' : `${selected.size} Karte${selected.size !== 1 ? 'n' : ''} anlegen`}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleSkip}
              disabled={creating}
            >
              Überspringen — leerer Canvas
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading view ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', textAlign: 'center',
      }}>
        <div className="card" style={{ padding: '32px 40px' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            Toro denkt nach…
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Karten-Vorschläge werden generiert
          </p>
        </div>
      </div>
    )
  }

  // ── Step view ─────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      maxWidth: 520,
      padding: '0 24px',
      zIndex: 10,
    }}>
      <div className="card" style={{ padding: 28 }}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: n <= step ? 'var(--accent)' : 'var(--border-medium)',
              transition: 'background 0.2s',
            }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6, flexShrink: 0 }}>
            {step}/4
          </span>
        </div>

        {error && (
          <p role="alert" style={{ fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>{error}</p>
        )}

        {step === 1 && (
          <StepWrapper
            label="Schritt 1/4: Ziel"
            question="Was soll am Ende dieses Workspaces stehen?"
          >
            <textarea
              rows={3}
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="z.B. eine fertige Kampagnenstrategie für Q3"
              style={inp}
              aria-label="Ziel des Workspaces"
              autoFocus
            />
            <StepActions
              onNext={() => { if (goal.trim()) setStep(2) }}
              nextDisabled={!goal.trim()}
              onSkip={handleSkip}
            />
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper
            label="Schritt 2/4: Ausgangslage"
            question="Was weißt du schon — was liegt bereits vor?"
          >
            <textarea
              rows={3}
              value={baseline}
              onChange={e => setBaseline(e.target.value)}
              placeholder="z.B. Zielgruppen-Analyse, Budget steht fest"
              style={inp}
              aria-label="Ausgangslage"
              autoFocus
            />
            <StepActions
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              onSkip={handleSkip}
            />
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper
            label="Schritt 3/4: Komplexität"
            question="Wie komplex ist das Vorhaben?"
          >
            <div
              role="listbox"
              aria-label="Komplexität wählen"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {COMPLEXITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={complexity === opt.value}
                  onClick={() => setComplexity(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    textAlign: 'left',
                    background: complexity === opt.value ? 'var(--accent-light)' : 'var(--bg-surface)',
                    border: `1.5px solid ${complexity === opt.value ? 'var(--accent)' : 'var(--border-medium)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: complexity === opt.value ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
            <StepActions
              onBack={() => setStep(2)}
              onNext={() => { if (complexity) setStep(4) }}
              nextDisabled={!complexity}
              onSkip={handleSkip}
            />
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper
            label="Schritt 4/4: Zusammenarbeit"
            question="Arbeitest du alleine oder mit dem Team?"
          >
            <div
              role="listbox"
              aria-label="Zusammenarbeit wählen"
              style={{ display: 'flex', gap: 10 }}
            >
              {COLLAB_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={collaboration === opt.value}
                  onClick={() => setCollaboration(opt.value)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    cursor: 'pointer', textAlign: 'center',
                    background: collaboration === opt.value ? 'var(--accent-light)' : 'var(--bg-surface)',
                    border: `1.5px solid ${collaboration === opt.value ? 'var(--accent)' : 'var(--border-medium)'}`,
                    fontSize: 13, fontWeight: 600,
                    color: collaboration === opt.value ? 'var(--accent)' : 'var(--text-primary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <StepActions
              onBack={() => setStep(3)}
              onNext={() => { if (collaboration) handleStep4Complete(collaboration) }}
              nextLabel="Karten vorschlagen lassen"
              nextDisabled={!collaboration}
              onSkip={handleSkip}
            />
          </StepWrapper>
        )}
      </div>
    </div>
  )
}

