'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowClockwise, CheckCircle, WarningCircle, Brain, Spinner, Wrench } from '@phosphor-icons/react'

type TriggerState = 'idle' | 'running' | 'done' | 'error'

interface AuditActionsProps {
  runId?: string
  reviewType?: string | null
  criticalCount?: number
}

export default function AuditActions({ runId, reviewType, criticalCount }: AuditActionsProps) {
  const router = useRouter()
  const [auditState, setAuditState] = useState<TriggerState>('idle')
  const [reviewState, setReviewState] = useState<TriggerState>('idle')
  const [auditResult, setAuditResult] = useState<{ percentage?: number } | null>(null)
  const [reviewResult, setReviewResult] = useState<{ findings?: number; costEur?: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [withTools, setWithTools] = useState(false)
  const [batchState, setBatchState] = useState<TriggerState>('idle')
  const [batchResult, setBatchResult] = useState<{ generated: number; totalCostEur: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  async function handleTrigger() {
    setAuditState('running')
    setAuditResult(null)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/audit/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipCli: false, withTools }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setErrorMsg(data.error ?? 'Audit fehlgeschlagen')
        setAuditState('error')
        return
      }
      const data = await res.json() as { runId: string; percentage: number }
      setAuditResult(data)
      setAuditState('done')
      router.push(`/audit?runId=${data.runId}`)
    } catch {
      setErrorMsg('Netzwerkfehler — bitte erneut versuchen')
      setAuditState('error')
    }
  }

  async function handleDeepReview() {
    if (!runId) return
    setReviewState('running')
    setReviewResult(null)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/audit/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setErrorMsg(data.error ?? 'Deep Review fehlgeschlagen')
        setReviewState('error')
        return
      }
      const data = await res.json() as { findings: number; totalCostEur: number }
      setReviewResult({ findings: data.findings, costEur: data.totalCostEur })
      setReviewState('done')
      router.refresh()
    } catch {
      setErrorMsg('Netzwerkfehler — bitte erneut versuchen')
      setReviewState('error')
    }
  }

  async function handleBatchFix() {
    if (!runId) return
    setBatchState('running')
    setBatchResult(null)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/audit/fix/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, severityFilter: 'critical' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setErrorMsg(data.error ?? 'Batch-Fix fehlgeschlagen')
        setBatchState('error')
        return
      }
      const data = await res.json() as { generated: number; totalCostEur: number }
      setBatchResult(data)
      setBatchState('done')
    } catch {
      setErrorMsg('Netzwerkfehler — bitte erneut versuchen')
      setBatchState('error')
    }
  }

  const isAuditRunning  = auditState === 'running'
  const isReviewRunning = reviewState === 'running'
  const alreadyReviewed = reviewType === 'multi_model' && reviewState === 'idle'
  const canReview       = !!runId && !alreadyReviewed && !isReviewRunning && !isAuditRunning

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      {/* Tools-Checkbox — mounted guard prevents hydration mismatch */}
      {mounted && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={withTools}
            onChange={(e) => setWithTools(e.target.checked)}
            disabled={isAuditRunning || isReviewRunning}
            style={{ accentColor: 'var(--accent)', width: 13, height: 13 }}
          />
          Mit externen Tools (depcruise, ESLint, gitleaks)
        </label>
      )}

      {/* Button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={handleTrigger}
          disabled={isAuditRunning || isReviewRunning}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowClockwise size={15} weight="bold" aria-hidden="true"
            style={{ animation: isAuditRunning ? 'spin 1s linear infinite' : 'none' }} />
          {isAuditRunning ? 'Audit läuft…' : 'Audit starten'}
        </button>

        {runId && (
          <button
            className="btn btn-ghost"
            onClick={handleDeepReview}
            disabled={isReviewRunning || isAuditRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Brain size={15} weight="bold" aria-hidden="true" />
            {alreadyReviewed ? 'Deep Review wiederholen' : 'Deep Review'}
          </button>
        )}

        {runId && (criticalCount ?? 0) > 0 && (
          <button
            className="btn btn-ghost"
            onClick={handleBatchFix}
            disabled={batchState === 'running' || isAuditRunning || isReviewRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Wrench size={15} weight="bold" aria-hidden="true" />
            {batchState === 'running' ? 'Fixes werden generiert…' : `${criticalCount} Critical fixen`}
          </button>
        )}

        {auditState === 'done' && auditResult && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--accent)' }}>
            <CheckCircle size={15} weight="fill" aria-hidden="true" />
            {auditResult.percentage?.toFixed(1)}%
          </span>
        )}

        {reviewState === 'done' && reviewResult && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--accent)' }}>
            <CheckCircle size={15} weight="fill" aria-hidden="true" />
            {reviewResult.findings} Findings · €{reviewResult.costEur?.toFixed(3)}
          </span>
        )}

        {batchState === 'done' && batchResult && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--accent)' }}>
            <CheckCircle size={15} weight="fill" aria-hidden="true" />
            {batchResult.generated} Fixes · €{batchResult.totalCostEur.toFixed(3)}
          </span>
        )}

        {(auditState === 'error' || reviewState === 'error') && errorMsg && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--error)' }}>
            <WarningCircle size={15} weight="fill" aria-hidden="true" />
            {errorMsg}
          </span>
        )}
      </div>

      {/* Running status banner */}
      {isReviewRunning && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 8,
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
          fontSize: 12, color: 'var(--accent)', fontWeight: 500,
        }}>
          <Spinner size={14} weight="bold" aria-hidden="true"
            style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          4 Modelle analysieren den Code — bitte warten (bis zu 2 min)…
        </div>
      )}
    </div>
  )
}
