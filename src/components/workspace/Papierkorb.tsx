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
    <div className="papierkorb">
      <button className="papierkorb-toggle" onClick={onToggle}>
        <Trash size={13} weight="bold" />
        Papierkorb{trashCount > 0 ? ` (${trashCount})` : ''}
        {' '}{trashOpen ? '▴' : '▾'}
      </button>
      {trashOpen && (
        <div className="papierkorb-list">
          {trashLoading ? (
            <div className="papierkorb-hint">Wird geladen…</div>
          ) : trashConvs.length === 0 ? (
            <div className="papierkorb-hint">Papierkorb ist leer.</div>
          ) : (
            <>
              <div className="papierkorb-hint">Wird automatisch nach 30 Tagen geleert</div>
              {trashConvs.map((conv) => (
                <div key={conv.id} className="papierkorb-item">
                  <span className="papierkorb-item-title t-secondary">{conv.title ?? 'Unterhaltung'}</span>
                  <button className="papierkorb-restore" onClick={() => onRestore(conv.id)} title="Wiederherstellen"><ArrowCounterClockwise size={12} weight="bold" /></button>
                  <button className="papierkorb-delete" onClick={() => onHardDelete(conv.id)} title="Endgültig löschen"><X size={12} weight="bold" /></button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
