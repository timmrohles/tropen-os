'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  CheckCircle, Warning, Lightbulb, Leaf,
  ChartBar, Wrench, ArrowRight,
  BookmarkSimple, FloppyDisk, ThumbsDown,
  SquaresFour,
} from '@phosphor-icons/react'
import type { ChatMessageType } from '@/hooks/useWorkspaceState'
import ParrotIcon from '@/components/ParrotIcon'
import { SaveArtifactModal } from './SaveArtifactModal'

interface ChatMessageProps {
  msg: ChatMessageType
  userInitial: string
  conversationId?: string
  organizationId?: string
  bookmarkedIds?: Set<string>
  onBookmarkChange?: (messageId: string, bookmarked: boolean) => void
  onArtifactSaved?: () => void
}

// ─── Workspace action marker ──────────────────────────────────────────────

const WORKSPACE_MARKER = /^\[TORO:WORKSPACE:(.+)\]$/

// ─── Icon map: emoji marker → Phosphor icon ─────────────────────────────────

const ICON_MAP: Array<{ marker: string; icon: React.ReactNode }> = [
  { marker: '✅', icon: <CheckCircle size={15} weight="fill" className="cmsg-icon cmsg-icon--check" /> },
  { marker: '⚠️', icon: <Warning size={15} weight="fill" className="cmsg-icon cmsg-icon--warn" /> },
  { marker: '💡', icon: <Lightbulb size={15} weight="fill" className="cmsg-icon cmsg-icon--tip" /> },
  { marker: '🌱', icon: <Leaf size={15} weight="fill" className="cmsg-icon cmsg-icon--eco" /> },
  { marker: '📊', icon: <ChartBar size={15} weight="fill" className="cmsg-icon cmsg-icon--data" /> },
  { marker: '🔧', icon: <Wrench size={15} weight="fill" className="cmsg-icon cmsg-icon--tech" /> },
  { marker: '→',  icon: <ArrowRight size={15} weight="bold" className="cmsg-icon cmsg-icon--arrow" /> },
]

// ─── Workspace action card ────────────────────────────────────────────────

