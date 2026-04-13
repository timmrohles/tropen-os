'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  CaretRight, Brain,
  ArrowCounterClockwise, GearSix, ArrowRight,
  MapPin, Bird, Layout,
} from '@phosphor-icons/react'
import ParrotIcon from '@/components/ParrotIcon'
import { PanelSelect } from './PanelSelect'
import type { Project } from '@/hooks/useWorkspaceState'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface Prefs {
  chat_style: 'knapp' | 'normal' | 'ausführlich' | 'geführt'
  emoji_style: 'none' | 'minimal' | 'normal'
  suggestions_enabled: boolean
  thinking_mode: boolean
  link_previews: boolean
  web_search_enabled: boolean
}

export interface SessionPanelProps {
  conversationId: string | null
  activeConvProjectId: string | null
  projects: Project[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onPrefsChange?: (prefs: Prefs) => void
  messageCount?: number
  onContextReset?: () => void
  splitEnabled?: boolean
  onToggleSplit?: () => void
}

export type { Prefs as SessionPrefs }

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const STYLE_OPTIONS: Array<{ value: Prefs['chat_style']; label: string }> = [
  { value: 'knapp',       label: 'Knapp' },
  { value: 'normal',      label: 'Normal' },
  { value: 'ausführlich', label: 'Ausführlich' },
  { value: 'geführt',     label: 'Geführt' },
]

const EMOJI_OPTIONS: Array<{ value: Prefs['emoji_style']; label: string }> = [
  { value: 'none',    label: 'Keine' },
  { value: 'minimal', label: 'Dezent' },
  { value: 'normal',  label: 'Normal' },
]

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export default function SessionPanel({
  conversationId: _convId,
  activeConvProjectId,
  projects,
  collapsed: collapsedProp,
  onToggleCollapse,
  onPrefsChange,
  messageCount = 0,
  onContextReset,
  splitEnabled = true,
  onToggleSplit,
}: SessionPanelProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [collapsedInternal, setCollapsedInternal] = useState(false)
  const collapsed = collapsedProp === undefined ? collapsedInternal : collapsedProp
  function setCollapsed(v: boolean) {
    if (onToggleCollapse) { onToggleCollapse() } else { setCollapsedInternal(v) }
  }

  const [prefs, setPrefs] = useState<Prefs>({
    chat_style: 'normal',
    emoji_style: 'minimal',
    suggestions_enabled: true,
    thinking_mode: false,
    link_previews: true,
    web_search_enabled: false,
  })
  const [userId, setUserId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('user_preferences')
        .select('chat_style, emoji_style, suggestions_enabled, thinking_mode, link_previews, web_search_enabled')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        const raw = data as Record<string, unknown>
        const rawStyle = raw.chat_style as string | undefined
        let chatStyle: Prefs['chat_style'] = 'normal'
        if (rawStyle === 'knapp' || rawStyle === 'normal' || rawStyle === 'ausführlich' || rawStyle === 'geführt') {
          chatStyle = rawStyle
        }
        setPrefs({
          chat_style: chatStyle,
          emoji_style: (raw.emoji_style as Prefs['emoji_style']) ?? 'minimal',
          suggestions_enabled: (raw.suggestions_enabled as boolean) ?? true,
          thinking_mode: (raw.thinking_mode as boolean) ?? false,
          link_previews: (raw.link_previews as boolean) ?? true,
          web_search_enabled: (raw.web_search_enabled as boolean) ?? false,
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const savePrefs = useCallback((partial: Partial<Prefs>) => {
    if (!userId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.from('user_preferences').upsert(
        { user_id: userId, ...partial },
        { onConflict: 'user_id' }
      )
    }, 500)
  }, [userId, supabase])

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    savePrefs({ [key]: value })
    onPrefsChange?.(next)
  }

  const activeProject = projects.find(p => p.id === activeConvProjectId) ?? null

  // ── Collapsed ────────────────────────────────────────────

  if (collapsed) {
    return (
      <div className="rp-collapsed">
        <button
          className="rp-collapsed-btn"
          onClick={() => setCollapsed(false)}
          title="Panel öffnen"
          aria-label="Panel öffnen"
        >
          <CaretRight size={13} weight="bold" />
        </button>
        <div className="rp-collapsed-parrot" aria-hidden="true">
          <ParrotIcon size={20} />
        </div>
      </div>
    )
  }

  // ── Full Panel ───────────────────────────────────────────

  return (
    <aside className="right-panel" aria-label="Chat-Einstellungen">

      {/* Header */}
      <div className="right-panel-header">
        <span className="right-panel-header-title">Chat</span>
        <button
          className="right-panel-close"
          onClick={() => setCollapsed(true)}
          aria-label="Panel schließen"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* ── KONTEXT ── */}
      <div className="right-panel-section">
        <div className="right-panel-section-header">
          <MapPin size={12} weight="fill" aria-hidden="true" />
          <span className="right-panel-section-label">Kontext</span>
        </div>
        <div className="right-panel-context">
          <span className={`right-panel-context-dot${activeProject ? ' right-panel-context-dot--active' : ''}`} />
          <span className="right-panel-context-label">
            {activeProject ? activeProject.title : 'Freier Chat'}
          </span>
        </div>
      </div>

      <div className="right-panel-divider" />

      {/* ── TORO ── */}
      <div className="right-panel-section">
        <div className="right-panel-section-header">
          <Bird size={12} weight="fill" aria-hidden="true" />
          <span className="right-panel-section-label">Toro</span>
        </div>

        <PanelSelect
          id="rp-chat-style"
          label="Antwort-Stil"
          value={prefs.chat_style}
          options={STYLE_OPTIONS}
          onChange={v => updatePref('chat_style', v as Prefs['chat_style'])}
        />

        <PanelSelect
          id="rp-emoji-style"
          label="Emojis"
          value={prefs.emoji_style}
          options={EMOJI_OPTIONS}
          onChange={v => updatePref('emoji_style', v as Prefs['emoji_style'])}
        />

        <div className="right-panel-toggle-row">
          <div className="right-panel-toggle-info">
            <span className="right-panel-toggle-label">Weiterführende Vorschläge</span>
            <span className="right-panel-toggle-hint">Toro schlägt nächste Schritte vor</span>
          </div>
          <label className="right-panel-toggle" aria-label="Weiterführende Vorschläge">
            <input
              type="checkbox"
              checked={prefs.suggestions_enabled}
              onChange={e => updatePref('suggestions_enabled', e.target.checked)}
            />
            <span className="right-panel-toggle-slider" />
          </label>
        </div>

        <div className="right-panel-toggle-row">
          <div className="right-panel-toggle-info">
            <span className="right-panel-toggle-label">
              <Brain size={12} weight="bold" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 3 }} />
              Toro denkt laut nach
            </span>
            <span className="right-panel-toggle-hint">Zeigt Denkprozess · mehr Token</span>
          </div>
          <label className="right-panel-toggle" aria-label="Toro denkt laut nach">
            <input
              type="checkbox"
              checked={prefs.thinking_mode}
              onChange={e => updatePref('thinking_mode', e.target.checked)}
            />
            <span className="right-panel-toggle-slider" />
          </label>
        </div>

