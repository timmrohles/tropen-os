'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Gear } from '@phosphor-icons/react'

type ChatStyle = 'clear' | 'structured' | 'detailed'

const STYLE_LABELS: Record<ChatStyle, string> = {
  clear: 'Klar',
  structured: 'Strukturiert',
  detailed: 'Ausführlich',
}

const s: Record<string, React.CSSProperties> = {
  section: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-muted)',
    borderRadius: 10, padding: '20px 24px', marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-tertiary)', marginBottom: 16, display: 'block',
  },
  row: { display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 16 },
  label: { fontSize: 13, color: 'var(--text-secondary)' },
  input: {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 6, padding: '8px 12px',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  },
  inputReadonly: { opacity: 0.5, cursor: 'not-allowed' },
  select: {
    background: 'var(--bg-surface-solid)', border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)', borderRadius: 8,
    padding: '8px 32px 8px 12px', fontSize: 14, outline: 'none',
    width: '100%', cursor: 'pointer',
    boxSizing: 'border-box' as const, appearance: 'none' as const,
  },
  sliderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sliderValue: { color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  toggleLabel: { fontSize: 13, color: 'var(--text-secondary)' },
  toggleNote: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 },
  comingSoon: { fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 8, display: 'block' },
  hint: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.5, display: 'block' },
  hintBest: { fontSize: 11, color: 'rgba(163,181,84,0.8)', marginTop: 3, display: 'block' },
  hintWarn: { fontSize: 11, color: 'rgba(251,191,36,0.8)', marginTop: 3, display: 'block' },
}

