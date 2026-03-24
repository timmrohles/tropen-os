'use client'

import React, { useEffect, useState } from 'react'
import { X } from '@phosphor-icons/react'

interface Avatar {
  id: string
  name: string
  emoji: string
  description: string | null
  system_prompt: string
  model_id: string
  context_default: string
}

interface AvatarFormDrawerProps {
  open: boolean
  avatar: Avatar | null   // null = create mode
  onClose: () => void
  onSaved: () => void
}

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Standard)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Schnell)' },
]

const CONTEXT_OPTIONS = [
  { value: 'last_5',  label: 'Letzte 5 Nachrichten' },
  { value: 'last_10', label: 'Letzte 10 Nachrichten' },
  { value: 'last_20', label: 'Letzte 20 Nachrichten' },
  { value: 'full',    label: 'Vollständig' },
  { value: 'none',    label: 'Kein Kontext' },
]

export default function AvatarFormDrawer({ open, avatar, onClose, onSaved }: AvatarFormDrawerProps) {
  const [name, setName]               = useState('')
  const [emoji, setEmoji]             = useState('🤖')
  const [description, setDescription] = useState('')
  const [systemPrompt, setPrompt]     = useState('')
  const [modelId, setModelId]         = useState('claude-sonnet-4-20250514')
  const [context, setContext]         = useState('last_10')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (avatar) {
      setName(avatar.name)
      setEmoji(avatar.emoji)
      setDescription(avatar.description ?? '')
      setPrompt(avatar.system_prompt)
      setModelId(avatar.model_id)
      setContext(avatar.context_default)
    } else {
      setName('')
      setEmoji('🤖')
      setDescription('')
      setPrompt('')
      setModelId('claude-sonnet-4-20250514')
      setContext('last_10')
    }
    setError(null)
  }, [avatar, open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const body = {
        name, emoji,
        description: description || null,
        system_prompt: systemPrompt,
        model_id: modelId,
        context_default: context,
      }
      const url    = avatar ? `/api/perspectives/avatars/${avatar.id}` : '/api/perspectives/avatars'
      const method = avatar ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Fehler' })) as { error: string }
        setError(data.error ?? 'Fehler beim Speichern')
        return
      }
      onSaved()
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={avatar ? 'Avatar bearbeiten' : 'Neuer Avatar'}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
          maxWidth: '100vw',
          background: 'var(--bg-surface-solid)',
          borderLeft: '1px solid var(--border-medium)',
          zIndex: 401,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {avatar ? 'Avatar bearbeiten' : 'Neuer Avatar'}
          </h2>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={e => setEmoji(e.target.value.slice(0, 4))}
                maxLength={4}
                required
                style={{
                  width: 52, height: 40, textAlign: 'center', fontSize: 22,
                  border: '1px solid var(--border-medium)', borderRadius: 8,
                  background: 'var(--bg-surface)', outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="av-name" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Name *</label>
              <input
                id="av-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={80}
                required
                placeholder="z.B. Kritiker"
                style={{
                  height: 40, padding: '0 10px', fontSize: 14,
                  border: '1px solid var(--border-medium)', borderRadius: 8,
                  background: 'var(--bg-surface)', outline: 'none', color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="av-desc" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Beschreibung</label>
            <input
              id="av-desc"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={300}
              placeholder="Kurze Beschreibung (optional)"
              style={{
                height: 38, padding: '0 10px', fontSize: 13,
                border: '1px solid var(--border-medium)', borderRadius: 8,
                background: 'var(--bg-surface)', outline: 'none', color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="av-prompt" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              System-Prompt * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(min. 10 Zeichen)</span>
            </label>
            <textarea
              id="av-prompt"
              value={systemPrompt}
              onChange={e => setPrompt(e.target.value)}
              minLength={10}
              maxLength={3000}
              required
              rows={6}
              placeholder="Du bist ein kritischer Analyst, der…"
              style={{
                padding: 10, fontSize: 13, lineHeight: 1.5, resize: 'vertical',
                border: '1px solid var(--border-medium)', borderRadius: 8,
                background: 'var(--bg-surface)', outline: 'none', color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="av-model" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Modell</label>
              <select
                id="av-model"
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                style={{
                  height: 38, padding: '0 8px', fontSize: 13,
                  border: '1px solid var(--border-medium)', borderRadius: 8,
                  background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
                }}
              >
                {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="av-context" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Standard-Kontext</label>
              <select
                id="av-context"
                value={context}
                onChange={e => setContext(e.target.value)}
                style={{
                  height: 38, padding: '0 8px', fontSize: 13,
                  border: '1px solid var(--border-medium)', borderRadius: 8,
                  background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
                }}
              >
                {CONTEXT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--error)', background: 'var(--error-bg)', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Abbrechen</button>
          <button
            className="btn btn-primary"
            type="submit"
            form="av-form"
            disabled={saving || !name.trim() || systemPrompt.length < 10}
            onClick={handleSubmit}
          >
            {saving ? 'Wird gespeichert…' : avatar ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </>
  )
}
