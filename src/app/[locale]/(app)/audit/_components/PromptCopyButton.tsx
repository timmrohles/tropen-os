'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Copy, CheckCircle, CaretDown } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import { buildFixPrompt } from '@/lib/audit/prompt-export'
import type { PromptFinding, ToolTarget } from '@/lib/audit/prompt-export'

const STORAGE_KEY = 'audit-prompt-tool-preference'

function getSavedTool(): ToolTarget {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'cursor' || v === 'claude-code' || v === 'generic') return v
  } catch { /* ignore */ }
  return 'cursor'
}

function saveTool(tool: ToolTarget) {
  try { localStorage.setItem(STORAGE_KEY, tool) } catch { /* ignore */ }
}

interface PromptCopyButtonProps {
  finding: PromptFinding
}

export default function PromptCopyButton({ finding }: PromptCopyButtonProps) {
  const t = useTranslations('audit')
  const [selectedTool, setSelectedTool] = useState<ToolTarget>('cursor')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const TOOL_LABELS: Record<ToolTarget, string> = {
    cursor:        t('tool.cursor'),
    'claude-code': t('tool.claudeCode'),
    generic:       t('tool.generic'),
  }

  // Load preference after mount (localStorage is client-only)
  useEffect(() => {
    setSelectedTool(getSavedTool())
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const handleCopy = useCallback(() => {
    const prompt = buildFixPrompt(finding, selectedTool)
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => { /* ignore */ })
  }, [finding, selectedTool])

  function selectTool(tool: ToolTarget) {
    setSelectedTool(tool)
    saveTool(tool)
    setDropdownOpen(false)
  }

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      {/* Main copy button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleCopy() }}
        title={t('selectTool')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '3px 6px',
          borderRadius: '4px 0 0 4px',
          fontSize: 11,
          color: copied ? 'var(--accent)' : 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {copied
          ? <CheckCircle size={12} weight="fill" aria-hidden="true" />
          : <Copy        size={12} weight="bold"  aria-hidden="true" />}
        {copied ? t('copied') : t('prompt')}
      </button>

      {/* Tool selector caret */}
      <button
        onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v) }}
        title="Tool auswählen"
        aria-label="Prompt-Tool auswählen"
        style={{
          background: 'none',
          border: 'none',
          borderLeft: '1px solid var(--border)',
          cursor: 'pointer',
          padding: '3px 4px',
          borderRadius: '0 4px 4px 0',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <CaretDown size={9} weight="bold" aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(26,23,20,0.10)',
          zIndex: 50,
          minWidth: 130,
          overflow: 'hidden',
        }}>
          {(Object.entries(TOOL_LABELS) as [ToolTarget, string][]).map(([tool, label]) => (
            <button
              key={tool}
              onClick={() => selectTool(tool)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: selectedTool === tool ? 'var(--accent-light)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: selectedTool === tool ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: selectedTool === tool ? 600 : 400,
              }}
            >
              {label}
              {selectedTool === tool && (
                <span style={{ float: 'right', fontSize: 10, color: 'var(--accent)' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
