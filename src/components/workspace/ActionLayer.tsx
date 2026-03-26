'use client'

import React, { useEffect, useRef } from 'react'
import {
  ArrowsClockwise, TextT, EnvelopeSimple, Translate,
  Image, ArrowClockwise, Warning, SquaresFour,
} from '@phosphor-icons/react'
import ParrotIcon from '@/components/ParrotIcon'
import { useMediaQuery } from '@/hooks/useMediaQuery'

type ActionDef = {
  id: string
  label: string
  icon: React.ElementType
  description?: string | null
  danger?: boolean
  disabled?: boolean
}

const MAIN_ACTIONS: ActionDef[] = [
  { id: 'perspective', label: 'Andere Perspektive', icon: ArrowsClockwise, description: 'Kritisch, optimistisch, strategisch' },
  { id: 'shorten',     label: 'Kürzen',             icon: TextT,           description: 'Kompaktere Version' },
  { id: 'email',       label: 'Als E-Mail',          icon: EnvelopeSimple,  description: null },
  { id: 'translate',   label: 'Übersetzen',          icon: Translate,       description: null },
  { id: 'image',       label: 'Bild generieren',     icon: Image,           description: null },
  { id: 'regenerate',        label: 'Neu generieren',        icon: ArrowClockwise, description: null },
  { id: 'post_to_workspace', label: 'In Department posten',  icon: SquaresFour,    description: 'Ergebnis als Zusammenfassung teilen' },
]

const DANGER_ACTIONS: ActionDef[] = [
  { id: 'report', label: 'Fehlerhaft melden', icon: Warning, description: null, danger: true },
]

interface ActionLayerProps {
  isLastMessage: boolean
  isStreaming: boolean
  onAction: (id: string) => void
  onClose: () => void
}

// ─── Dropdown (Desktop) ───────────────────────────────────────────────────────

function ActionLayerDropdown({
  isLastMessage, isStreaming, onAction, onClose,
}: ActionLayerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    t = setTimeout(() => document.addEventListener('mousedown', onDown), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown) }
  }, [onClose])

  const actions = MAIN_ACTIONS.map(a =>
    a.id === 'regenerate' ? { ...a, disabled: !isLastMessage || isStreaming } : a
  )

  return (
    <div ref={ref} className="action-layer" role="menu" aria-label="Toro-Aktionen">
      <div className="action-layer-header" aria-hidden="true">
        <ParrotIcon size={13} />
        <span>Was soll ich damit tun?</span>
      </div>
      <div className="action-layer-items">
        {actions.map(action => (
          <button
            key={action.id}
            className={[
              'action-layer-item',
              action.disabled ? 'action-layer-item--disabled' : '',
            ].filter(Boolean).join(' ')}
            onClick={action.disabled ? undefined : () => { onAction(action.id); onClose() }}
            disabled={action.disabled}
            role="menuitem"
          >
            <span className="action-layer-item-icon" aria-hidden="true">
              <action.icon size={14} weight="bold" />
            </span>
            <span className="action-layer-item-text">
              <span className="action-layer-item-label">{action.label}</span>
              {action.description && (
                <span className="action-layer-item-desc">{action.description}</span>
              )}
            </span>
          </button>
        ))}
        <div className="action-layer-divider" aria-hidden="true" />
        {DANGER_ACTIONS.map(action => (
          <button
            key={action.id}
            className="action-layer-item action-layer-item--danger"
            onClick={() => { onAction(action.id); onClose() }}
            role="menuitem"
          >
            <span className="action-layer-item-icon" aria-hidden="true">
              <action.icon size={14} weight="bold" />
            </span>
            <span className="action-layer-item-text">
              <span className="action-layer-item-label">{action.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Bottom Sheet (Mobile) ────────────────────────────────────────────────────

function ActionLayerSheet({
  isLastMessage, isStreaming, onAction, onClose,
}: ActionLayerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const allActions = [
    ...MAIN_ACTIONS.map(a =>
      a.id === 'regenerate' ? { ...a, disabled: !isLastMessage || isStreaming } : a
    ),
    ...DANGER_ACTIONS,
  ]

  return (
    <>
      <div className="action-layer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="action-layer-sheet" role="dialog" aria-label="Toro-Aktionen" aria-modal="true">
        <div className="action-layer-sheet-handle" aria-hidden="true" />
        <div className="action-layer-sheet-header">
          <ParrotIcon size={16} />
          <span>Was soll ich damit tun?</span>
        </div>
        <div className="action-layer-sheet-items">
          {allActions.map((action, i) => {
            const isDanger = DANGER_ACTIONS.some(d => d.id === action.id)
            const showDivider = i === MAIN_ACTIONS.length
            return (
              <React.Fragment key={action.id}>
                {showDivider && <div className="action-layer-divider" aria-hidden="true" />}
                <button
                  className={[
                    'action-layer-sheet-item',
                    isDanger ? 'action-layer-sheet-item--danger' : '',
                    action.disabled ? 'action-layer-sheet-item--disabled' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={action.disabled ? undefined : () => { onAction(action.id); onClose() }}
                  disabled={action.disabled}
                >
                  <action.icon size={18} weight="bold" aria-hidden="true" />
                  <span className="action-layer-sheet-item-label">{action.label}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ActionLayer(props: ActionLayerProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  return isMobile
    ? <ActionLayerSheet {...props} />
    : <ActionLayerDropdown {...props} />
}
