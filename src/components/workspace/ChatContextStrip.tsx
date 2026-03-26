'use client'

import React from 'react'
import Link from 'next/link'
import { FolderOpen, Warning } from '@phosphor-icons/react'

interface ChatContextStripProps {
  projectName: string
  workspaceId?: string
  driftDetected?: boolean | null
}

// Shown above the chat input when a conversation is in 'focused' mode
// and has an active project. Displays the project name and a drift warning if set.
export default function ChatContextStrip({ projectName, workspaceId, driftDetected }: ChatContextStripProps) {
  return (
    <div className="chat-context-strip" role="status">
      <FolderOpen size={13} weight="fill" className="chat-context-strip__icon" aria-hidden="true" />
      <span className="chat-context-strip__label">Fokus:</span>
      <span className="chat-context-strip__project">{projectName}</span>

      {driftDetected && (
        <span className="chat-context-strip__drift" title="Der Chat weicht vom Projekt-Fokus ab">
          <Warning size={12} weight="fill" aria-hidden="true" />
          Abgedriftet
        </span>
      )}

      {workspaceId && (
        <Link
          href={`/workspaces/${workspaceId}`}
          className="chat-context-strip__link"
          tabIndex={0}
        >
          Workspace →
        </Link>
      )}
    </div>
  )
}
