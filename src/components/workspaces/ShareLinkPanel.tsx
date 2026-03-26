'use client'

import { useState } from 'react'
import { Link, Copy, Check } from '@phosphor-icons/react'

type ShareState = {
  share_token: string | null
  share_role: string
  share_active: boolean
}

export default function ShareLinkPanel({ workspaceId, initial }: {
  workspaceId: string
  initial: ShareState
}) {
  const [share, setShare] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = share.share_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${share.share_token}`
    : null

  async function toggle(active: boolean) {
    setSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active, role: share.share_role }),
      })
      if (res.ok) {
        const data = await res.json()
        setShare({ share_token: data.share_token, share_role: data.share_role, share_active: data.share_active })
      }
    } finally {
      setSaving(false)
    }
  }

  async function copy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link size={16} weight="bold" color="var(--text-secondary)" aria-hidden="true" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Freigabe-Link</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: saving ? 'wait' : 'pointer' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {share.share_active ? 'Aktiv' : 'Deaktiviert'}
          </span>
          <div
            role="switch"
            aria-checked={share.share_active}
            style={{
              width: 36, height: 20, borderRadius: 999,
              background: share.share_active ? 'var(--accent)' : 'var(--toggle-off)',
              position: 'relative', cursor: saving ? 'wait' : 'pointer',
              transition: 'background 0.2s',
            }}
            onClick={() => !saving && toggle(!share.share_active)}
          >
            <div style={{
              position: 'absolute', top: 2, left: share.share_active ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: 'white', transition: 'left 0.2s',
            }} />
          </div>
        </label>
      </div>

      {share.share_active && shareUrl && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            readOnly
            value={shareUrl}
            style={{
              flex: 1, padding: '7px 10px',
              border: '1px solid var(--border)',
              borderRadius: 6, background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)', fontSize: 12,
              outline: 'none', fontFamily: 'var(--font-mono, monospace)',
            }}
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button className="btn btn-ghost btn-sm" onClick={copy} aria-label="Link kopieren">
            {copied
              ? <><Check size={13} weight="bold" aria-hidden="true" /> Kopiert</>
              : <><Copy size={13} weight="bold" aria-hidden="true" /> Kopieren</>
            }
          </button>
        </div>
      )}

      {share.share_active && (
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, marginBottom: 0 }}>
          Jeder mit diesem Link kann den Workspace als {share.share_role === 'commenter' ? 'Kommentator' : 'Leser'} ansehen.
        </p>
      )}
    </div>
  )
}
