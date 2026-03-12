'use client'

import React from 'react'

interface ContextBarProps {
  percent: number  // 0-100
}

export default function ContextBar({ percent }: ContextBarProps) {
  if (percent < 5) return null
  const filled = Math.round(percent / 5)  // 0-20 blocks
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)
  const color = percent >= 85 ? 'var(--error, #dc2626)' : percent >= 60 ? '#f59e0b' : 'var(--accent)'
  return (
    <div style={{
      padding: '3px 16px',
      fontSize: 11,
      color: 'var(--text-tertiary)',
      fontFamily: 'monospace',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-nav)',
    }}>
      <span style={{ color, letterSpacing: -1 }}>{bar}</span>
      <span>{percent}% Context</span>
    </div>
  )
}
