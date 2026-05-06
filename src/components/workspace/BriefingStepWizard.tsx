'use client'

import { StepWrapper, StepActions } from './BriefingSteps'

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

interface Props {
  step: number
  goal: string
  baseline: string
  complexity: string
  collaboration: string
  error: string | null
  onGoalChange: (v: string) => void
  onBaselineChange: (v: string) => void
  onComplexityChange: (v: string) => void
  onCollaborationChange: (v: string) => void
  onSetStep: (n: number) => void
  onSkip: () => void
  onStep4Complete: (collab: string) => void
}

export default function BriefingStepWizard({
  step,
  goal,
  baseline,
  complexity,
  collaboration,
  error,
  onGoalChange,
  onBaselineChange,
  onComplexityChange,
  onCollaborationChange,
  onSetStep,
  onSkip,
  onStep4Complete,
}: Props) {
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
          <StepWrapper label="Schritt 1/4: Ziel" question="Was soll am Ende dieses Workspaces stehen?">
            <textarea
              rows={3}
              value={goal}
              onChange={e => onGoalChange(e.target.value)}
              placeholder="z.B. eine fertige Kampagnenstrategie für Q3"
              style={inp}
              aria-label="Ziel des Workspaces"
              autoFocus
            />
            <StepActions
              onNext={() => { if (goal.trim()) onSetStep(2) }}
              nextDisabled={!goal.trim()}
              onSkip={onSkip}
            />
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper label="Schritt 2/4: Ausgangslage" question="Was weißt du schon — was liegt bereits vor?">
            <textarea
              rows={3}
              value={baseline}
              onChange={e => onBaselineChange(e.target.value)}
              placeholder="z.B. Zielgruppen-Analyse, Budget steht fest"
              style={inp}
              aria-label="Ausgangslage"
              autoFocus
            />
            <StepActions
              onBack={() => onSetStep(1)}
              onNext={() => onSetStep(3)}
              onSkip={onSkip}
            />
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper label="Schritt 3/4: Komplexität" question="Wie komplex ist das Vorhaben?">
            <div role="listbox" aria-label="Komplexität wählen" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {COMPLEXITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={complexity === opt.value}
                  onClick={() => onComplexityChange(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
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
              onBack={() => onSetStep(2)}
              onNext={() => { if (complexity) onSetStep(4) }}
              nextDisabled={!complexity}
              onSkip={onSkip}
            />
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper label="Schritt 4/4: Zusammenarbeit" question="Arbeitest du alleine oder mit dem Team?">
            <div role="listbox" aria-label="Zusammenarbeit wählen" style={{ display: 'flex', gap: 10 }}>
              {COLLAB_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={collaboration === opt.value}
                  onClick={() => onCollaborationChange(opt.value)}
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
              onBack={() => onSetStep(3)}
              onNext={() => { if (collaboration) onStep4Complete(collaboration) }}
              nextLabel="Karten vorschlagen lassen"
              nextDisabled={!collaboration}
              onSkip={onSkip}
            />
          </StepWrapper>
        )}
      </div>
    </div>
  )
}
