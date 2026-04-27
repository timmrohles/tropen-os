'use client'

import { useState, useCallback } from 'react'

export interface ConsensusFixData {
  fixId: string
  explanation: string
  confidence: 'high' | 'medium' | 'low'
  model: string
  costEur: number
  judgeExplanation: string | null
  drafts: Array<{
    providerId: string
    explanation: string
    confidence: 'high' | 'medium' | 'low'
    costEur: number
    error?: string
  }>
  riskLevel?: 'safe' | 'moderate' | 'critical'
  riskReasons?: string[]
  status?: 'pending' | 'applied'
}

export type DeepFixState = 'idle' | 'checking' | 'generating' | 'ready' | 'error'

const FIX_ENGINE_ENABLED = process.env.NEXT_PUBLIC_FIX_ENGINE_ENABLED === 'true'

export function useDeepFix(findingId: string, runId: string) {
  const [state, setState] = useState<DeepFixState>('idle')
  const [data, setData] = useState<ConsensusFixData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const trigger = useCallback(async () => {
    if (!FIX_ENGINE_ENABLED) {
      console.warn('Fix-Engine deaktiviert. Verwende Fix-Prompt-Export.')
      return
    }
    if (!findingId || !runId) return

    // Toggle if already loaded
    if (state === 'ready') {
      setExpanded((e) => !e)
      return
    }

    // No-op if a request is in flight
    if (state === 'checking' || state === 'generating') return

    setState('checking')
    setErrorMessage(null)
    setData(null)

    try {
      // Cache lookup
      const checkRes = await fetch(
        `/api/audit/fix/consensus?findingId=${encodeURIComponent(findingId)}`
      )

      if (checkRes.ok) {
        const cached = (await checkRes.json()) as ConsensusFixData
        setData(cached)
        setState('ready')
        setExpanded(true)
        return
      }

      if (checkRes.status !== 404) {
        const err = (await checkRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? 'Fehler beim Prüfen')
      }

      // Cache miss — generate
      setState('generating')
      const genRes = await fetch('/api/audit/fix/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, runId }),
      })

      if (!genRes.ok) {
        const err = (await genRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? 'Generierung fehlgeschlagen')
      }

      const generated = (await genRes.json()) as ConsensusFixData
      setData(generated)
      setState('ready')
      setExpanded(true)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setState('error')
    }
  }, [findingId, runId, state])

  return { state, data, errorMessage, expanded, trigger }
}
