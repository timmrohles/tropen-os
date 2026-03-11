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
        <div className="modal-overlay">
          <div className="modal jm-loading-content" style={{ display: 'flex', flexDirection: 'column' }}>
            <Parrot size={52} />
            <div className="jm-loading-text">Toro durchforstet den Dschungel…</div>
            <div className="jm-pulse" />
          </div>
        </div>
      )}

      {/* ── Jungle: Struktur-Modal ── */}
      {jungleModal && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <Parrot size={28} />
              <span className="modal-title">Toros Vorschlag</span>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
            {jungleSummary && (
              <p className="jm-summary">"{jungleSummary}"</p>
            )}

            {/* Projekt-Ordner */}
            <div className="jm-folder-list">
              {jungleProjects.map((proj, i) => (
                <div
                  key={i}
                  className="jm-folder"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (jungleDragConv) onMoveConv(jungleDragConv, i) }}
                >
                  {/* Folder Header */}
                  <div className="jm-folder-header">
                    <Folder size={16} weight="duotone" style={{ color: 'var(--text-secondary)' }} />
                    <input
                      className="jm-folder-name-input"
                      value={jungleProjectName(i)}
                      onChange={(e) => onEditName(i, e.target.value)}
                      title="Klicken zum Umbenennen"
                    />
                    <button className="jm-folder-remove" onClick={() => onRemoveProject(i)} title="Ordner entfernen">×</button>
                  </div>
                  {/* Chats im Ordner */}
                  {proj.conversations.map((convId) => {
                    const conv = conversations.find((c) => c.id === convId)
                    if (!conv) return null
                    return (
                      <div
                        key={convId}
                        className="jm-conv-item"
                        draggable
                        onDragStart={() => onSetJungleDragConv(convId)}
                        onDragEnd={() => onSetJungleDragConv(null)}
                      >
                        <CheckSquare size={11} />
                        <span className="jm-conv-title">{conv.title ?? 'Unterhaltung'}</span>
                        <button
                          className="jm-conv-remove"
                          onClick={() => onRemoveConv(convId, i)}
                          title="Aus Ordner entfernen"
                        >×</button>
                      </div>
                    )
                  })}
                  {/* + Chat hinzufügen */}
                  <div className="jm-add-conv-wrap">
                    <button
                      className="jm-add-conv-btn"
                      onClick={() => onSetJungleAddConvOpen(jungleAddConvOpen === i ? null : i)}
                    >+ Chat hinzufügen ▾</button>
                    {jungleAddConvOpen === i && (
                      <div className="jm-add-conv-dropdown">
                        {conversations
                          .filter((c) => !jungleProjects.some((p) => p.conversations.includes(c.id)))
                          .map((c) => (
                            <button key={c.id} className="jm-add-conv-item" onClick={() => {
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
              <button className="jm-add-folder-btn" onClick={onAddFolder}>+ Neuen Ordner hinzufügen</button>
            </div>

            {/* Medien-Ordner Teaser */}
            <div className="jm-media-teaser">
              <span className="jm-media-teaser-title">🔒 Automatische Medien-Ordner – coming soon</span>
              <span className="jm-media-teaser-sub">
                Sobald Datei-Upload verfügbar, erkennt Toro automatisch 📸 Bilder, 📄 PDFs, 💻 Code
              </span>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="modal-btn-secondary" onClick={onClose}>Abbrechen</button>
              <button
                className={`modal-btn-primary${jungleSaving ? ' modal-btn-primary--saving' : ''}`}
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
