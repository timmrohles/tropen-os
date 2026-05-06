'use client'

import { useState } from 'react'
import { createCard } from '@/actions/cards'
import { createClient } from '@/utils/supabase/client'
import type { Card } from '@/db/schema'
import type { WorkspaceWithDetails } from '@/types/workspace'
import BriefingSuggestionsView from './BriefingSuggestionsView'
import type { CardSuggestion } from './BriefingSuggestionsView'
import BriefingStepWizard from './BriefingStepWizard'

interface Props {
  workspace: WorkspaceWithDetails
  onComplete: (cards: Card[]) => void
  onSkip: () => void
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

  function handleBackToQuestions() {
    setSuggestions(null)
    setSelected(new Set())
    setError(null)
    setStep(4)
  }

  // ── Suggestions view ─────────────────────────────────────────────────────

  if (suggestions !== null) {
    return (
      <BriefingSuggestionsView
        suggestions={suggestions}
        selected={selected}
        creating={creating}
        error={error}
        onToggle={toggleCard}
        onCreateCards={handleCreateCards}
        onBack={handleBackToQuestions}
        onSkip={handleSkip}
      />
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

  // ── Step wizard view ──────────────────────────────────────────────────────

  return (
    <BriefingStepWizard
      step={step}
      goal={goal}
      baseline={baseline}
      complexity={complexity}
      collaboration={collaboration}
      error={error}
      onGoalChange={setGoal}
      onBaselineChange={setBaseline}
      onComplexityChange={setComplexity}
      onCollaborationChange={setCollaboration}
      onSetStep={setStep}
      onSkip={handleSkip}
      onStep4Complete={handleStep4Complete}
    />
  )
}
