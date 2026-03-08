'use client'

import React from 'react'
import type { ChatMessageType } from '@/hooks/useWorkspaceState'
import EmptyState from './EmptyState'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface ChatAreaProps {
  activeConvId: string | null
  messages: ChatMessageType[]
  input: string
  sending: boolean
  error: string
  routing: { task_type: string; agent: string; model_class: string; model: string } | null
  messagesEndRef: React.RefObject<HTMLDivElement>
  onNewConversation: () => void
  onSetInput: (v: string) => void
  onSendMessage: (e: React.FormEvent) => void
}

const s: Record<string, React.CSSProperties> = {
  chat: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-chat)' },
  messages: {
    flex: 1, overflowY: 'auto', padding: '24px 48px',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  routingMeta: {
    padding: '4px 48px 0',
    fontSize: 13, color: 'var(--text-on-green-muted)',
    display: 'flex', gap: 8, alignItems: 'center',
  },
  errorMsg: {
    fontSize: 13, color: '#ef4444', alignSelf: 'center',
    background: '#1a0000', border: '1px solid #3a0000',
    padding: '8px 16px', borderRadius: 6,
  },
  inputContainer: {
    padding: '12px 48px 24px',
    borderTop: '1px solid #1a1a1a',
    background: 'var(--bg-chat)',
    flexShrink: 0,
  },
}

export default function ChatArea({
  activeConvId,
  messages,
  input,
  sending,
  error,
  routing,
  messagesEndRef,
  onNewConversation,
  onSetInput,
  onSendMessage,
}: ChatAreaProps) {
  return (
    <div style={s.chat}>
      {!activeConvId ? (
        <EmptyState
          onNewConversation={onNewConversation}
          input={input}
          setInput={onSetInput}
          sending={sending}
          onSubmit={onSendMessage}
        />
      ) : (
        <>
          <div style={s.messages}>
            {messages.map((msg, i) => (
              <ChatMessage key={msg.id ?? i} msg={msg} />
            ))}
            {error && <div style={s.errorMsg}>{error}</div>}
            <div ref={messagesEndRef} />
          </div>
          {routing && (
            <div style={s.routingMeta}>
              <span>{routing.model}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{routing.model_class}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{routing.task_type}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>🌱</span>
            </div>
          )}
          <div style={s.inputContainer}>
            <ChatInput input={input} setInput={onSetInput} sending={sending} onSubmit={onSendMessage} />
          </div>
        </>
      )}
    </div>
  )
}
