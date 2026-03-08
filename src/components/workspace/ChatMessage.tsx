'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ChatMessageType } from '@/hooks/useWorkspaceState'

interface ChatMessageProps {
  msg: ChatMessageType
}

const s: Record<string, React.CSSProperties> = {
  msg: { padding: '12px 20px' },
  msgUser: {
    maxWidth: '70%', alignSelf: 'flex-end',
    background: 'var(--bubble-user)',
    color: 'var(--bubble-user-text)',
    borderRadius: '18px 18px 4px 18px',
  },
  msgAssistant: {
    maxWidth: '85%', alignSelf: 'flex-start',
    background: 'var(--bubble-toro)',
    color: 'var(--bubble-toro-text)',
    borderRadius: '18px 18px 18px 4px',
  },
  msgContent: { fontSize: 16, lineHeight: 1.6 },
  inlineCode: {
    background: '#2a2a2a', border: '1px solid #3a3a3a',
    borderRadius: 4, padding: '1px 5px',
    fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)',
  },
  msgMeta: { fontSize: 13, color: 'var(--text-on-green-muted)', marginTop: 6 },
}

export default function ChatMessage({ msg }: ChatMessageProps) {
  return (
    <div style={{ ...s.msg, ...(msg.role === 'user' ? s.msgUser : s.msgAssistant) }}>
      {msg.role === 'user' ? (
        <div style={s.msgContent}>{msg.content}</div>
      ) : (
        <div style={s.msgContent}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
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
                  <code style={s.inlineCode} {...props}>{children}</code>
                )
              }
            }}
          >{msg.content}</ReactMarkdown>
          {msg.pending && <span className="animate-pulse" style={{ opacity: 0.6 }}>▋</span>}
        </div>
      )}
      {msg.role === 'assistant' && !msg.pending && msg.cost_eur != null && (
        <div style={s.msgMeta}>€{msg.cost_eur.toFixed(4)} · {msg.model_used}</div>
      )}
    </div>
  )
}
