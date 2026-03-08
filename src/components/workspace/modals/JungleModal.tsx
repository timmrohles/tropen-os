'use client'

import React from 'react'
import Parrot from '@/components/Parrot'
import { Folder, CheckSquare } from '@phosphor-icons/react'

interface JungleProject {
  name: string; emoji: string; conversations: string[]; reason: string
}

interface JungleModalProps {
  jungleLoading: boolean
  jungleModal: boolean
  jungleSummary: string
  jungleProjects: JungleProject[]
  jungleEditName: Record<number, string>
  jungleSaving: boolean
  jungleAddConvOpen: number | null
  jungleDragConv: string | null
  conversations: Array<{ id: string; title: string | null }>
  onClose: () => void
  onApply: () => void
  onEditName: (i: number, name: string) => void
  onMoveConv: (convId: string, toIndex: number) => void
  onRemoveConv: (convId: string, fromIndex: number) => void
  onRemoveProject: (i: number) => void
  onAddFolder: () => void
  onAddConvToFolder: (convId: string, folderIndex: number) => void
  onSetJungleDragConv: (id: string | null) => void
  onSetJungleAddConvOpen: (i: number | null) => void
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

  // ── Jungle-Struktur-Modal ─────────────────────────────────
  junglePulse: {
    width: 120, height: 3, borderRadius: 2, background: '#0d2926',
    position: 'relative', overflow: 'hidden',
  },
  jungleSummaryText: {
    fontSize: 13, color: '#888', fontStyle: 'italic',
    padding: '10px 20px 4px', margin: 0,
  },
  jungleFolderList: {
    flex: 1, overflowY: 'auto', padding: '12px 20px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  jungleFolder: {
    background: '#0e0e0e', border: '1px solid #1e1e1e',
    borderRadius: 8, padding: '10px 12px',
    transition: 'border-color 0.15s',
  },
  jungleFolderHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  jungleFolderNameInput: {
    flex: 1, background: 'transparent', border: 'none',
    borderBottom: '1px solid #2a2a2a', color: '#ccc',
    fontSize: 13, fontWeight: 600, outline: 'none', padding: '0 0 2px',
  },
  jungleFolderRemove: {
    background: 'none', border: 'none', color: '#3a3a3a',
    cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px',
  },
  jungleConvItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 6px', borderRadius: 5, cursor: 'grab',
    color: '#888', fontSize: 12,
  },
  jungleConvTitle: {
    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  jungleConvRemove: {
    background: 'none', border: 'none', color: '#333',
    cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px',
  },
  jungleAddConvBtn: {
    background: 'none', border: 'none', color: '#3a3a3a',
    fontSize: 11, cursor: 'pointer', padding: '4px 6px', marginTop: 4,
  },
  jungleAddConvDropdown: {
    position: 'absolute', top: '100%', left: 0, zIndex: 10,
    background: '#161616', border: '1px solid #252525',
    borderRadius: 7, padding: '4px 0', minWidth: 220,
    maxHeight: 180, overflowY: 'auto',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  jungleAddConvItem: {
    display: 'block', width: '100%', background: 'none', border: 'none',
    color: '#aaa', fontSize: 12, padding: '6px 14px',
    textAlign: 'left', cursor: 'pointer',
  },
  jungleAddFolderBtn: {
    background: 'none', border: '1px dashed #2a2a2a', color: '#444',
    borderRadius: 7, padding: '8px 14px', cursor: 'pointer',
    fontSize: 12, textAlign: 'left', marginTop: 2,
  },
  jungleMediaTeaser: {
    margin: '0 20px 4px', padding: '10px 14px',
    background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 7,
    display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
  },
}

export function JungleModal({
  jungleLoading,
  jungleModal,
  jungleSummary,
  jungleProjects,
  jungleEditName,
  jungleSaving,
  jungleAddConvOpen,
  jungleDragConv,
  conversations,
  onClose,
  onApply,
  onEditName,
  onMoveConv,
  onRemoveConv,
  onRemoveProject,
  onAddFolder,
  onAddConvToFolder,
  onSetJungleDragConv,
  onSetJungleAddConvOpen,
}: JungleModalProps) {
  const jungleProjectName = (i: number) => jungleEditName[i] ?? jungleProjects[i]?.name ?? ''

  return (
    <>
      {/* ── Jungle: Lade-Overlay ── */}
      {jungleLoading && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modal, alignItems: 'center', gap: 16, padding: '48px 40px' }}>
            <Parrot size={52} />
            <div style={{ fontSize: 16, color: '#14b8a6', fontWeight: 600 }}>
              Toro durchforstet den Dschungel…
            </div>
            <div style={s.junglePulse} />
          </div>
        </div>
      )}

      {/* ── Jungle: Struktur-Modal ── */}
      {jungleModal && (
        <div style={s.modalOverlay} onClick={onClose}>
          <div style={{ ...s.modal, maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={s.modalHeader}>
              <Parrot size={28} />
              <span style={s.modalTitle}>Toros Vorschlag</span>
              <button style={s.modalClose} onClick={onClose}>×</button>
            </div>
            {jungleSummary && (
              <p style={s.jungleSummaryText}>"{jungleSummary}"</p>
            )}

            {/* Projekt-Ordner */}
            <div style={s.jungleFolderList}>
              {jungleProjects.map((proj, i) => (
                <div
                  key={i}
                  style={s.jungleFolder}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (jungleDragConv) onMoveConv(jungleDragConv, i) }}
                >
                  {/* Folder Header */}
                  <div style={s.jungleFolderHeader}>
                    <Folder size={16} weight="duotone" style={{ color: '#14b8a6' }} />
                    <input
                      style={s.jungleFolderNameInput}
                      value={jungleProjectName(i)}
                      onChange={(e) => onEditName(i, e.target.value)}
                      title="Klicken zum Umbenennen"
                    />
                    <button style={s.jungleFolderRemove} onClick={() => onRemoveProject(i)} title="Ordner entfernen">×</button>
                  </div>
                  {/* Chats im Ordner */}
                  {proj.conversations.map((convId) => {
                    const conv = conversations.find((c) => c.id === convId)
                    if (!conv) return null
                    return (
                      <div
                        key={convId}
                        style={s.jungleConvItem}
                        draggable
                        onDragStart={() => onSetJungleDragConv(convId)}
                        onDragEnd={() => onSetJungleDragConv(null)}
                      >
                        <CheckSquare size={11} />
                        <span style={s.jungleConvTitle}>{conv.title ?? 'Unterhaltung'}</span>
                        <button
                          style={s.jungleConvRemove}
                          onClick={() => onRemoveConv(convId, i)}
                          title="Aus Ordner entfernen"
                        >×</button>
                      </div>
                    )
                  })}
                  {/* + Chat hinzufügen */}
                  <div style={{ position: 'relative' }}>
                    <button
                      style={s.jungleAddConvBtn}
                      onClick={() => onSetJungleAddConvOpen(jungleAddConvOpen === i ? null : i)}
                    >+ Chat hinzufügen ▾</button>
                    {jungleAddConvOpen === i && (
                      <div style={s.jungleAddConvDropdown}>
                        {conversations
                          .filter((c) => !jungleProjects.some((p) => p.conversations.includes(c.id)))
                          .map((c) => (
                            <button key={c.id} style={s.jungleAddConvItem} onClick={() => {
                              onAddConvToFolder(c.id, i)
                              onSetJungleAddConvOpen(null)
                            }}>{c.title ?? 'Unterhaltung'}</button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Neuen Ordner hinzufügen */}
              <button style={s.jungleAddFolderBtn} onClick={onAddFolder}>+ Neuen Ordner hinzufügen</button>
            </div>

            {/* Medien-Ordner Teaser */}
            <div style={s.jungleMediaTeaser}>
              <span style={{ fontSize: 12, color: '#3a3a3a' }}>🔒 Automatische Medien-Ordner – coming soon</span>
              <span style={{ fontSize: 11, color: '#2a2a2a', marginTop: 2 }}>
                Sobald Datei-Upload verfügbar, erkennt Toro automatisch 📸 Bilder, 📄 PDFs, 💻 Code
              </span>
            </div>

            {/* Footer */}
            <div style={s.modalFooter}>
              <button style={s.modalBtnSecondary} onClick={onClose}>Abbrechen</button>
              <button
                style={{ ...s.modalBtnPrimary, ...(jungleSaving ? { opacity: 0.6 } : {}) }}
                disabled={jungleSaving}
                onClick={onApply}
              >
                {jungleSaving ? 'Wird erstellt…' : '✓ Ordner erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
