'use client'

import React from 'react'
import { Scales, WarningCircle } from '@phosphor-icons/react'
import { useDeepFix } from '@/hooks/useDeepFix'
import ConsensusFixResult from './ConsensusFixResult'

interface Props {
  findingId: string
  runId: string
}

const FIX_ENGINE_ENABLED = process.env.NEXT_PUBLIC_FIX_ENGINE_ENABLED === 'true'

export default function DeepFixButton({ findingId, runId }: Props) {
  const { state, data, errorMessage, expanded, trigger } = useDeepFix(findingId, runId)

  if (!FIX_ENGINE_ENABLED) return null

  const isLoading = state === 'checking' || state === 'generating'

  const label =
    state === 'generating' ? 'Generiert…' :
    state === 'checking'   ? 'Prüft…' :
    state === 'ready'      ? (expanded ? 'Deep Fix einklappen' : 'Deep Fix zeigen') :
    'Deep Fix'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={trigger}
          disabled={isLoading}
          title={state === 'generating'
            ? '4-Modell-Konsens läuft — dauert ca. 60 Sekunden'
            : 'Konsens-Fix mit 4 KI-Modellen + Opus-Richter generieren'}
          style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}
          aria-busy={isLoading}
        >
          <Scales
            size={12}
            weight="bold"
            aria-hidden="true"
            style={{ opacity: isLoading ? 0.4 : 0.7 }}
          />
          {label}
        </button>
        {state === 'idle' && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', opacity: 0.7 }}>
            ~30 Sek · Konsens aus 4 Modellen
          </span>
        )}
      </div>

      {state === 'error' && errorMessage && (
        <p style={{
          fontSize: 11, color: 'var(--error)', marginTop: 4,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <WarningCircle size={11} weight="bold" aria-hidden="true" />
          {errorMessage}
        </p>
      )}

      {state === 'ready' && expanded && data && (
        <ConsensusFixResult data={data} />
      )}
    </div>
  )
}