        {messageCount > 20 && onContextReset && (
          <div style={{ paddingTop: 6, paddingBottom: 2, paddingLeft: 16, paddingRight: 16 }}>
            <button
              className="right-panel-reset-btn"
              onClick={onContextReset}
              aria-label="Kontext zurücksetzen"
            >
              <ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" />
              Kontext zurücksetzen
            </button>
          </div>
        )}
      </div>

      <div className="right-panel-divider" />

      {/* ── ANSICHT ── */}
      <div className="right-panel-section">
        <div className="right-panel-section-header">
          <Layout size={12} weight="fill" aria-hidden="true" />
          <span className="right-panel-section-label">Ansicht</span>
        </div>

        <div className="right-panel-toggle-row">
          <div className="right-panel-toggle-info">
            <span className="right-panel-toggle-label">Geteilter Bildschirm</span>
            <span className="right-panel-toggle-hint">Chat links · Artefakt rechts</span>
          </div>
          <label className="right-panel-toggle" aria-label="Geteilter Bildschirm">
            <input
              type="checkbox"
              checked={splitEnabled}
              onChange={() => onToggleSplit?.()}
            />
            <span className="right-panel-toggle-slider" />
          </label>
        </div>

        <div className="right-panel-toggle-row">
          <div className="right-panel-toggle-info">
            <span className="right-panel-toggle-label">Live-Suche</span>
            <span className="right-panel-toggle-hint">Toro sucht im Web · mehr Token</span>
          </div>
          <label className="right-panel-toggle" aria-label="Live-Suche">
            <input
              type="checkbox"
              checked={prefs.web_search_enabled}
              onChange={e => updatePref('web_search_enabled', e.target.checked)}
            />
            <span className="right-panel-toggle-slider" />
          </label>
        </div>

        <div className="right-panel-toggle-row">
          <div className="right-panel-toggle-info">
            <span className="right-panel-toggle-label">Links anzeigen</span>
            <span className="right-panel-toggle-hint">URL-Vorschau nach Suche</span>
          </div>
          <label className="right-panel-toggle" aria-label="Links anzeigen">
            <input
              type="checkbox"
              checked={prefs.link_previews}
              onChange={e => updatePref('link_previews', e.target.checked)}
            />
            <span className="right-panel-toggle-slider" />
          </label>
        </div>
      </div>

      {/* Einstellungen — immer unten */}
      <div style={{ marginTop: 'auto' }}>
        <div className="right-panel-divider" />
        <Link href="/settings" className="right-panel-settings-link">
          <GearSix size={14} weight="bold" aria-hidden="true" />
          Einstellungen
          <ArrowRight size={12} weight="bold" aria-hidden="true" style={{ marginLeft: 'auto' }} />
        </Link>
      </div>

    </aside>
  )
}
