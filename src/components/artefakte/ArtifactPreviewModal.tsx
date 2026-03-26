'use client'

import { useEffect } from 'react'
import { X, ArrowSquareOut } from '@phosphor-icons/react'
import ArtifactRenderer from '@/components/workspace/ArtifactRenderer'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'

interface Artifact {
  id: string
  name: string
  type: string
  language: string | null
  content: string
  conversation_id: string
}

interface ArtifactPreviewModalProps {
  artifact: Artifact
  onClose: () => void
}

export function ArtifactPreviewModal({ artifact, onClose }: ArtifactPreviewModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const segment: ArtifactSegment = {
    segType: 'artifact',
    artifactType: artifact.type as ArtifactSegment['artifactType'],
    name: artifact.name,
    language: artifact.language ?? undefined,
    content: artifact.content,
  }

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{ zIndex: 499 }}
        aria-hidden="true"
      />
      <div
        className="artifact-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label={artifact.name}
      >
        <div className="artifact-preview-modal-header">
          <div className="artifact-preview-modal-title">
            <span className="artifact-preview-modal-type">
              {artifact.type.toUpperCase()}
            </span>
            <h2>{artifact.name}</h2>
          </div>
          <div className="artifact-preview-modal-actions">
            {artifact.conversation_id && (
              <a
                href={`/chat/${artifact.conversation_id}`}
                className="btn btn-ghost btn-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowSquareOut size={14} weight="bold" aria-hidden="true" />
                Im Chat öffnen
              </a>
            )}
            <button className="btn-icon" onClick={onClose} aria-label="Schließen">
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>
        <div className="artifact-preview-modal-body">
          <ArtifactRenderer
            artifact={segment}
            conversationId={artifact.conversation_id}
          />
        </div>
      </div>
    </>
  )
}
