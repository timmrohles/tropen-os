'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const PRESET_COLORS = ['#a3b554', '#6366f1', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981']

interface BrandingData {
  logo_url: string | null
  primary_color: string
  organization_display_name: string | null
  ai_guide_name: string
  ai_guide_description: string
}

export default function BrandingPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<BrandingData>({
    logo_url: null,
    primary_color: '#a3b554',
    organization_display_name: null,
    ai_guide_name: 'Toro',
    ai_guide_description: 'Dein KI-Guide durch den Informationsdschungel',
  })
  const [orgId, setOrgId] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Org-ID aus User laden (mit Fallback aus users-Tabelle für Owner ohne invite metadata)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const meta = user.user_metadata as { organization_id?: string }
      if (meta.organization_id) {
        setOrgId(meta.organization_id)
      } else {
        const { data: userProfile } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        if (userProfile?.organization_id) setOrgId(userProfile.organization_id)
      }
    })

    // Branding laden
    fetch('/api/admin/branding')
      .then((r) => r.json())
      .then((d: BrandingData) => {
        setData(d)
        if (d.logo_url) setLogoPreview(d.logo_url)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function uploadLogo(file: File) {
    if (!file.type.startsWith('image/')) { setError('Bitte ein Bild auswählen.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo max. 2 MB.'); return }
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${orgId || 'tmp'}/logo-${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError('Upload fehlgeschlagen. Prüfe ob Bucket "organization-logos" existiert.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(uploadData.path)
    setData((prev) => ({ ...prev, logo_url: publicUrl }))
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/admin/branding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      // CSS-Variable aktualisieren
      document.documentElement.style.setProperty('--primary-color', data.primary_color)
    } else {
      setError('Speichern fehlgeschlagen.')
    }
  }

  return (
    <div className="content-max">
      <h1 style={s.h1}>Co-Branding</h1>
      <p style={s.sub}>Passe Logo, Farbe und den Namen deines KI-Assistenten an.</p>

      {/* ── Branding-Einstellungen ── */}
      <div style={s.section}>

        {/* Logo */}
        <div style={s.field}>
          <label style={s.label}>Logo</label>
          <div style={s.logoRow}>
            <div
              style={s.dropZone}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={s.logoImg} />
              ) : uploading ? (
                <span style={s.dropHint}>Wird hochgeladen…</span>
              ) : (
                <span style={s.dropHint}>Klicken zum Hochladen · PNG · SVG · JPG · max. 2 MB</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
            />
            {logoPreview && (
              <button
                style={s.removeBtn}
                onClick={() => { setLogoPreview(null); setData((d) => ({ ...d, logo_url: null })) }}
              >
                Entfernen
              </button>
            )}
          </div>
        </div>

        {/* Anzeigename */}
        <div style={s.field}>
          <label style={s.label}>Anzeigename der Organisation</label>
          <input
            style={s.input}
            placeholder="Muster GmbH"
            value={data.organization_display_name ?? ''}
            onChange={(e) => setData((d) => ({ ...d, organization_display_name: e.target.value || null }))}
          />
        </div>

        {/* Primärfarbe */}
        <div style={s.field}>
          <label style={s.label}>Primärfarbe</label>
          <div style={s.colorRow}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                style={{ ...s.colorSwatch, background: c, ...(data.primary_color === c ? s.colorSwatchActive : {}) }}
                onClick={() => { setData((d) => ({ ...d, primary_color: c })); setShowColorPicker(false) }}
                title={c}
              />
            ))}
            <button
              style={{ ...s.colorSwatch, background: '#1e1e1e', border: '1px dashed #555' }}
              onClick={() => setShowColorPicker((v) => !v)}
              title="Eigene Farbe"
            >
              <span style={{ fontSize: 12, color: '#888' }}>+</span>
            </button>
            {showColorPicker && (
              <input
                type="color"
                value={data.primary_color}
                onChange={(e) => setData((d) => ({ ...d, primary_color: e.target.value }))}
                style={s.colorInput}
              />
            )}
          </div>
          <div style={{ ...s.colorBar, background: data.primary_color }}>
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>{data.primary_color}</span>
          </div>
        </div>

        {/* Guide Name */}
        <div style={s.field}>
          <label style={s.label}>Name des KI-Assistenten</label>
          <input
            style={s.input}
            placeholder="Toro"
            value={data.ai_guide_name}
            onChange={(e) => setData((d) => ({ ...d, ai_guide_name: e.target.value }))}
          />
        </div>

        {/* Guide Description */}
        <div style={s.field}>
          <label style={s.label}>Beschreibung des KI-Assistenten</label>
          <input
            style={s.input}
            placeholder="Dein KI-Guide durch den Informationsdschungel"
            value={data.ai_guide_description}
            onChange={(e) => setData((d) => ({ ...d, ai_guide_description: e.target.value }))}
          />
        </div>

        {error && <div style={s.errorBox}>{error}</div>}
        {success && <div style={s.successBox}>Einstellungen gespeichert ✓</div>}

        <button style={s.saveBtn} onClick={save} disabled={saving || uploading}>
          {saving ? 'Speichern…' : 'Änderungen speichern'}
        </button>
      </div>

      {/* ── White-Label Premium (gesperrt) ── */}
      <div style={s.premiumSection}>
        <div style={s.lockRow}>
          <span style={s.lockIcon}>🔒</span>
          <div>
            <div style={s.premiumTitle}>White-Label – Tropen OS Premium</div>
            <div style={s.premiumSub}>
              Eigenes vollständiges Branding, eigene Domain (z.B.{' '}
              <span style={s.domainExample}>ai.mustermann.de</span>
              ), kein „powered by Tropen OS", vollständig anpassbare Oberfläche.
            </div>
          </div>
        </div>
        <a
          href="mailto:hello@tropen.de?subject=Anfrage%20White-Label%20Tropen%20OS"
          style={s.premiumBtn}
        >
          Jetzt anfragen →
        </a>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  h1: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 },
  sub: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 },

  section: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 24,
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },

  field: { display: 'flex', flexDirection: 'column', marginBottom: 20 },
  label: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },

  input: {
    background: 'var(--bg-surface-solid)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)',
    padding: '9px 14px', borderRadius: 7, fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },

  logoRow: { display: 'flex', alignItems: 'center', gap: 12 },
  dropZone: {
    flex: 1, border: '1px dashed #2a2a2a', borderRadius: 8,
    padding: '14px 20px', cursor: 'pointer', background: '#1a1a1a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 54,
  },
  logoImg: { maxHeight: 36, maxWidth: '100%', objectFit: 'contain' },
  dropHint: { fontSize: 12, color: '#444' },
  removeBtn: {
    fontSize: 11, color: '#555', background: 'none', border: '1px solid #2a2a2a',
    borderRadius: 5, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
  },

  colorRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 },
  colorSwatch: {
    width: 26, height: 26, borderRadius: '50%', border: '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s',
  },
  colorSwatchActive: { border: '2px solid #fff', transform: 'scale(1.2)' },
  colorInput: { width: 26, height: 26, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0 },
  colorBar: { height: 5, borderRadius: 3, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 6px' },

  errorBox: { fontSize: 13, color: '#ef4444', background: '#1f0a0a', padding: '10px 14px', borderRadius: 6, marginBottom: 12 },
  successBox: { fontSize: 13, color: '#a3b554', background: '#1e3818', padding: '10px 14px', borderRadius: 6, marginBottom: 12 },

  saveBtn: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)',
    padding: '10px 22px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
    fontWeight: 500, marginTop: 4, width: 'fit-content',
  },

  // ── Premium Section ──
  premiumSection: {
    background: '#0e0e0e',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: 24,
    opacity: 0.8,
  },
  lockRow: { display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 },
  lockIcon: { fontSize: 20, flexShrink: 0, marginTop: 2 },
  premiumTitle: { fontSize: 15, fontWeight: 700, color: '#ccc', marginBottom: 6 },
  premiumSub: { fontSize: 13, color: '#555', lineHeight: 1.6 },
  domainExample: { color: '#888', fontFamily: 'monospace' },
  premiumBtn: {
    display: 'inline-block', background: 'none',
    border: '1px solid #3a3a3a', color: '#666',
    padding: '9px 18px', borderRadius: 7, fontSize: 13,
    textDecoration: 'none', cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
}
