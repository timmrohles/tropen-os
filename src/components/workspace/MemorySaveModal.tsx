'use client'

import React, { useState, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface MemorySaveModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  conversationId: string
}

type MemoryType = 'insight' | 'decision' | 'open_question' | 'fact'
type Importance = 'high' | 'medium' | 'low'
type Tab = 'ai' | 'manual'

const TYPE_LABELS: Record<MemoryType, string> = {
  insight: 'Erkenntnis',
  decision: 'Entscheidung',
  open_question: 'Offene Frage',
  fact: 'Fakt',
}

const IMPORTANCE_LABELS: Record<Importance, string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
}

export default function MemorySaveModal({ open, onClose, projectId, conversationId }: MemorySaveModalProps) {
  const [tab, setTab] = useState<Tab>('ai')
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  // Manual tab state
  const [type, setType] = useState<MemoryType>('insight')
  const [importance, setImportance] = useState<Importance>('medium')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [manualError, setManualError] = useState('')
  const [manualSuccess, setManualSuccess] = useState(false)

  // AI tab state
  const [aiPhase, setAiPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [aiSummary, setAiSummary] = useState('')
  const [aiError, setAiError] = useState('')

  // Reset on open
  useEffect(() => {
    if (open) {
      setTab('ai')
      setType('insight')
      setImportance('medium')
      setContent('')
      setTags('')
      setSaving(false)
      setManualError('')
      setManualSuccess(false)
      setAiPhase('idle')
      setAiSummary('')
      setAiError('')
    }
  }, [open])

  // Escape closes
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function loadAiSummary() {
    setAiPhase('loading')
    setAiError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/memory/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      })
      const data = await res.json() as { error?: string; content?: string }
      if (!res.ok) {
        setAiError(data.error ?? 'Zusammenfassung fehlgeschlagen')
        setAiPhase('error')
        return
      }
      setAiSummary(data.content ?? '')
      setAiPhase('done')
    } catch {
      setAiError('Netzwerkfehler')
      setAiPhase('error')
    }
  }

  async function saveManual() {
    if (!content.trim()) return
    setSaving(true)
    setManualError('')
    try {
      const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch(`/api/projects/${projectId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          importance,
          content: content.trim(),
          tags: tagArr,
          source_conversation_id: conversationId,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setManualError(data.error ?? 'Fehler beim Speichern')
        return
      }
      setManualSuccess(true)
      setTimeout(() => { setManualSuccess(false); onClose() }, 1200)
    } catch {
      setManualError('Netzwerkfehler')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,23,20,0.45)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-modal-title"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          width: 480,
          maxWidth: '92vw',
          maxHeight: '80vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span id="memory-modal-title" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              Ins Gedächtnis speichern
            </span>
            <button
              onClick={onClose}
              aria-label="Schließen"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1, padding: '0 2px',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex' }}>
            {(['ai', 'manual'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '7px 14px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'none',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  color: tab === t ? 'var(--accent)' : 'var(--text-tertiary)',
                  transition: 'color 0.15s',
                }}
              >
                {t === 'ai' ? 'AI-Zusammenfassung' : 'Manuell'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {tab === 'ai' && (
            <div>
              {aiPhase === 'idle' && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                    Die AI fasst dieses Gespräch zusammen und speichert die wichtigsten Erkenntnisse automatisch im Projekt-Gedächtnis.
                  </p>
                  <button className="btn btn-primary" onClick={loadAiSummary}>
                    Jetzt zusammenfassen
                  </button>
                </div>
              )}

              {aiPhase === 'loading' && (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 32 }}>
                  Zusammenfassung wird erstellt…
                </div>
              )}

              {aiPhase === 'done' && (
                <div>
                  <div style={{
                    background: 'var(--accent-light)',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 14,
                    color: 'var(--accent)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    ✓ Im Gedächtnis gespeichert
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                    {aiSummary}
                  </p>
                </div>
              )}

              {aiPhase === 'error' && (
                <div>
                  <p style={{ color: 'var(--error, #dc2626)', fontSize: 13, marginBottom: 16 }}>{aiError}</p>
                  <button className="btn btn-ghost btn-sm" onClick={loadAiSummary}>
                    Erneut versuchen
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Type */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                  Art
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(Object.keys(TYPE_LABELS) as MemoryType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`chip${type === t ? ' chip--active' : ''}`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Importance */}
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                  Wichtigkeit
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(Object.keys(IMPORTANCE_LABELS) as Importance[]).map((i) => (
                    <button
                      key={i}
                      onClick={() => setImportance(i)}
                      className={`chip${importance === i ? ' chip--active' : ''}`}
                    >
                      {IMPORTANCE_LABELS[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="memory-content"
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}
                >
                  Inhalt
                </label>
                <textarea
                  id="memory-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Was soll gespeichert werden?"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="memory-tags"
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}
                >
                  Tags{' '}
                  <span style={{ fontWeight: 400 }}>(kommagetrennt, optional)</span>
                </label>
                <input
                  id="memory-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="z.B. strategie, design, team"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {manualError && (
                <p style={{ color: 'var(--error, #dc2626)', fontSize: 13 }} aria-live="polite">{manualError}</p>
              )}
              {manualSuccess && (
                <p style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }} aria-live="polite">✓ Gespeichert</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            {tab === 'ai' && aiPhase === 'done' ? 'Schließen' : 'Abbrechen'}
          </button>
          {tab === 'manual' && (
            <button
              className="btn btn-primary"
              onClick={saveManual}
              disabled={saving || !content.trim()}
            >
              {saving ? 'Speichert…' : 'Speichern'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
