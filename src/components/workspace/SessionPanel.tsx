'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Brain, ChartBar, Cpu, Sliders,
  CaretLeft, CaretRight, CaretDown,
} from '@phosphor-icons/react'
import type { ChatMessage } from '@/hooks/useWorkspaceState'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface Prefs {
  chat_style: 'clear' | 'structured' | 'detailed'
  memory_window: number
  thinking_mode: boolean
}

interface Routing {
  task_type: string
  agent: string
  model_class: string
  model: string
}

export interface SessionPanelProps {
  conversationId: string | null
  messages: ChatMessage[]
  routing: Routing | null
  onNewConversation: () => void
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const STYLE_OPTIONS: Array<{ value: Prefs['chat_style']; label: string; desc: string }> = [
  { value: 'clear', label: 'Klar', desc: 'Kurz und direkt' },
  { value: 'structured', label: 'Strukturiert', desc: 'Mit Überschriften und Listen' },
  { value: 'detailed', label: 'Ausführlich', desc: 'Detailliert mit Beispielen' },
]
const STYLE_LABELS: Record<Prefs['chat_style'], string> = {
  clear: 'Klar', structured: 'Strukturiert', detailed: 'Ausführlich',
}

const WARN_COLORS = {
  amber: { bg: '#1a1400', border: '#3a2a00', color: '#fbbf24' },
  orange: { bg: '#1a0e00', border: '#3a1e00', color: '#f97316' },
  red:    { bg: '#1a0000', border: '#3a0000', color: '#ef4444' },
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function calcCO2(tokens: number): string {
  if (tokens === 0) return '—'
  const mid = (tokens / 1_000_000) * 0.8 * 0.33 * 1000
  const min = Math.max(0, mid * 0.6)
  const max = Math.max(0, mid * 1.4)
  if (max < 0.0001) return '<0.0001g'
  return `~${min.toFixed(4)}g – ${max.toFixed(4)}g`
}

function fmtTokens(n: number): string {
  if (n === 0) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="sp-row">
      <span className="sp-row-label">{label}</span>
      <span className="sp-row-value">{value}</span>
    </div>
  )
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="sp-section-label">
      {icon}
      <span>{children}</span>
    </div>
  )
}

