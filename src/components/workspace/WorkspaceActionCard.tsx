'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SquaresFour } from '@phosphor-icons/react'

export default function WorkspaceActionCard({ title }: { title: string }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const ws = await res.json()
      setCreated(true)
      router.push(`/ws/${ws.id}/canvas`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setCreating(false)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--accent-light)',
      border: '1px solid var(--accent)',
      borderRadius: 8, padding: '10px 14px',
      marginTop: 8,
    }}>
      <SquaresFour size={18} color="var(--accent)" weight="fill" aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', margin: '0 0 1px' }}>
          Neuer Workspace
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </p>
        {error && <p style={{ fontSize: 11, color: 'var(--error)', margin: '2px 0 0' }}>{error}</p>}
      </div>
      <button
        type="button"
        onClick={() => void handleCreate()}
        disabled={creating || created}
        style={{
          background: created ? 'transparent' : 'var(--accent)',
          border: created ? '1px solid var(--accent)' : 'none',
          borderRadius: 6,
          padding: '6px 14px',
          color: created ? 'var(--accent)' : '#fff',
          fontSize: 12, fontWeight: 600,
          cursor: creating || created ? 'default' : 'pointer',
          opacity: creating ? 0.7 : 1,
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {creating ? 'Erstelle…' : created ? '↗ Geöffnet' : 'Workspace erstellen →'}
      </button>
    </div>
  )
}
