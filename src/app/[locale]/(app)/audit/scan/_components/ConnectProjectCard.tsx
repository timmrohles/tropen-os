// src/app/audit/scan/_components/ConnectProjectCard.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { FolderOpen, WarningCircle } from '@phosphor-icons/react'
import ScanProgress from './ScanProgress'
import ProjectProfileStep from './ProjectProfileStep'
import type { DetectedStack } from '@/lib/file-access/stack-detector'
import type { ProjectProfile } from './ProjectProfileStep'
import type { ProjectFile } from '@/lib/file-access/types'

type ScanStep = 'idle' | 'reading' | 'profile' | 'scanning'

interface ReadState {
  filesRead?: number
  total?: number
  message?: string
}

export default function ConnectProjectCard() {
  const router = useRouter()
  const [step, setStep] = useState<ScanStep>('idle')
  const [readState, setReadState] = useState<ReadState>({})
  const [error, setError] = useState<string | null>(null)
  const [detectedStack, setDetectedStack] = useState<DetectedStack | null>(null)
  const filesRef = useRef<ProjectFile[]>([])
  const projectNameRef = useRef<string>('')

  async function handleConnect() {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      setError('Dein Browser unterstützt die File System Access API nicht. Bitte Chrome oder Edge verwenden.')
      return
    }

    setError(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'read' })
      projectNameRef.current = handle.name

      setStep('reading')
      setReadState({ filesRead: 0 })

      const { readDirectory } = await import('@/lib/file-access/directory-reader')
      const result = await readDirectory(handle, (current, total) => {
        setReadState({ filesRead: current, total })
      })

      filesRef.current = result.files

      const { detectStack } = await import('@/lib/file-access/stack-detector')
      const stack = detectStack(result.files)
      setDetectedStack(stack)
      setStep('profile')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStep('idle')
        return
      }
      setError(err instanceof Error ? err.message : String(err))
      setStep('idle')
    }
  }

  async function handleProfileConfirm(profile: ProjectProfile) {
    setError(null)
    setStep('scanning')
    setReadState({ message: `${filesRef.current.length} Dateien werden übertragen…` })

    try {
      const res = await fetch('/api/projects/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: profile.detectedStack.packageName ?? projectNameRef.current,
          files: filesRef.current,
          profile: {
            isPublic: profile.isPublic,
            liveUrl: profile.liveUrl,
            isLive: profile.isLive,
            audience: profile.audience,
            complianceRequirements: profile.complianceRequirements,
            notApplicableCategories: profile.notApplicableCategories,
            detectedStack: profile.detectedStack,
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `Scan fehlgeschlagen (${res.status})`)
      }

      const { runId, projectId } = await res.json() as { runId: string; projectId: string }
      router.push(`/audit?project=${projectId}&runId=${runId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStep('idle')
    }
  }

  function handleBack() {
    filesRef.current = []
    setDetectedStack(null)
    setReadState({})
    setStep('idle')
  }

  if (step === 'profile' && detectedStack) {
    return (
      <ProjectProfileStep
        detectedStack={detectedStack}
        onConfirm={handleProfileConfirm}
        onBack={handleBack}
      />
    )
  }

  return (
    <div className="card" style={{ padding: 32, textAlign: 'center' }}>
      <FolderOpen size={36} color="var(--accent)" weight="fill" aria-hidden="true" />
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12, marginBottom: 6 }}>
        Externes Projekt verbinden
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 24px' }}>
        Wähle einen lokalen Projektordner. Dateien werden nur im Browser gelesen — nichts wird dauerhaft gespeichert.
      </p>

      {step === 'reading' || step === 'scanning' ? (
        <div style={{ maxWidth: 380, margin: '0 auto 16px' }}>
          <ScanProgress
            phase={step === 'reading' ? 'reading' : 'uploading'}
            filesRead={readState.filesRead}
            message={readState.message}
          />
        </div>
      ) : (
        <button className="btn btn-primary" onClick={handleConnect}>
          <FolderOpen size={15} weight="bold" aria-hidden="true" />
          Ordner auswählen
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