function WorkspaceActionCard({ title }: { title: string }) {
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

// ─── Markdown component factory (accepts artifact save callback) ───────────

function makeMdComponents(
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
          <SyntaxHighlighter
            style={oneDark}
            language={language ?? undefined}
            PreTag="div"
            customStyle={{ borderRadius: 6, fontSize: 13, margin: '8px 0' }}
          >
            {codeContent}
          </SyntaxHighlighter>
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

function renderAssistantContent(
  content: string,
  mdComponents: ReturnType<typeof makeMdComponents>
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
      <ReactMarkdown key={`md-${bufferKey++}`} remarkPlugins={[remarkGfm]} components={mdComponents as never}>
        {text}
      </ReactMarkdown>
    )
    mdBuffer = []
  }

  for (const [i, line] of lines.entries()) {
    if (line.startsWith('```')) inCodeBlock = !inCodeBlock

    if (!inCodeBlock) {
      // Workspace action marker
      const wsMatch = WORKSPACE_MARKER.exec(line.trim())
      if (wsMatch) {
        flushMd()
        result.push(<WorkspaceActionCard key={`ws-${i}`} title={wsMatch[1].trim()} />)
        continue
      }

      const entry = ICON_MAP.find(({ marker }) => line.startsWith(marker))
      if (entry) {
        flushMd()
        const text = line.slice(entry.marker.length).trim()
        result.push(
          <div key={`icon-${i}`} className="cmsg-icon-line">
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatMessage({
  msg,
  userInitial,
  conversationId,
  organizationId,
  bookmarkedIds,
  onBookmarkChange,
  onArtifactSaved,
}: ChatMessageProps) {
  const isUser = msg.role === 'user'
  const isBookmarked = msg.id ? (bookmarkedIds?.has(msg.id) ?? false) : false
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [saveModal, setSaveModal] = useState<{ content: string; language: string | null } | null>(null)
  const [flagState, setFlagState] = useState<'idle' | 'confirm' | 'done'>('idle')
  const [flagReason, setFlagReason] = useState('')

  const showActions = !isUser && !msg.pending && !!conversationId && !!msg.id

  async function handleBookmark() {
    if (!msg.id || !conversationId || bookmarkLoading) return
    setBookmarkLoading(true)
    try {
      if (isBookmarked) {
        await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: msg.id }),
        })
        onBookmarkChange?.(msg.id, false)
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: msg.id,
            conversationId,
            contentPreview: msg.content.slice(0, 200),
          }),
        })
        onBookmarkChange?.(msg.id, true)
      }
    } finally {
      setBookmarkLoading(false)
    }
  }

  async function handleFlag() {
    if (!msg.id || flagState !== 'confirm') return
    await fetch(`/api/messages/${msg.id}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: flagReason }),
    })
    setFlagState('done')
    setFlagReason('')
  }

  function handleSaveArtifact(content: string, language: string | null) {
    if (!conversationId || !organizationId) return
    setSaveModal({ content, language })
  }

  const mdComponents = makeMdComponents(
    showActions && organizationId ? handleSaveArtifact : undefined
  )

  return (
    <>
      <div className={`cmsg${isUser ? ' cmsg--user' : ' cmsg--assistant'}`}>
        {!isUser && (
          <div className="cmsg-avatar-toro"><ParrotIcon size={22} /></div>
        )}

        <div className={`cmsg-bubble${isUser ? ' cmsg-bubble--user' : ' cmsg-bubble--assistant'}`}>
          <div className="cmsg-content">
            {isUser
              ? msg.content
              : renderAssistantContent(msg.content, mdComponents)
            }
          </div>
          {!isUser && msg.pending && (
            <span className="animate-pulse" style={{ opacity: 0.6 }}>▋</span>
          )}
          {!isUser && !msg.pending && msg.cost_eur != null && (
            <div className="cmsg-meta">€{msg.cost_eur.toFixed(4)} · {msg.model_used}</div>
          )}
          {!isUser && !msg.pending && (
            <div className="cmsg-ki-label" aria-label="KI-generierter Inhalt gemäß Art. 50 KI-VO">
              KI-generiert · Toro
            </div>
          )}

          {showActions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <button
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                title={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}
                aria-label={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: bookmarkLoading ? 'default' : 'pointer',
                  color: isBookmarked ? 'var(--accent)' : 'var(--text-muted)',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: bookmarkLoading ? 0.5 : 1,
                  transition: 'color 150ms',
                }}
              >
                <BookmarkSimple size={14} weight={isBookmarked ? 'fill' : 'regular'} />
              </button>

              {flagState === 'done' ? (
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 2 }}>Gemeldet</span>
              ) : (
                <button
                  onClick={() => setFlagState(s => s === 'confirm' ? 'idle' : 'confirm')}
                  title="Antwort als fehlerhaft melden (Art. 14 KI-VO)"
                  aria-label="Antwort als fehlerhaft melden"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: flagState === 'confirm' ? '#f87171' : 'var(--text-muted)',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 150ms',
                  }}
                >
                  <ThumbsDown size={14} weight={flagState === 'confirm' ? 'fill' : 'regular'} />
                </button>
              )}
            </div>
          )}

          {flagState === 'confirm' && showActions && (
            <div style={{
              marginTop: 8,
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Diese Antwort als fehlerhaft oder unangemessen melden (Art. 14 EU AI Act)?
              </p>
              <input
                placeholder="Grund (optional)"
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                style={{
                  background: 'var(--bg-input, var(--bg-base))',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 8px',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleFlag}
                  style={{
                    background: 'var(--error)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 12px',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Melden
                </button>
                <button
                  onClick={() => { setFlagState('idle'); setFlagReason('') }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '5px 12px',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {isUser && (
          <div className="cmsg-avatar-user">{userInitial}</div>
        )}
      </div>

      {saveModal && conversationId && organizationId && (
        <SaveArtifactModal
          content={saveModal.content}
          language={saveModal.language}
          conversationId={conversationId}
          organizationId={organizationId}
          onDone={() => {
            setSaveModal(null)
            onArtifactSaved?.()
          }}
          onCancel={() => setSaveModal(null)}
        />
      )}
    </>
  )
}
