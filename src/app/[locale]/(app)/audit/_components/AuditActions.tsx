'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ArrowClockwise, CheckCircle, WarningCircle, Brain, Spinner, Wrench } from '@phosphor-icons/react'
import { ProfileOnboardingModal } from '@/components/audit/ProfileOnboardingModal'

// ── Types ──────────────────────────────────────────────────────────────────────

type TriggerState = 'idle' | 'running' | 'done' | 'error'

interface RateLimitStatus {
  allowed: boolean
  reason?: 'cooldown' | 'monthly-limit'
  cooldownExpires?: string
  usedThisMonth: number
  monthlyLimit: number
}

interface AuditActionsProps {
  runId?: string
  reviewType?: string | null
  criticalCount?: number
  scanProjectId?: string | null
  initialLighthouseUrl?: string | null
  isVercelEnv?: boolean
  needsOnboarding?: boolean
  isExistingProject?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildReviewButtonTitle(rls: RateLimitStatus | null, cooldownLabel: string | null): string | undefined {
  if (!rls) return undefined
  if (rls.reason === 'cooldown' && cooldownLabel) return cooldownLabel
  if (rls.reason === 'monthly-limit') return `${rls.usedThisMonth}/${rls.monthlyLimit} genutzt — monatliches Limit erreicht`
  return undefined
}

function buildReviewButtonLabel(rls: RateLimitStatus | null, alreadyReviewed: boolean): string {
  if (rls?.reason === 'monthly-limit') return `${rls.usedThisMonth}/${rls.monthlyLimit} genutzt`
  return alreadyReviewed ? 'Deep Review wiederholen' : 'Deep Review'
}

function buildCooldownLabel(rls: RateLimitStatus | null): string | null {
  if (rls?.reason !== 'cooldown' || !rls.cooldownExpires) return null
  return `Verfügbar ab ${new Date(rls.cooldownExpires).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ state, result }: {
  state: TriggerState
  result: { percentage?: number } | { findings?: number; costEur?: number } | { generated: number; totalCostEur: number } | null
}) {
  if (state !== 'done' || !result) return null

  let label: string
  if ('percentage' in result && result.percentage !== undefined) {
    label = `${result.percentage.toFixed(1)}%`
  } else if ('findings' in result && result.findings !== undefined) {
    const r = result as { findings: number; costEur?: number }
    label = `${r.findings} Findings · €${r.costEur?.toFixed(3)}`
  } else {
    const r = result as { generated: number; totalCostEur: number }
    label = `${r.generated} Fixes · €${r.totalCostEur.toFixed(3)}`
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--accent)' }}>
      <CheckCircle size={15} weight="fill" aria-hidden="true" />
      {label}
    </span>
  )
}

function ReviewUsageHint({ rls }: { rls: RateLimitStatus }) {
  if (!rls.allowed || rls.usedThisMonth === 0) return null
  return (
    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
      {rls.monthlyLimit - rls.usedThisMonth}/{rls.monthlyLimit}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AuditActions({ runId, reviewType, criticalCount, scanProjectId, initialLighthouseUrl, needsOnboarding, isExistingProject }: AuditActionsProps) {
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profileJustSet, setProfileJustSet] = useState(false)
  const [auditState, setAuditState] = useState<TriggerState>('idle')
  const [reviewState, setReviewState] = useState<TriggerState>('idle')
  const [auditResult, setAuditResult] = useState<{ percentage?: number } | null>(null)
  const [reviewResult, setReviewResult] = useState<{ findings?: number; costEur?: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [batchState, setBatchState] = useState<TriggerState>('idle')
  const [batchResult, setBatchResult] = useState<{ generated: number; totalCostEur: number } | null>(null)
  const [lighthouseUrl, setLighthouseUrl] = useState(initialLighthouseUrl ?? '')
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null)

  useEffect(() => {
    if (!initialLighthouseUrl) {
      const key = `lh_url_${scanProjectId ?? 'default'}`
      const saved = localStorage.getItem(key)
      if (saved) setLighthouseUrl(saved)
    }
  }, [initialLighthouseUrl, scanProjectId])

  useEffect(() => {
    if (!runId) return
    fetch('/api/audit/review/status')
      .then(r => r.ok ? r.json() as Promise<RateLimitStatus> : null)
      .then(data => { if (data) setRateLimitStatus(data) })
      .catch(() => { /* fail-open — rate limit not fetched */ })
  }, [runId])

  async function handleTrigger() {
    if (needsOnboarding && !profileJustSet && scanProjectId) {
      setShowOnboarding(true)
      return
    }
    setAuditState('running')
    setAuditResult(null)
    setErrorMsg(null)
    const url = lighthouseUrl.trim()
    const body = url
      ? { skipCli: true, withTools: true, lighthouseUrl: url }
      : { skipCli: true }
    try {
      const res = await fetch('/api/audit/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; code?: string }
        if (data.code === 'LOCAL_ONLY') {
          setErrorMsg('Audit nur lokal ausführen: pnpm exec tsx src/scripts/run-audit.ts --skip-cli')
        } else {
          setErrorMsg(data.error ?? 'Audit fehlgeschlagen')
        }
        setAuditState('error')
        return
      }
      const data = await res.json() as { runId: string; percentage: number }
      setAuditResult(data)
      setAuditState('done')
      const dest = scanProjectId
        ? `/audit?project=${scanProjectId}&runId=${data.runId}`
        : `/audit?runId=${data.runId}`
      router.push(dest)
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

  // Derived state
  const isAuditRunning  = auditState === 'running'
  const isReviewRunning = reviewState === 'running'
  const alreadyReviewed = reviewType === 'multi_model' && reviewState === 'idle'
  const reviewBlocked   = rateLimitStatus !== null && !rateLimitStatus.allowed
  const cooldownLabel   = buildCooldownLabel(rateLimitStatus)
  const reviewTitle     = buildReviewButtonTitle(rateLimitStatus, cooldownLabel)
  const reviewLabel     = buildReviewButtonLabel(rateLimitStatus, alreadyReviewed)
  const showDeepReviewHint = !alreadyReviewed && !!runId && reviewState === 'idle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      {/* Button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

        {/* Audit starten */}
        <button
          key="audit-trigger"
          className="btn btn-primary"
          onClick={handleTrigger}
          disabled={isAuditRunning || isReviewRunning}
          style={{ fontSize: 12, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <ArrowClockwise size={12} weight="bold" aria-hidden="true"
            style={{ animation: isAuditRunning ? 'spin 1s linear infinite' : 'none' }} />
          {isAuditRunning ? 'Audit läuft…' : 'Audit starten'}
        </button>

        {/* Deep Review */}
        {runId && (
          <button
            key="deep-review"
            className="btn btn-ghost"
            onClick={handleDeepReview}
            disabled={isReviewRunning || isAuditRunning || reviewBlocked}
            title={reviewTitle}
            style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: reviewBlocked ? 0.5 : 1 }}
          >
            <Brain size={15} weight="bold" aria-hidden="true" />
            {reviewLabel}
            {rateLimitStatus && <ReviewUsageHint rls={rateLimitStatus} />}
          </button>
        )}

        {/* Batch-Fix */}
        {runId && (criticalCount ?? 0) > 0 && (
          <button
            className="btn btn-ghost"
            onClick={handleBatchFix}
            disabled={batchState === 'running' || isAuditRunning || isReviewRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Wrench size={15} weight="bold" aria-hidden="true" />
            {batchState === 'running' ? 'Fixes werden generiert…' : `${criticalCount} Kritische fixen`}
          </button>
        )}

        {/* Result badges */}
        <StatusBadge state={auditState} result={auditResult} />
        <StatusBadge state={reviewState} result={reviewResult} />
        <StatusBadge state={batchState} result={batchResult} />

        {/* Error */}
        {(auditState === 'error' || reviewState === 'error') && errorMsg && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--error)' }}>
            <WarningCircle size={15} weight="fill" aria-hidden="true" />
            {errorMsg}
          </span>
        )}
      </div>

      {/* Deep Review hint */}
      {showDeepReviewHint && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 4,
          background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          fontSize: 11, color: 'var(--accent)',
        }}>
          <Brain size={11} weight="fill" aria-hidden="true" />
          4 KI-Modelle prüfen unabhängig — findet was Auto-Checks übersehen
          <span style={{ color: 'var(--text-tertiary)', marginLeft: 2 }}>· ca. €0.50</span>
        </div>
      )}

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

      {/* Profil-Onboarding-Modal */}
      {showOnboarding && scanProjectId && (
        <ProfileOnboardingModal
          scanProjectId={scanProjectId}
          isExistingProject={isExistingProject}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setShowOnboarding(false)
            setProfileJustSet(true)
            void handleTrigger()
          }}
        />
      )}
    </div>
  )
}
