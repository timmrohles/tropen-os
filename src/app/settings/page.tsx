'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type ChatStyle = 'clear' | 'structured' | 'detailed'

const STYLE_LABELS: Record<ChatStyle, string> = {
  clear: 'Klar',
  structured: 'Strukturiert',
  detailed: 'Ausführlich',
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 600, margin: '0 auto', padding: '48px 24px' },
  heading: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 32 },
  section: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-muted)',
    borderRadius: 10, padding: '20px 24px', marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', marginBottom: 16, display: 'block',
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
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', borderRadius: 6, padding: '8px 12px',
    fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  sliderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sliderValue: { color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  toggleLabel: { fontSize: 13, color: 'var(--text-secondary)' },
  toggleNote: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 },
  saveBtn: {
    background: 'var(--accent)', color: '#0d1f16',
    border: 'none', borderRadius: 6, padding: '10px 24px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  comingSoon: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8, display: 'block' },
}

export default function SettingsPage() {
  const supabase = useRef(createClient()).current
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [chatStyle, setChatStyle] = useState<ChatStyle>('structured')
  const [memoryWindow, setMemoryWindow] = useState(20)
  const [thinkingMode, setThinkingMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase.from('users').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('user_preferences')
          .select('chat_style, memory_window, thinking_mode')
          .eq('user_id', user.id).maybeSingle(),
      ])
      if (profile) setFullName((profile as { full_name?: string | null }).full_name ?? '')
      if (prefs) {
        setChatStyle(((prefs as { chat_style?: string }).chat_style as ChatStyle) ?? 'structured')
        setMemoryWindow((prefs as { memory_window?: number }).memory_window ?? 20)
        setThinkingMode((prefs as { thinking_mode?: boolean }).thinking_mode ?? false)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        }).eq('user_id', user.id),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Einstellungen</h1>

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
        </div>

        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>🧠 Toro denkt laut nach</div>
            <div style={s.toggleNote}>Experimentell – wird in einer der nächsten Versionen aktiviert.</div>
          </div>
          <button
            onClick={() => setThinkingMode(v => !v)}
            style={{
              width: 36, height: 20, borderRadius: 10,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              background: thinkingMode ? 'var(--accent)' : '#252525',
              position: 'relative', transition: 'background 0.2s', marginLeft: 12,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 16, height: 16,
              borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', left: thinkingMode ? 18 : 2,
            }} />
          </button>
        </div>
      </div>

      {/* Datenschutz */}
      <div style={s.section}>
        <span style={s.sectionTitle}>Datenschutz</span>
        <span style={s.comingSoon}>Meine Daten exportieren — demnächst verfügbar</span>
        <span style={s.comingSoon}>Konto löschen — demnächst verfügbar</span>
      </div>

      <button
        style={s.saveBtn}
        onClick={save}
        disabled={saving}
      >
        {saved ? '✓ Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
      </button>
    </div>
  )
}