export default function SettingsPage() {
  const supabase = useRef(createClient()).current
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [chatStyle, setChatStyle] = useState<ChatStyle>('structured')
  const [memoryWindow, setMemoryWindow] = useState(20)
  const [thinkingMode, setThinkingMode] = useState(false)
  const [proactiveHints, setProactiveHints] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expertMode, setExpertMode] = useState(false)
  const [supportAccess, setSupportAccess] = useState(true)
  const [impSessions, setImpSessions] = useState<{ id: string; ticket_ref: string | null; started_at: string; duration_minutes: number }[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase.from('users').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('user_preferences')
          .select('chat_style, memory_window, thinking_mode, proactive_hints')
          .eq('user_id', user.id).maybeSingle(),
      ])
      if (profile) setFullName((profile as { full_name?: string | null }).full_name ?? '')
      if (prefs) {
        setChatStyle(((prefs as { chat_style?: string }).chat_style as ChatStyle) ?? 'structured')
        setMemoryWindow((prefs as { memory_window?: number }).memory_window ?? 20)
        setThinkingMode((prefs as { thinking_mode?: boolean }).thinking_mode ?? false)
        setProactiveHints((prefs as { proactive_hints?: boolean }).proactive_hints ?? true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetch('/api/user/impersonation-sessions')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setSupportAccess(data.supportAccessEnabled)
        setImpSessions(data.sessions ?? [])
      })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await Promise.all([
        supabase.from('users').update({ full_name: fullName }).eq('id', user.id),
        supabase.from('user_preferences').update({
          chat_style: chatStyle,
          memory_window: memoryWindow,
          thinking_mode: thinkingMode,
          proactive_hints: proactiveHints,
        }).eq('user_id', user.id),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Gear size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Einstellungen
          </h1>
          <p className="page-header-sub">Profil, Präferenzen und Datenschutz</p>
        </div>
      </div>

      {/* Mein Konto */}
      <div style={s.section}>
        <span style={s.sectionTitle}>Mein Konto</span>
        <div style={s.row}>
          <label style={s.label}>Name</label>
          <input
            style={s.input}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Dein Name"
          />
        </div>
        <div style={s.row}>
          <label style={s.label}>E-Mail (nicht änderbar)</label>
          <input style={{ ...s.input, ...s.inputReadonly }} value={email} readOnly />
        </div>
      </div>

      {/* Präferenzen */}
      <div style={s.section}>
        <span style={s.sectionTitle}>Präferenzen</span>

        <div style={s.row}>
          <label style={s.label}>Antwort-Stil</label>
          <select
            style={s.select}
            value={chatStyle}
            onChange={e => setChatStyle(e.target.value as ChatStyle)}
          >
            {(Object.keys(STYLE_LABELS) as ChatStyle[]).map(k => (
              <option key={k} value={k}>{STYLE_LABELS[k]}</option>
            ))}
          </select>
          <span style={s.hint}>Wie Toro seine Antworten aufbaut — kurz & direkt, strukturiert mit Überschriften, oder ausführlich mit Beispielen.</span>
          <span style={s.hintBest}>Best Practice: &bdquo;Strukturiert&ldquo; eignet sich für die meisten Aufgaben. Wechsel zu &bdquo;Klar&ldquo; wenn du schnelle Antworten willst.</span>
        </div>

        <div style={s.row}>
          <div style={s.sliderRow}>
            <label style={s.label}>Gesprächsgedächtnis</label>
            <span style={s.sliderValue}>{memoryWindow}</span>
          </div>
          <input
            type="range" min={5} max={50} step={5}
            value={memoryWindow}
            onChange={e => setMemoryWindow(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <span style={s.hint}>Wie viele vorherige Nachrichten Toro bei jeder Antwort mitlest — mehr Kontext, höhere Token-Kosten.</span>
          {memoryWindow <= 20
            ? <span style={s.hintBest}>Best Practice: 20 Nachrichten — gut ausbalanciert zwischen Kontext und Kosten.</span>
            : <span style={s.hintWarn}>⚠️ Ab 30+ Nachrichten steigen die Kosten pro Anfrage spürbar.</span>
          }
        </div>

        <div style={s.toggleRow}>
          <div style={{ flex: 1 }}>
            <div style={s.toggleLabel}>💡 Proaktive Hinweise</div>
            <div style={s.toggleNote}>Toro schlägt nach Antworten nächste Schritte oder verwandte Themen vor.</div>
            <span style={s.hintBest}>Best Practice: Einschalten — Toro hilft dir, tiefer einzusteigen ohne explizit fragen zu müssen.</span>
          </div>
          <button
            onClick={() => setProactiveHints(v => !v)}
            style={{
              width: 36, height: 20, borderRadius: 10,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              background: proactiveHints ? 'var(--accent)' : 'var(--toggle-off)',
              position: 'relative', transition: 'background 0.2s', marginLeft: 12,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 16, height: 16,
              borderRadius: '50%', background: 'var(--bg-surface-solid)',
              transition: 'left 0.2s', left: proactiveHints ? 18 : 2,
            }} />
          </button>
        </div>

        {/* Expert Mode Toggle */}
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => setExpertMode(v => !v)}>
          {expertMode ? '▾' : '▸'} {expertMode ? 'Experten-Einstellungen ausblenden' : 'Experten-Einstellungen anzeigen'}
        </button>

        {expertMode && (
        <div style={s.toggleRow}>
          <div style={{ flex: 1 }}>
            <div style={s.toggleLabel}>🧠 Toro denkt laut nach</div>
            <div style={s.toggleNote}>Experimentell – wird in einer der nächsten Versionen aktiviert.</div>
            <span style={s.hint}>Aktiviert erweitertes Reasoning-Modell — Toro zeigt seine Gedankenkette vor der Antwort.</span>
            <span style={s.hintWarn}>⚠️ Erhöht Kosten und Antwortzeit deutlich. Nur für komplexe Aufgaben empfohlen.</span>
          </div>
          <button
            onClick={() => setThinkingMode(v => !v)}
            style={{
              width: 36, height: 20, borderRadius: 10,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              background: thinkingMode ? 'var(--accent)' : 'var(--toggle-off)',
              position: 'relative', transition: 'background 0.2s', marginLeft: 12,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 16, height: 16,
              borderRadius: '50%', background: 'var(--bg-surface-solid)',
              transition: 'left 0.2s', left: thinkingMode ? 18 : 2,
            }} />
          </button>
        </div>
        )}
      </div>

      {/* Datenschutz */}
      <div style={s.section}>
        <span style={s.sectionTitle}>Datenschutz</span>

        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>Support-Ansicht erlauben</div>
            <div style={s.toggleNote}>
              Tropen-Admins können deine Ansicht für Support-Zwecke öffnen.
              Niemals in deinem Namen handeln. Du siehst alle Sessions unten.
            </div>
          </div>
          <button
            onClick={async () => {
              const next = !supportAccess
              setSupportAccess(next)
              await fetch('/api/user/impersonation-sessions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supportAccessEnabled: next }),
              })
            }}
            style={{
              width: 36, height: 20, borderRadius: 10,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              background: supportAccess ? 'var(--accent)' : 'var(--toggle-off)',
              position: 'relative', transition: 'background 0.2s', marginLeft: 12,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 16, height: 16,
              borderRadius: '50%', background: 'var(--bg-surface-solid)',
              transition: 'left 0.2s', left: supportAccess ? 18 : 2,
            }} />
          </button>
        </div>

        {impSessions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
              Letzte Sessions
            </div>
            {impSessions.map(sess => (
              <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Tropen Admin · {new Date(sess.started_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}, {new Date(sess.started_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {sess.duration_minutes} Min
                  </div>
                  {sess.ticket_ref && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{sess.ticket_ref}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <span style={s.comingSoon}>Meine Daten exportieren — demnächst verfügbar</span>
          <span style={s.comingSoon}>Konto löschen — demnächst verfügbar</span>
        </div>
      </div>

      <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
        {saved ? '✓ Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
      </button>
    </div>
  )
}
