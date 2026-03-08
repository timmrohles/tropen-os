'use client'

import React from 'react'
import Parrot from '@/components/Parrot'
import { CheckSquare } from '@phosphor-icons/react'

interface MergeModalProps {
  mergeModal: boolean
  mergeLoading: boolean
  mergeReady: boolean
  mergeTitle: string
  mergeAfterAction: 'trash' | 'keep' | 'delete'
  mergeProjectId: string | null
  mergeProjectDropOpen: boolean
  projects: Array<{ id: string; name: string }>
  selectedIds: Set<string>
  conversations: Array<{ id: string; title: string | null }>
  selectedArr: string[]
  onClose: () => void
  onApply: () => void
  onSetMergeTitle: (v: string) => void
  onSetMergeAfterAction: (v: 'trash' | 'keep' | 'delete') => void
  onSetMergeProjectId: (id: string | null) => void
  onSetMergeProjectDropOpen: (v: boolean) => void
}

const s: Record<string, React.CSSProperties> = {
  // ── Modals ───────────────────────────────────────────────
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 400, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#111', border: '1px solid #222', borderRadius: 12,
    width: '90%', maxWidth: 560, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '18px 20px 14px', borderBottom: '1px solid #1e1e1e', flexShrink: 0,
  },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: 700, color: '#e5e5e5' },
  modalClose: {
    background: 'none', border: 'none', color: '#444',
    fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 2px',
  },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '14px 20px', borderTop: '1px solid #1e1e1e', flexShrink: 0,
  },
  modalBtnPrimary: {
    background: '#14b8a6', color: '#000', border: 'none',
    padding: '10px 20px', borderRadius: 7, cursor: 'pointer',
    fontSize: 13, fontWeight: 700,
  },
  modalBtnSecondary: {
    background: 'none', color: '#555', border: '1px solid #2a2a2a',
    padding: '10px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
  },

  // ── Merge-Modal ──────────────────────────────────────────
  mergeSourceList: { marginBottom: 12 },
  mergeSectionLabel: { fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  mergeSourceItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' },
  mergeSourceTitle: { flex: 1, fontSize: 13, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  mergeSourceMeta: { fontSize: 11, color: '#444', flexShrink: 0 },
  mergeDivider: { height: 1, background: '#1e1e1e', margin: '12px 0' },
  mergeNameInput: {
    width: '100%', background: '#0e0e0e', border: '1px solid #2a2a2a',
    color: '#e5e5e5', padding: '10px 12px', borderRadius: 7,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  mergeProjectBtn: {
    background: '#0e0e0e', border: '1px solid #2a2a2a', color: '#888',
    padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
    textAlign: 'left',
  },
  mergeRadioLabel: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' },

  // ── Action Dropdown (used in merge project selector) ──────
  actionDropdown: {
    position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
    background: '#161616', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '4px 0', minWidth: 160,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  actionDropdownItem: {
    display: 'block', width: '100%', background: 'none', border: 'none',
    color: '#aaa', fontSize: 12, padding: '7px 14px',
    textAlign: 'left', cursor: 'pointer',
  },
}

export function MergeModal({
  mergeModal,
  mergeLoading,
  mergeReady,
  mergeTitle,
  mergeAfterAction,
  mergeProjectId,
  mergeProjectDropOpen,
  projects,
  selectedIds,
  conversations,
  selectedArr,
  onClose,
  onApply,
  onSetMergeTitle,
  onSetMergeAfterAction,
  onSetMergeProjectId,
  onSetMergeProjectDropOpen,
}: MergeModalProps) {
  if (!mergeModal) return null

  return (
    <div style={s.modalOverlay} onClick={() => { if (!mergeLoading) onClose() }}>
      <div style={{ ...s.modal, maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <Parrot size={28} />
          <span style={s.modalTitle}>Chats zusammenführen</span>
          {!mergeLoading && <button style={s.modalClose} onClick={onClose}>×</button>}
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Lade-Zustand */}
          {mergeLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
              <Parrot size={44} />
              <span style={{ fontSize: 14, color: '#14b8a6', fontWeight: 600 }}>Toro webt die Fäden zusammen…</span>
            </div>
          )}

          {/* Bereit-Zustand */}
          {mergeReady && !mergeLoading && (
            <>
              {/* Ausgewählte Chats */}
              <div style={s.mergeSourceList}>
                <div style={s.mergeSectionLabel}>Toro fasst diese {selectedArr.length} Unterhaltungen zusammen:</div>
                {[...selectedIds].map((id) => {
                  const conv = conversations.find((c) => c.id === id)
                  if (!conv) return null
                  const msgCount = 0 // Nachrichten-Anzahl wäre ein weiterer DB-Call
                  return (
                    <div key={id} style={s.mergeSourceItem}>
                      <CheckSquare size={11} style={{ color: '#14b8a6' }} />
                      <span style={s.mergeSourceTitle}>{conv.title ?? 'Unterhaltung'}</span>
                      {msgCount > 0 && <span style={s.mergeSourceMeta}>({msgCount} Nachrichten)</span>}
                    </div>
                  )
                })}
              </div>

              <div style={s.mergeDivider} />

              {/* Neuer Chat-Name */}
              <div style={s.mergeSectionLabel}>Neuer Chat-Name</div>
              <input
                style={s.mergeNameInput}
                value={mergeTitle}
                onChange={(e) => onSetMergeTitle(e.target.value)}
                placeholder="Titel eingeben…"
              />

              {/* In Projekt ablegen */}
              <div style={{ ...s.mergeSectionLabel, marginTop: 14 }}>In Projekt ablegen</div>
              <div style={{ position: 'relative' }}>
                <button style={s.mergeProjectBtn} onClick={() => onSetMergeProjectDropOpen(!mergeProjectDropOpen)}>
                  {projects.find((p) => p.id === mergeProjectId)?.name ?? 'Kein Projekt'} ▾
                </button>
                {mergeProjectDropOpen && (
                  <div style={{ ...s.actionDropdown, top: '100%', bottom: 'auto', marginTop: 4 }}>
                    <button style={s.actionDropdownItem} onClick={() => { onSetMergeProjectId(null); onSetMergeProjectDropOpen(false) }}>
                      Kein Projekt
                    </button>
                    {projects.map((p) => (
                      <button key={p.id} style={s.actionDropdownItem} onClick={() => { onSetMergeProjectId(p.id); onSetMergeProjectDropOpen(false) }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nach-Zusammenführung-Verhalten */}
              <div style={{ ...s.mergeSectionLabel, marginTop: 14 }}>Originale nach Zusammenführung</div>
              {([ ['trash', '○ In Papierkorb verschieben (30 Tage wiederherstellbar)'], ['keep', '○ Behalten aber archivieren'], ['delete', '○ Sofort löschen'] ] as [typeof mergeAfterAction, string][]).map(([val, label]) => (
                <label key={val} style={s.mergeRadioLabel}>
                  <span style={{ color: mergeAfterAction === val ? '#14b8a6' : '#555', fontSize: 13 }}>
                    {mergeAfterAction === val ? '●' : '○'}
                  </span>
                  <span
                    style={{ fontSize: 13, color: mergeAfterAction === val ? '#ccc' : '#666', cursor: 'pointer' }}
                    onClick={() => onSetMergeAfterAction(val)}
                  >{label.slice(2)}</span>
                </label>
              ))}
            </>
          )}
        </div>

        {mergeReady && !mergeLoading && (
          <div style={s.modalFooter}>
            <button style={s.modalBtnSecondary} onClick={onClose}>Abbrechen</button>
            <button
              style={{ ...s.modalBtnPrimary, ...(!mergeTitle.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : {}) }}
              disabled={!mergeTitle.trim()}
              onClick={onApply}
            >
              <Parrot size={14} style={{ marginRight: 5 }} /> Zusammenführen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
