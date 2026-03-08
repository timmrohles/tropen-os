'use client'

import React from 'react'
import { Trash, ArrowCounterClockwise, X } from '@phosphor-icons/react'

interface PapierkorbProps {
  trashCount: number
  trashOpen: boolean
  trashConvs: Array<{ id: string; title: string | null }>
  trashLoading: boolean
  onToggle: () => void
  onRestore: (id: string) => void
  onHardDelete: (id: string) => void
}

const s: Record<string, React.CSSProperties> = {
  trashSection: { borderTop: '1px solid #1a1a1a', flexShrink: 0 },
  trashToggle: {
    width: '100%', background: 'none', border: 'none', color: '#444',
    fontSize: 11, fontWeight: 600, padding: '7px 14px',
    textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 4,
  },
  trashList: { padding: '0 10px 8px' },
  trashHint: { fontSize: 10, color: '#333', padding: '2px 4px 6px', fontStyle: 'italic' },
  trashItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 6px', borderRadius: 5,
  },
  trashItemTitle: {
    flex: 1, fontSize: 12, color: '#555',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  trashRestoreBtn: {
    background: 'none', border: 'none', color: '#14b8a6',
    cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: 1,
  },
  trashDeleteBtn: {
    background: 'none', border: 'none', color: '#3a3a3a',
    cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1,
  },
}

// Design decision: the component renders unconditionally and handles the
// visibility condition internally with an early return. This keeps the parent
// clean — it can always render <Papierkorb> without its own conditional, while
// the component itself stays responsible for its own "I have nothing to show"
// state.
export default function Papierkorb({
  trashCount,
  trashOpen,
  trashConvs,
  trashLoading,
  onToggle,
  onRestore,
  onHardDelete,
}: PapierkorbProps) {
  if (trashCount === 0 && !trashOpen) return null

  return (
    <div style={s.trashSection}>
      <button
        style={s.trashToggle}
        onClick={onToggle}
      >
        <Trash size={13} style={{ marginRight: 5 }} />
        Papierkorb{trashCount > 0 ? ` (${trashCount})` : ''}
        {' '}{trashOpen ? '▴' : '▾'}
      </button>
      {trashOpen && (
        <div style={s.trashList}>
          {trashLoading ? (
            <div style={s.trashHint}>Wird geladen…</div>
          ) : trashConvs.length === 0 ? (
            <div style={s.trashHint}>Papierkorb ist leer.</div>
          ) : (
            <>
              <div style={s.trashHint}>Wird automatisch nach 30 Tagen geleert</div>
              {trashConvs.map((conv) => (
                <div key={conv.id} style={s.trashItem}>
                  <span style={s.trashItemTitle}>{conv.title ?? 'Unterhaltung'}</span>
                  <button style={s.trashRestoreBtn} onClick={() => onRestore(conv.id)} title="Wiederherstellen"><ArrowCounterClockwise size={12} /></button>
                  <button style={s.trashDeleteBtn} onClick={() => onHardDelete(conv.id)} title="Endgültig löschen"><X size={12} /></button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
