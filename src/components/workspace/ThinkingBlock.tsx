'use client'

import React, { useState } from 'react'
import { Brain, CaretDown } from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ThinkingBlockProps {
  content: string
}

export default function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tokenEstimate = Math.round(content.length / 4)

  return (
    <div className="thinking-block">
      <button
        className="thinking-block-toggle"
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
      >
        <Brain size={13} weight="bold" aria-hidden="true" />
        <span>Gedanken</span>
        <span className="thinking-block-tokens">{tokenEstimate} Token</span>
        <CaretDown
          size={11}
          weight="bold"
          aria-hidden="true"
          style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        />
      </button>
      {isOpen && (
        <div className="thinking-block-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
