'use client'

import React, { useEffect, useState } from 'react'
import { LinkSimple, X, Check, Trash } from '@phosphor-icons/react'

interface ShareModalProps {
  convId: string
  convTitle: string | null
  onClose: () => void
}

export default function ShareModal({ convId, convTitle, onClose }: ShareModalProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/conversations/${convId}/share`, { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setToken(data?.share_token ?? null))
      .finally(() => setLoading(false))
  }, [convId])

  const shareUrl = token ? `${window.location.origin}/s/${token}` : ''

  function handleCopy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleRevoke() {
    setRevoking(true)
    await fetch(`/api/conversations/${convId}/share`, { method: 'DELETE' })
    setToken(null)
    setRevoking(false)
    onClose()
  }

  const s: Record<string, React.CSSProperties> = {
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: 'var(--bg-surface)', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    title: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
    sub: { fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 },
    row: { display: 'flex', gap: 8, alignItems: 'center' },
    urlBox: { flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    footer: { marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    hint: { fontSize: 11, color: 'var(--text-tertiary)' },
  }

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <p style={s.title}>
            <LinkSimple size={15} weight="bold" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Chat teilen
          </p>
          <button className="btn-icon" onClick={onClose} aria-label="Schließen">
            <X size={16} weight="bold" />
          </button>
        </div>
        <p style={s.sub}>
          {convTitle ? `„${convTitle}"` : 'Dieser Chat'} ist für alle Mitglieder deiner Organisation sichtbar.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Link wird erstellt…</p>
        ) : token ? (
          <>
            <div style={s.row}>
              <div style={s.urlBox}>{shareUrl}</div>
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? <Check size={14} weight="bold" /> : <LinkSimple size={14} weight="bold" />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
            <div style={s.footer}>
              <span style={s.hint}>Nur für Org-Mitglieder zugänglich</span>
              <button className="btn btn-ghost" onClick={handleRevoke} disabled={revoking}>
                <Trash size={14} weight="bold" />
                {revoking ? 'Widerrufe…' : 'Freigabe aufheben'}
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Fehler beim Erstellen des Links.</p>
        )}
      </div>
    </div>
  )
}
