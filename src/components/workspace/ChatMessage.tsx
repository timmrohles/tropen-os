'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  CheckCircle, Warning, Lightbulb, Leaf,
  ChartBar, Wrench, ArrowRight,
} from '@phosphor-icons/react'
import type { ChatMessageType } from '@/hooks/useWorkspaceState'

interface ChatMessageProps {
  msg: ChatMessageType
  userInitial: string
}

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

// ─── Markdown components (stable reference) ───────────────────────────────────

const mdComponents = {
  code({ className, children, ...props }: React.ComponentProps<'code'>) {
    const match = /language-(\w+)/.exec(className ?? '')
    const isBlock = !!match
    return isBlock ? (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        customStyle={{ borderRadius: 6, fontSize: 13, margin: '8px 0' }}
      >{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
    ) : (
      <code className="cmsg-inline-code" {...props}>{children}</code>
    )
  },
}

// ─── Content renderer ─────────────────────────────────────────────────────────

function renderAssistantContent(content: string): React.ReactNode[] {
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

  lines.forEach((line, i) => {
    // Track code fences to avoid processing emoji inside code blocks
    if (line.startsWith('```')) inCodeBlock = !inCodeBlock

    if (!inCodeBlock) {
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
        return
      }
    }

    mdBuffer.push(line)
  })

  flushMd()
  return result
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatMessage({ msg, userInitial }: ChatMessageProps) {
  const isUser = msg.role === 'user'

  return (
    <div className={`cmsg${isUser ? ' cmsg--user' : ' cmsg--assistant'}`}>
      {!isUser && (
        <div className="cmsg-avatar-toro">🦜</div>
      )}

      <div className={`cmsg-bubble${isUser ? ' cmsg-bubble--user' : ' cmsg-bubble--assistant'}`}>
        <div className="cmsg-content">
          {isUser
            ? msg.content
            : renderAssistantContent(msg.content)
          }
        </div>
        {!isUser && msg.pending && (
          <span className="animate-pulse" style={{ opacity: 0.6 }}>▋</span>
        )}
        {!isUser && !msg.pending && msg.cost_eur != null && (
          <div className="cmsg-meta">€{msg.cost_eur.toFixed(4)} · {msg.model_used}</div>
        )}
      </div>

      {isUser && (
        <div className="cmsg-avatar-user">{userInitial}</div>
      )}
    </div>
  )
}
