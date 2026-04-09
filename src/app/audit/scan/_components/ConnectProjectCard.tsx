// src/app/audit/scan/_components/ConnectProjectCard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, WarningCircle } from '@phosphor-icons/react'
import ScanProgress from './ScanProgress'

type Phase = 'reading' | 'uploading' | 'analyzing'

interface ScanState {
  phase: Phase
  filesRead?: number
  message?: string
}

export default function ConnectProjectCard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scan, setScan] = useState<ScanState | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      setError('Dein Browser unterstützt die File System Access API nicht. Bitte Chrome oder Edge verwenden.')
      return
    }

    setError(null)
    setLoading(true)
    setScan(null)

    try {
      // 1. Ordner auswählen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'read' })

      // 2. Dateien lesen (lazy import — browser-only module)
      setScan({ phase: 'reading', filesRead: 0 })
      const { readDirectory } = await import('@/lib/file-access/directory-reader')
      const result = await readDirectory(handle, (filesRead) => {
        setScan({ phase: 'reading', filesRead })
      })

      // 3. Upload + Audit
      setScan({ phase: 'uploading', filesRead: result.files.length, message: `${result.files.length} Dateien werden übertragen…` })
      const res = await fetch('/api/projects/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: result.projectName, files: result.files }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Scan fehlgeschlagen (${res.status})`)
      }

      setScan({ phase: 'analyzing', message: 'Audit wird ausgewertet…' })
      const { runId, projectId } = await res.json() as { runId: string; projectId: string; score: number; findingsCount: number }

      // 4. Weiterleitung
      router.push(`/audit?project=${projectId}&runId=${runId}`)
    } catch (err) {
      // User cancelled picker → DOMException name 'AbortError'
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(null)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
      setLoading(false)
      setScan(null)
    }
  }

  return (
    <div className="card" style={{ padding: 32, textAlign: 'center' }}>
      <FolderOpen size={36} color="var(--accent)" weight="duotone" aria-hidden="true" />
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12, marginBottom: 6 }}>
        Externes Projekt verbinden
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 24px' }}>
        Wähle einen lokalen Projektordner. Dateien werden nur im Browser gelesen — nichts wird dauerhaft gespeichert.
      </p>

      {scan ? (
        <div style={{ maxWidth: 380, margin: '0 auto 16px' }}>
          <ScanProgress phase={scan.phase} filesRead={scan.filesRead} message={scan.message} />
        </div>
      ) : (
        <button
          className="btn btn-primary"
          onClick={handleConnect}
          disabled={loading}
        >
          <FolderOpen size={15} weight="bold" aria-hidden="true" />
          {loading ? 'Wird geladen…' : 'Ordner auswählen'}
        </button>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          marginTop: 16,
          padding: '10px 14px',
          background: 'rgba(var(--error-rgb, 220,38,38), 0.06)',
          border: '1px solid rgba(var(--error-rgb, 220,38,38), 0.15)',
          borderRadius: 8,
          textAlign: 'left',
          maxWidth: 480,
          marginInline: 'auto',
        }}>
          <WarningCircle size={16} color="var(--error, #dc2626)" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span style={{ fontSize: 13, color: 'var(--error, #dc2626)' }}>{error}</span>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 20 }}>
        Unterstützte Browser: Chrome 86+, Edge 86+
      </p>
    </div>
  )
}
