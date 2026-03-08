'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Brain, ChartBar, Cpu, Sliders, ArrowCounterClockwise,
  CaretLeft, CaretRight, Plus,
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

const STYLE_LABELS: Record<Prefs['chat_style'], string> = {
  clear: 'Klar',
  structured: 'Strukturiert',
  detailed: 'Ausführlich',
}

const CLASS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  fast: { bg: '#0d2a1a', color: '#22c55e', border: '#1a4a2a' },
  deep: { bg: '#0d1a2a', color: '#3b82f6', border: '#1a2a4a' },
  safe: { bg: '#1a0d2a', color: '#a855f7', border: '#2a1a4a' },
}

const WARN_COLORS = {
  amber: { bg: '#1a1400', border: '#3a2a00', color: '#fbbf24' },
  orange: { bg: '#1a0e00', border: '#3a1e00', color: '#f97316' },
  red: { bg: '#1a0000', border: '#3a0000', color: '#ef4444' },
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
      <span style={{ color: 'var(--text-on-green-secondary)', fontSize: 15, fontWeight: 500 }}>{label}</span>
      <span style={{
        color: 'var(--text-on-green-primary)', fontSize: 15, fontWeight: 500,
        maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'right',
      }}>{value}</span>
    </div>
  )
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      color: 'var(--text-on-green-muted)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.07em', marginBottom: 10, textTransform: 'uppercase',
    }}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid #1f6b4a' }} />
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export default function SessionPanel({ conversationId: _convId, messages, routing, onNewConversation }: SessionPanelProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [collapsed, setCollapsed] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>({ chat_style: 'structured', memory_window: 20, thinking_mode: false })
  const [userId, setUserId] = useState<string | null>(null)
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

  const classColor = routing?.model_class
    ? (CLASS_COLORS[routing.model_class] ?? CLASS_COLORS.fast)
    : CLASS_COLORS.fast

  // ── Collapsed State ─────────────────────────────────────

  if (collapsed) {
    return (
      <div style={{
        width: 24, flexShrink: 0, background: '#134e3a',
        borderLeft: '1px solid #1f6b4a', display: 'flex',
        flexDirection: 'column', alignItems: 'center',
      }}>
        <button
          onClick={() => setCollapsed(false)}
          title="Panel öffnen"
          style={{
            background: 'none', border: 'none', color: 'var(--text-on-green-muted)',
            padding: '10px 0', cursor: 'pointer',
            width: '100%', display: 'flex', justifyContent: 'center',
          }}
        >
          <CaretRight size={13} />
        </button>
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Toro ist hier"
        >
          <span style={{ fontSize: 16 }}>🦜</span>
        </div>
      </div>
    )
  }

  // ── Full Panel ──────────────────────────────────────────

  return (
    <div style={{
      width: 300, flexShrink: 0, background: '#134e3a',
      borderLeft: '1px solid #1f6b4a', display: 'flex',
      flexDirection: 'column', overflowY: 'auto',
    }} className="sidebar-scroll">

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid #1f6b4a', flexShrink: 0,
      }}>
        <span style={{ color: 'var(--text-on-green-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>SESSION</span>
        <button
          onClick={() => setCollapsed(true)}
          title="Panel einklappen"
          style={{
            background: 'none', border: 'none', color: 'var(--text-on-green-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 2px',
          }}
        >
          <CaretLeft size={14} />
        </button>
      </div>

      {/* ── Sektion 1: Modell & Stil ── */}
      <div style={{ padding: '12px 14px' }}>
        <SectionLabel icon={<Cpu size={10} />}>Aktuelle Session</SectionLabel>

        {routing ? (
          <>
            <Row label="Modell" value={routing.model} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ color: 'var(--text-on-green-secondary)', fontSize: 15, fontWeight: 500 }}>Klasse</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: classColor.bg, color: classColor.color,
                border: `1px solid ${classColor.border}`,
                padding: '1px 7px', borderRadius: 4,
              }}>{routing.model_class}</span>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text-on-green-secondary)', fontSize: 15, fontWeight: 500, marginBottom: 7 }}>Noch keine Anfrage</div>
        )}

        <Row label="Gedächtnis" value={`${prefs.memory_window} Nachr.`} />
        <Row label="Stil" value={STYLE_LABELS[prefs.chat_style]} />
      </div>

      <Divider />

      {/* ── Sektion 1b: Stats ── */}
      <div style={{ padding: '12px 14px' }}>
        <SectionLabel icon={<ChartBar size={10} />}>Diese Session</SectionLabel>
        <Row label="Nachrichten" value={msgCount > 0 ? String(msgCount) : '—'} />
        <Row label="Tokens" value={fmtTokens(sessionTokens)} />
        <Row label="Kosten" value={sessionCost > 0 ? `€${sessionCost.toFixed(4)}` : '—'} />
        <Row label="CO₂ est." value={calcCO2(sessionTokens)} />
      </div>

      {/* ── Sektion 2: Warnungen (dynamisch) ── */}
      {warnings.length > 0 && (
        <>
          <Divider />
          <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {warnings.map((w, i) => (
              <div key={i} style={{
                background: WARN_COLORS[w.level].bg,
                border: `1px solid ${WARN_COLORS[w.level].border}`,
                borderRadius: 5, padding: '5px 8px',
                color: WARN_COLORS[w.level].color,
                fontSize: 13, lineHeight: 1.45,
              }}>
                {w.level === 'red' ? '🔴' : w.level === 'orange' ? '🟠' : '⚠️'} {w.text}
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />

      {/* ── Sektion 3: Einstellungen ── */}
      <div style={{ padding: '12px 14px' }}>
        <SectionLabel icon={<Sliders size={10} />}>Anpassen</SectionLabel>

        {/* Gedächtnis-Slider */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ color: 'var(--text-on-green-secondary)', fontSize: 15, fontWeight: 500 }}>Gesprächsgedächtnis</label>
            <span style={{ color: 'var(--text-on-green-primary)', fontSize: 15, fontWeight: 600 }}>{prefs.memory_window}</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={prefs.memory_window}
            onChange={e => updatePref('memory_window', Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          {prefs.memory_window > 30 && (
            <p style={{ color: '#fbbf24', fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>
              ⚠️ Erhöht Tokenverbrauch pro Anfrage
            </p>
          )}
        </div>

        {/* Antwort-Stil */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: 'var(--text-on-green-secondary)', fontSize: 15, fontWeight: 500, display: 'block', marginBottom: 6 }}>Antwort-Stil</label>
          <select
            value={prefs.chat_style}
            onChange={e => updatePref('chat_style', e.target.value as Prefs['chat_style'])}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid #1f6b4a',
              color: 'var(--text-on-green-primary)', fontSize: 15, padding: '7px 8px',
              borderRadius: 5, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="clear">Klar</option>
            <option value="structured">Strukturiert</option>
            <option value="detailed">Ausführlich</option>
          </select>
        </div>

        {/* Thinking Mode Toggle */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-on-green-secondary)', fontSize: 15, fontWeight: 500 }}>
              <Brain size={15} /> Toro denkt laut nach
            </span>
            <button
              onClick={() => updatePref('thinking_mode', !prefs.thinking_mode)}
              title={prefs.thinking_mode ? 'Deaktivieren' : 'Aktivieren'}
              style={{
                width: 36, height: 20, borderRadius: 10,
                border: 'none', cursor: 'pointer', flexShrink: 0,
                background: prefs.thinking_mode ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, width: 16, height: 16,
                borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
                left: prefs.thinking_mode ? 18 : 2,
              }} />
            </button>
          </div>
          <p style={{ color: 'var(--text-on-green-muted)', fontSize: 10, lineHeight: 1.45 }}>
            Experimentell – wird in einer der nächsten Versionen aktiviert.
          </p>
        </div>
      </div>

      <Divider />

      {/* ── Sektion 4: Session Reset ── */}
      <div style={{ padding: '12px 14px' }}>
        <button
          onClick={onNewConversation}
          style={{
            width: '100%', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 8, padding: '9px 0',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Plus size={14} weight="bold" />
          Neuer Chat
        </button>
        <p style={{ color: 'var(--text-on-green-muted)', fontSize: 10, marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>
          Löscht den Dify-Kontext und startet eine neue conversation_id
        </p>
      </div>

    </div>
  )
}
