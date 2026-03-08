'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ChatMessageType } from '@/hooks/useWorkspaceState'

interface ChatMessageProps {
  msg: ChatMessageType
  userInitial: string
}

export default function ChatMessage({ msg, userInitial }: ChatMessageProps) {
  const isUser = msg.role === 'user'

  return (
    <div className={`cmsg${isUser ? ' cmsg--user' : ' cmsg--assistant'}`}>
      {!isUser && (
        <div className="cmsg-avatar-toro">🦜</div>
      )}

      <div className={`cmsg-bubble${isUser ? ' cmsg-bubble--user' : ' cmsg-bubble--assistant'}`}>
        <div className="cmsg-content">
          {isUser ? (
            msg.content
          ) : (
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
                    <code className="cmsg-inline-code" {...props}>{children}</code>
                  )
                }
              }}
            >{msg.content}</ReactMarkdown>
          )}
        </div>
        {!isUser && !msg.pending && msg.cost_eur != null && (
          <div className="cmsg-meta">€{msg.cost_eur.toFixed(4)} · {msg.model_used}</div>
        )}
        {!isUser && msg.pending && (
          <span className="animate-pulse" style={{ opacity: 0.6 }}>▋</span>
        )}
      </div>

      {isUser && (
        <div className="cmsg-avatar-user">{userInitial}</div>
      )}
    </div>
  )
}
