'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  CheckCircle, Warning, Lightbulb, Leaf,
  ChartBar, Wrench, ArrowRight, FloppyDisk,
} from '@phosphor-icons/react'
import { parseArtifacts } from '@/lib/chat/parse-artifacts'
import ArtifactRenderer from './ArtifactRenderer'
import WorkspaceActionCard from './WorkspaceActionCard'

const CodeBlock = dynamic(() => import('./CodeBlock'), { ssr: false })

// ─── Workspace action marker ──────────────────────────────────────────────

export const WORKSPACE_MARKER = /^\[TORO:WORKSPACE:(.+)\]$/

// ─── Icon map: emoji marker → Phosphor icon ─────────────────────────────────

export const ICON_MAP: Array<{ marker: string; icon: React.ReactNode }> = [
  { marker: '✅', icon: <CheckCircle size={15} weight="fill" className="cmsg-icon cmsg-icon--check" /> },
  { marker: '⚠️', icon: <Warning size={15} weight="fill" className="cmsg-icon cmsg-icon--warn" /> },
  { marker: '💡', icon: <Lightbulb size={15} weight="fill" className="cmsg-icon cmsg-icon--tip" /> },
  { marker: '🌱', icon: <Leaf size={15} weight="fill" className="cmsg-icon cmsg-icon--eco" /> },
  { marker: '📊', icon: <ChartBar size={15} weight="fill" className="cmsg-icon cmsg-icon--data" /> },
  { marker: '🔧', icon: <Wrench size={15} weight="fill" className="cmsg-icon cmsg-icon--tech" /> },
  { marker: '→',  icon: <ArrowRight size={15} weight="bold" className="cmsg-icon cmsg-icon--arrow" /> },
]

// ─── Markdown component factory (accepts artifact save callback) ───────────

export function makeMdComponents(
  onSaveArtifact?: (content: string, language: string | null) => void
) {
  return {
    code({ className, children, ...props }: React.ComponentProps<'code'>) {
      const match = /language-(\w+)/.exec(className ?? '')
      const isBlock = !!match
      const codeContent = String(children).replace(/\n$/, '')
      const language = match ? match[1] : null

      return isBlock ? (
        <div style={{ position: 'relative' }}>
          <CodeBlock language={language ?? undefined}>
            {codeContent}
          </CodeBlock>
          {onSaveArtifact && (
            <button
              onClick={() => onSaveArtifact(codeContent, language)}
              title="Als Artefakt speichern"
              style={{
                position: 'absolute',
                top: 16,
                right: 8,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 4,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.7)',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
              }}
            >
              <FloppyDisk size={12} />
              Speichern
            </button>
          )}
        </div>
      ) : (
        <code className="cmsg-inline-code" {...props}>{children}</code>
      )
    },
  }
}

// ─── Content renderer (accepts components factory result) ─────────────────

export interface ArtifactRenderProps {
  conversationId: string
  organizationId: string
  isInSplitView?: boolean
  messageId?: string
  onSaved?: () => void
  onSendDirect?: (text: string) => void
}

export function renderLines(
  content: string,
  mdComponents: ReturnType<typeof makeMdComponents>,
  keyPrefix = ''
): React.ReactNode[] {
  const lines = content.split('\n')
  const result: React.ReactNode[] = []
  let mdBuffer: string[] = []
  let inCodeBlock = false
  let bufferKey = 0

  const flushMd = () => {
    if (mdBuffer.length === 0) return
    const text = mdBuffer.join('\n')
    result.push(
      <ReactMarkdown key={`${keyPrefix}md-${bufferKey++}`} remarkPlugins={[remarkGfm]} components={mdComponents as never}>
        {text}
      </ReactMarkdown>
    )
    mdBuffer = []
  }

  for (const [i, line] of lines.entries()) {
    if (line.startsWith('```')) inCodeBlock = !inCodeBlock

    if (!inCodeBlock) {
      const wsMatch = WORKSPACE_MARKER.exec(line.trim())
      if (wsMatch) {
        flushMd()
        result.push(<WorkspaceActionCard key={`${keyPrefix}ws-${i}`} title={wsMatch[1].trim()} />)
        continue
      }

      const entry = ICON_MAP.find(({ marker }) => line.startsWith(marker))
      if (entry) {
        flushMd()
        const text = line.slice(entry.marker.length).trim()
        result.push(
          <div key={`${keyPrefix}icon-${i}`} className="cmsg-icon-line">
            {entry.icon}
            <span>{text}</span>
          </div>
        )
        continue
      }
    }

    mdBuffer.push(line)
  }

  flushMd()
  return result
}

export function renderAssistantContent(
  content: string,
  mdComponents: ReturnType<typeof makeMdComponents>,
  artifactProps?: ArtifactRenderProps
): React.ReactNode[] {
  if (!content.includes('<artifact')) {
    return renderLines(content, mdComponents)
  }

  const segments = parseArtifacts(content)
  const result: React.ReactNode[] = []

  segments.forEach((seg, i) => {
    if (seg.segType === 'text') {
      result.push(...renderLines(seg.content, mdComponents, `seg${i}-`))
    } else {
      result.push(
        <ArtifactRenderer
          key={`artifact-${i}`}
          artifact={seg}
          conversationId={artifactProps?.conversationId}
          organizationId={artifactProps?.organizationId}
          messageId={artifactProps?.messageId}
          onSaved={artifactProps?.onSaved}
          onSendDirect={artifactProps?.onSendDirect}
          isInSplitView={artifactProps?.isInSplitView}
        />
      )
    }
  })

  return result
}