function Divider() {
  return <div className="sp-divider" />
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export default function SessionPanel({ conversationId: _convId, messages, routing, onNewConversation: _onNewConversation }: SessionPanelProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [collapsed, setCollapsed] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>({ chat_style: 'structured', memory_window: 20, thinking_mode: false })
  const [userId, setUserId] = useState<string | null>(null)
  const [styleDropOpen, setStyleDropOpen] = useState(false)
  const styleDropRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('user_preferences')
        .select('chat_style, memory_window, thinking_mode')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setPrefs({
          chat_style: (data.chat_style as Prefs['chat_style']) ?? 'structured',
          memory_window: (data as { memory_window?: number }).memory_window ?? 20,
          thinking_mode: (data as { thinking_mode?: boolean }).thinking_mode ?? false,
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!styleDropOpen) return
    function onDown(e: MouseEvent) {
      if (styleDropRef.current && !styleDropRef.current.contains(e.target as Node)) {
        setStyleDropOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [styleDropOpen])

  const savePrefs = useCallback((partial: Partial<Prefs>) => {
    if (!userId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.from('user_preferences').update(partial).eq('user_id', userId)
    }, 500)
  }, [userId, supabase])

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs(prev => ({ ...prev, [key]: value }))
    savePrefs({ [key]: value })
  }

  // ── Session Stats ───────────────────────────────────────

  const nonPending = messages.filter(m => !m.pending)
  const msgCount = nonPending.length
  const sessionCost = nonPending.reduce((s, m) => s + (m.cost_eur ?? 0), 0)
  const sessionTokens = nonPending.reduce(
    (s, m) => s + ((m as { tokens_input?: number | null }).tokens_input ?? 0) + ((m as { tokens_output?: number | null }).tokens_output ?? 0),
    0
  )

  // ── Warnings ────────────────────────────────────────────

  const warnings: { level: 'amber' | 'orange' | 'red'; text: string }[] = []
  if (prefs.memory_window > 30)
    warnings.push({ level: 'amber', text: 'Größeres Gedächtnis = mehr Tokens pro Anfrage' })
  if (routing?.model_class === 'deep')
    warnings.push({ level: 'amber', text: 'Deep-Modell aktiv – höhere Kosten' })
  if (sessionCost > 0.50)
    warnings.push({ level: 'red', text: `Achtung: hohe Kosten dieser Session (€${sessionCost.toFixed(4)})` })
  else if (sessionCost > 0.10)
    warnings.push({ level: 'orange', text: `Session kostet bereits €${sessionCost.toFixed(4)}` })

  // ── Collapsed State ─────────────────────────────────────

  if (collapsed) {
    return (
      <div className="sp-collapsed">
        <button className="sp-collapse-btn" onClick={() => setCollapsed(false)} title="Panel öffnen">
          <CaretRight size={13} />
        </button>
        <div className="sp-parrot" title="Toro ist hier">
          <span style={{ fontSize: 16 }}>🦜</span>
        </div>
      </div>
    )
  }

  // ── Full Panel ──────────────────────────────────────────

  return (
    <div className="sp sidebar-scroll">

      {/* Header */}
      <div className="sp-header">
        <span className="sp-header-label">SESSION</span>
        <button className="sp-header-btn" onClick={() => setCollapsed(true)} title="Panel einklappen">
          <CaretLeft size={14} />
        </button>
      </div>

      {/* ── Sektion: Aktuelle Session ── */}
      <div className="sp-section">
        <SectionLabel icon={<Cpu size={10} />}>Aktuelle Session</SectionLabel>

        {routing ? (
          <>
            <Row label="Modell" value={routing.model} />
            <div className="sp-row">
              <span className="sp-row-label">Klasse</span>
              <span className={`sp-class-badge sp-class-badge--${routing.model_class ?? 'fast'}`}>{routing.model_class}</span>
            </div>
          </>
        ) : (
          <p className="sp-no-request">Noch keine Anfrage</p>
        )}

        <Row label="Gedächtnis" value={`${prefs.memory_window} Nachr.`} />
        <Row label="Stil" value={STYLE_LABELS[prefs.chat_style]} />
      </div>

      <Divider />

      {/* ── Sektion: Diese Session ── */}
      <div className="sp-section">
        <SectionLabel icon={<ChartBar size={10} />}>Diese Session</SectionLabel>
        <Row label="Nachrichten" value={msgCount > 0 ? String(msgCount) : '—'} />
        <Row label="Tokens" value={fmtTokens(sessionTokens)} />
        <Row label="Kosten" value={sessionCost > 0 ? `€${sessionCost.toFixed(4)}` : '—'} />
        <Row label="CO₂ est." value={calcCO2(sessionTokens)} />
      </div>

      {/* ── Sektion: Warnungen ── */}
      {warnings.length > 0 && (
        <>
          <Divider />
          <div className="sp-warnings">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="sp-warning"
                /* Dynamic colors from warning level – inline required */
                style={{ background: WARN_COLORS[w.level].bg, border: `1px solid ${WARN_COLORS[w.level].border}`, color: WARN_COLORS[w.level].color }}
              >
                {w.level === 'red' ? '🔴' : w.level === 'orange' ? '🟠' : '⚠️'} {w.text}
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />

      {/* ── Sektion: Anpassen ── */}
      <div className="sp-section">
        <SectionLabel icon={<Sliders size={10} />}>Anpassen</SectionLabel>

        {/* Gedächtnis-Slider */}
        <div className="sp-field">
          <div className="sp-slider-row">
            <label className="sp-slider-label">Gesprächsgedächtnis</label>
            <span className="sp-slider-value">{prefs.memory_window}</span>
          </div>
          <input
            type="range"
            min={5} max={50} step={5}
            value={prefs.memory_window}
            onChange={e => updatePref('memory_window', Number(e.target.value))}
            className="sp-slider"
          />
          {prefs.memory_window > 30 && (
            <p className="sp-slider-warn">⚠️ Erhöht Tokenverbrauch pro Anfrage</p>
          )}
        </div>

        {/* Antwort-Stil */}
        <div className="sp-field">
          <label className="sp-select-label">Antwort-Stil</label>
          <div className="sp-select-wrap" ref={styleDropRef}>
            <button
              className="sp-select-trigger"
              onClick={() => setStyleDropOpen((v) => !v)}
            >
              {STYLE_LABELS[prefs.chat_style]}
              <CaretDown size={14} style={{ color: '#89c4a8', flexShrink: 0, transform: styleDropOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
            </button>
            {styleDropOpen && (
              <div className="sp-select-menu">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`sp-select-option${prefs.chat_style === opt.value ? ' sp-select-option--active' : ''}`}
                    onClick={() => { updatePref('chat_style', opt.value); setStyleDropOpen(false) }}
                  >
                    <span className="sp-select-opt-label">{opt.label}</span>
                    <span className="sp-select-opt-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thinking Mode Toggle */}
        <div className="sp-field">
          <div className="sp-toggle-row">
            <span className="sp-toggle-label">
              <Brain size={15} /> Toro denkt laut nach
            </span>
            <button
              className={`sp-toggle-btn${prefs.thinking_mode ? ' sp-toggle-btn--on' : ''}`}
              onClick={() => updatePref('thinking_mode', !prefs.thinking_mode)}
              title={prefs.thinking_mode ? 'Deaktivieren' : 'Aktivieren'}
            >
              <span className={`sp-toggle-thumb${prefs.thinking_mode ? ' sp-toggle-thumb--on' : ''}`} />
            </button>
          </div>
          <p className="sp-toggle-note">
            Experimentell – wird in einer der nächsten Versionen aktiviert.
          </p>
        </div>
      </div>


    </div>
  )
}
