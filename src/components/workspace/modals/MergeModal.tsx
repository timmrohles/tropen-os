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
    <div className="modal-overlay" onClick={() => { if (!mergeLoading) onClose() }}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <Parrot size={28} />
          <span className="modal-title">Chats zusammenführen</span>
          {!mergeLoading && <button className="modal-close" onClick={onClose}>×</button>}
        </div>

        <div className="mm-body">
          {/* Lade-Zustand */}
          {mergeLoading && (
            <div className="mm-loading">
              <Parrot size={44} />
              <span className="mm-loading-text">Toro webt die Fäden zusammen…</span>
            </div>
          )}

          {/* Bereit-Zustand */}
          {mergeReady && !mergeLoading && (
            <>
              {/* Ausgewählte Chats */}
              <div className="mm-source-list">
                <div className="mm-section-label">Toro fasst diese {selectedArr.length} Unterhaltungen zusammen:</div>
                {[...selectedIds].map((id) => {
                  const conv = conversations.find((c) => c.id === id)
                  if (!conv) return null
                  const msgCount = 0 // Nachrichten-Anzahl wäre ein weiterer DB-Call
                  return (
                    <div key={id} className="mm-source-item">
                      <CheckSquare size={11} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <span className="mm-source-title">{conv.title ?? 'Unterhaltung'}</span>
                      {msgCount > 0 && <span className="mm-source-meta">({msgCount} Nachrichten)</span>}
                    </div>
                  )
                })}
              </div>

              <div className="mm-divider" />

              {/* Neuer Chat-Name */}
              <div className="mm-section-label">Neuer Chat-Name</div>
              <input
                className="mm-name-input"
                value={mergeTitle}
                onChange={(e) => onSetMergeTitle(e.target.value)}
                placeholder="Titel eingeben…"
              />

              {/* In Projekt ablegen */}
              <div className="mm-section-label mm-section-label--mt">In Projekt ablegen</div>
              <div className="mm-project-wrap">
                <button className="mm-project-btn" onClick={() => onSetMergeProjectDropOpen(!mergeProjectDropOpen)}>
                  {projects.find((p) => p.id === mergeProjectId)?.name ?? 'Kein Projekt'} ▾
                </button>
                {mergeProjectDropOpen && (
                  <div className="mm-project-dropdown">
                    <button className="mm-project-dropdown-item" onClick={() => { onSetMergeProjectId(null); onSetMergeProjectDropOpen(false) }}>
                      Kein Projekt
                    </button>
                    {projects.map((p) => (
                      <button key={p.id} className="mm-project-dropdown-item" onClick={() => { onSetMergeProjectId(p.id); onSetMergeProjectDropOpen(false) }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nach-Zusammenführung-Verhalten */}
              <div className="mm-section-label mm-section-label--mt">Originale nach Zusammenführung</div>
              {([ ['trash', 'In Papierkorb verschieben (30 Tage wiederherstellbar)'], ['keep', 'Behalten aber archivieren'], ['delete', 'Sofort löschen'] ] as [typeof mergeAfterAction, string][]).map(([val, label]) => (
                <label key={val} className="mm-radio-label">
                  <span className={`mm-radio-dot${mergeAfterAction === val ? ' mm-radio-dot--active' : ''}`}>
                    {mergeAfterAction === val ? '●' : '○'}
                  </span>
                  <span
                    className={`mm-radio-text${mergeAfterAction === val ? ' mm-radio-text--active' : ''}`}
                    onClick={() => onSetMergeAfterAction(val)}
                  >{label}</span>
                </label>
              ))}
            </>
          )}
        </div>

        {mergeReady && !mergeLoading && (
          <div className="modal-footer">
            <button className="modal-btn-secondary" onClick={onClose}>Abbrechen</button>
            <button
              className={`modal-btn-primary${!mergeTitle.trim() ? ' modal-btn-primary--invalid' : ''}`}
              disabled={!mergeTitle.trim()}
              onClick={onApply}
            >
              <Parrot size={14} /> Zusammenführen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
