'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, CheckCircle } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import { buildFixPrompt, buildGroupFixPrompt } from '@/lib/audit/prompt-export'
import type { PromptFinding, ToolTarget } from '@/lib/audit/prompt-export'

// Single tool target — no tabs needed
const DEFAULT_TOOL: ToolTarget = 'generic'

interface GroupPromptProps {
  mode: 'group'
  ruleId: string
  baseMessage: string
  affectedFiles: string[]
}

interface SinglePromptProps {
  mode: 'single'
  finding: PromptFinding
}

export type FixPromptDrawerProps = {
  open: boolean
  onClose: () => void
} & (GroupPromptProps | SinglePromptProps)

export default function FixPromptDrawer(props: FixPromptDrawerProps) {
  const { open, onClose } = props
  const t = useTranslations('audit')
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Escape closes
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Focus trap: focus drawer on open
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus()
    }
  }, [open])

  const prompt = props.mode === 'group'
    ? buildGroupFixPrompt(props.ruleId, props.baseMessage, props.affectedFiles, DEFAULT_TOOL)
    : buildFixPrompt(props.finding, DEFAULT_TOOL)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => { /* ignore */ })
  }, [prompt.content])

  if (!mounted) return null

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(26,23,20,0.45)',
          backdropFilter: 'blur(2px)',
          animation: open ? 'fadeIn 200ms ease-out' : undefined,
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('fixPrompt')}
        tabIndex={-1}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(520px, 100vw)',
          zIndex: 401,
          background: 'var(--bg-surface-solid)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(26,23,20,0.10)',
          animation: open ? 'slideInRight 200ms ease-out' : undefined,
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('fixPrompt')}
          </span>
          <button
            onClick={onClose}
            aria-label={t('close')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', borderRadius: 4,
              color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Prompt hint */}
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
            {t('drawerHint')}
          </p>
        </div>

        {/* Prompt content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <pre style={{
            fontSize: 12, lineHeight: 1.6,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono, monospace)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0,
            background: 'rgba(26,23,20,0.03)',
            padding: '12px 14px', borderRadius: 6,
          }}>
            {prompt.content}
          </pre>
        </div>

        {/* Footer: copy button */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          flexShrink: 0, display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            className="btn btn-primary"
            onClick={handleCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {copied
              ? <CheckCircle size={14} weight="fill" aria-hidden="true" />
              : <Copy        size={14} weight="bold"  aria-hidden="true" />}
            {copied ? t('copied') : t('prompt')}
          </button>
        </div>
      </div>
    </>
  )

  if (!props.open) return null
  return createPortal(drawerContent, document.body)
}
