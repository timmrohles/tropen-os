// src/app/audit/scan/_components/ScanProgress.tsx
'use client'

interface Props {
  phase: 'reading' | 'uploading' | 'analyzing'
  filesRead?: number
  message?: string
}

const PHASE_LABELS: Record<Props['phase'], string> = {
  reading: 'Dateien werden gelesen…',
  uploading: 'Dateien werden übertragen…',
  analyzing: 'Audit wird durchgeführt…',
}

const PHASE_PERCENT: Record<Props['phase'], number> = {
  reading: 33,
  uploading: 66,
  analyzing: 90,
}

export default function ScanProgress({ phase, filesRead, message }: Props) {
  const pct = PHASE_PERCENT[phase]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 13,
        color: 'var(--text-secondary)',
      }}>
        <span>{message ?? PHASE_LABELS[phase]}</span>
        {filesRead != null && (
          <span style={{ color: 'var(--text-tertiary)' }}>{filesRead.toLocaleString('de')} Dateien</span>
        )}
      </div>
      <div style={{
        height: 6,
        background: 'var(--border)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--accent)',
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}
