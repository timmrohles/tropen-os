'use client'

import { useEffect, useState } from 'react'
import { FloppyDisk } from '@phosphor-icons/react'

interface PrefsData {
  model_preference?: string
  memory_window?: number
  thinking_mode?: boolean
  proactive_hints?: boolean
  link_previews?: boolean
  web_search_enabled?: boolean
}

export function PreferencesSection() {
  const [prefs, setPrefs] = useState<PrefsData>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const client = (async () => {
      const { createClient } = await import('@/utils/supabase/client')
      return createClient()
    })()
    client.then(async supabase => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_preferences')
        .select('model_preference, memory_window, thinking_mode, proactive_hints, link_previews, web_search_enabled')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setPrefs(data)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_preferences').upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggle(key: keyof PrefsData) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">Präferenzen</span>
      </div>
      <div className="card-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="settings-field">
          <label className="settings-label" htmlFor="model-pref">Modell-Präferenz</label>
          <select
            id="model-pref"
            className="settings-select"
            value={prefs.model_preference ?? 'auto'}
            onChange={e => setPrefs(p => ({ ...p, model_preference: e.target.value }))}
          >
            <option value="auto">Automatisch (empfohlen)</option>
            <option value="cheapest">Günstigstes Modell</option>
            <option value="eu_only">Nur EU-Modelle</option>
          </select>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="memory-window">Gesprächs-Gedächtnis (Nachrichten)</label>
          <input
            id="memory-window"
            type="number"
            min={5}
            max={50}
            className="settings-input"
            style={{ maxWidth: 100 }}
            value={prefs.memory_window ?? 20}
            onChange={e => setPrefs(p => ({ ...p, memory_window: Number(e.target.value) }))}
          />
          <p className="settings-hint">Wie viele Nachrichten Toro als Kontext verwendet</p>
        </div>

        {(
          [
            ['thinking_mode', 'Erweitertes Denken aktivieren'],
            ['proactive_hints', 'Proaktive Hinweise zeigen'],
            ['link_previews', 'Link-Vorschauen anzeigen'],
            ['web_search_enabled', 'Web-Suche standardmäßig aktiv'],
          ] as [keyof PrefsData, string][]
        ).map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!prefs[key]}
              onChange={() => toggle(key)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontSize: 13 }}>{label}</span>
          </label>
        ))}

        <button
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={handleSave}
          disabled={saving}
        >
          <FloppyDisk size={14} weight="bold" aria-hidden="true" />
          {saved ? 'Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
