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
  userInitial: string
  onNewConversation: () => void
  onSetInput: (v: string) => void
  onSendMessage: (e: React.FormEvent) => void
}

export default function ChatArea({
  activeConvId,
  messages,
  input,
  sending,
  error,
  routing,
  messagesEndRef,
  userInitial,
  onNewConversation,
  onSetInput,
  onSendMessage,
}: ChatAreaProps) {
  return (
    <div className="carea">
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
          <div className="carea-messages">
            {messages.map((msg, i) => (
              <ChatMessage key={msg.id ?? i} msg={msg} userInitial={userInitial} />
            ))}
            {error && <div className="carea-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>
          {routing && (
            <div className="carea-routing-meta">
              <span>{routing.model}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.model_class}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.task_type}</span>
              <span className="carea-routing-dot">·</span>
              <span>🌱</span>
            </div>
          )}
          <div className="carea-input-wrap">
            <ChatInput input={input} setInput={onSetInput} sending={sending} onSubmit={onSendMessage} />
          </div>
        </>
      )}
    </div>
  )
}
