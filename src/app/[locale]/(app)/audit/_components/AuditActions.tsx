'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowClockwise, CheckCircle, WarningCircle, Brain, Spinner, Wrench, DownloadSimple } from '@phosphor-icons/react'

type TriggerState = 'idle' | 'running' | 'done' | 'error'

interface AuditActionsProps {
  runId?: string
  reviewType?: string | null
  criticalCount?: number
  scanProjectId?: string | null
  initialLighthouseUrl?: string | null
}

export default function AuditActions({ runId, reviewType, criticalCount, scanProjectId, initialLighthouseUrl }: AuditActionsProps) {
  const t = useTranslations('audit')
  const router = useRouter()
  const [auditState, setAuditState] = useState<TriggerState>('idle')
  const [reviewState, setReviewState] = useState<TriggerState>('idle')
  const [auditResult, setAuditResult] = useState<{ percentage?: number } | null>(null)
  const [reviewResult, setReviewResult] = useState<{ findings?: number; costEur?: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [batchState, setBatchState] = useState<TriggerState>('idle')
  const [batchResult, setBatchResult] = useState<{ generated: number; totalCostEur: number } | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [lighthouseUrl, setLighthouseUrl] = useState(initialLighthouseUrl ?? '')

  // Restore from localStorage on mount (fallback when no server-side URL)
  useEffect(() => {
    if (!initialLighthouseUrl) {
      const key = `lh_url_${scanProjectId ?? 'default'}`
      const saved = localStorage.getItem(key)
      if (saved) setLighthouseUrl(saved)
    }
  }, [initialLighthouseUrl, scanProjectId])

  function handleUrlChange(val: string) {
    setLighthouseUrl(val)
    const key = `lh_url_${scanProjectId ?? 'default'}`
    if (val.trim()) localStorage.setItem(key, val.trim())
    else localStorage.removeItem(key)
  }

  async function handleTrigger() {
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
        const data = await res.json().catch(() => ({})) as { error?: string; code?: string; hint?: string }
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

  function handleExport(format: 'cursorrules' | 'claude-md') {
    setExportOpen(false)
    const params = new URLSearchParams({ format })
    if (scanProjectId) params.set('projectId', scanProjectId)
    window.location.href = `/api/audit/export-rules?${params.toString()}`
  }

  const isAuditRunning  = auditState === 'running'
  const isReviewRunning = reviewState === 'running'
  const alreadyReviewed = reviewType === 'multi_model' && reviewState === 'idle'
  const canReview       = !!runId && !alreadyReviewed && !isReviewRunning && !isAuditRunning

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      {/* Button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="url"
          value={lighthouseUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={t('lighthousePlaceholder')}
          disabled={isAuditRunning}
          aria-label={t('lighthousePlaceholder')}
          style={{
            height: 36, padding: '0 12px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border)', background: 'var(--bg-surface-solid)',
            color: 'var(--text-primary)', outline: 'none', width: 300,
            opacity: isAuditRunning ? 0.5 : 1,
          }}
        />
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

        {/* Regeln exportieren */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setExportOpen((v) => !v)}
            disabled={isAuditRunning || isReviewRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            aria-haspopup="true"
            aria-expanded={exportOpen}
          >
            <DownloadSimple size={15} weight="bold" aria-hidden="true" />
            Regeln exportieren
          </button>
          {exportOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                onClick={() => setExportOpen(false)}
                aria-hidden="true"
              />
              {/* Dropdown */}
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                background: 'var(--bg-surface-solid)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '4px 0', minWidth: 220,
                boxShadow: '0 4px 16px rgba(26,23,20,0.10)',
              }}>
                <button
                  className="dropdown-item"
                  onClick={() => handleExport('cursorrules')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>.cursorrules</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Für Cursor, Windsurf, Zed</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => handleExport('claude-md')}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>CLAUDE.md</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Für Claude Code</span>
                </button>
              </div>
            </>
          )}
        </div>

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

      {/* Deep Review hint — shown before first review */}
      {!alreadyReviewed && !!runId && reviewState === 'idle' && (
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
          4 KI-Modelle prüfen unabhängig — findet was Auto-Checks übersehen · ca. €0.50
        </p>
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
    </div>
  )
}
