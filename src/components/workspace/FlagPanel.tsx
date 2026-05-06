'use client'

interface FlagPanelProps {
  flagReason: string
  onReasonChange: (v: string) => void
  onFlag: () => void
  onCancel: () => void
}

export default function FlagPanel({ flagReason, onReasonChange, onFlag, onCancel }: FlagPanelProps) {
  return (
    <div style={{
      marginTop: 8,
      background: 'rgba(248,113,113,0.06)',
      border: '1px solid rgba(248,113,113,0.2)',
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
        Diese Antwort als fehlerhaft oder unangemessen melden (Art. 14 EU AI Act)?
      </p>
      <input
        placeholder="Grund (optional)"
        value={flagReason}
        onChange={e => onReasonChange(e.target.value)}
        style={{
          background: 'var(--bg-input, var(--bg-base))',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '6px 8px',
          color: 'var(--text-primary)',
          fontSize: 12,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onFlag}
          style={{
            background: 'var(--error)',
            border: 'none',
            borderRadius: 6,
            padding: '5px 12px',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Melden
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '5px 12px',
            color: 'var(--text-secondary)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
