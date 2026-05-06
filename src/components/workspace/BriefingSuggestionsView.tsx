'use client'

import { Tray, ArrowsClockwise, Export, CheckSquare, Square } from '@phosphor-icons/react'

export interface CardSuggestion {
  title: string
  card_type: 'input' | 'process' | 'output'
  description: string
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

interface Props {
  suggestions: CardSuggestion[]
  selected: Set<number>
  creating: boolean
  error: string | null
  onToggle: (idx: number) => void
  onCreateCards: () => void
  onBack: () => void
  onSkip: () => void
}

export default function BriefingSuggestionsView({
  suggestions,
  selected,
  creating,
  error,
  onToggle,
  onCreateCards,
  onBack,
  onSkip,
}: Props) {
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
            onClick={onBack}
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
                onClick={() => onToggle(i)}
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
            onClick={onCreateCards}
            disabled={creating || selected.size === 0}
            aria-busy={creating}
          >
            {creating ? 'Erstelle Karten…' : `${selected.size} Karte${selected.size === 1 ? '' : 'n'} anlegen`}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onSkip}
            disabled={creating}
          >
            Überspringen — leerer Canvas
          </button>
        </div>
      </div>
    </div>
  )
}
