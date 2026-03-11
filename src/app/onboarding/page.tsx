'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Parrot from '@/components/Parrot'
import {
  User, Users, Buildings,
  Lightning, ListBullets, Article,
  Globe, Robot,
  ChatCircle, ChartBar, Scales,
} from '@phosphor-icons/react'

// ─────────────────────────────────────────────────────────
// Typen & Konstanten
// ─────────────────────────────────────────────────────────

type ChatStyle = 'clear' | 'structured' | 'detailed'
type ModelPref = 'cheapest' | 'eu_only' | 'auto'
type TeamSize = 'solo' | 'small' | 'large'
type IconNode = React.ReactNode

const PRESET_COLORS = ['#a3b554', '#6366f1', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981']


// ─────────────────────────────────────────────────────────
// Hauptkomponente
// ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Auth ────────────────────────────────────────────────
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [orgId, setOrgId] = useState('')
  const [userRole, setUserRole] = useState('member')

  // ── UI State ────────────────────────────────────────────
  const [step, setStep] = useState(1)   // 1–4 per Spec
  const [visible, setVisible] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // ── Step 1 – Org Setup ──────────────────────────────────
  const [orgName, setOrgName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#a3b554')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [guideName, setGuideName] = useState('Toro')
  const [dragging, setDragging] = useState(false)

  // ── Step 2 – Team ───────────────────────────────────────
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null)
  const [inviteEmails, setInviteEmails] = useState(['', '', ''])

  // ── Step 3 – Persönlicher Stil ──────────────────────────
  const [userName, setUserName] = useState('')
  const [chatStyle, setChatStyle] = useState<ChatStyle>('structured')
  const [modelPref, setModelPref] = useState<ModelPref>('auto')

  // ── Step 4 – AI Act ─────────────────────────────────────
  const [aiActAcknowledged, setAiActAcknowledged] = useState(false)
  const [aiActExpanded, setAiActExpanded] = useState(false)

  const isAdmin = ['owner', 'admin'].includes(userRole)

  // ── Init ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const meta = user.user_metadata as { organization_id?: string; role?: string }
      let orgIdVal = meta.organization_id ?? ''
      let roleVal = meta.role ?? 'member'

      // Fallback: public.users laden (Owner wurden nicht per Einladung angelegt)
      if (!orgIdVal) {
        const { data: profile } = await supabase
          .from('users')
          .select('organization_id, role')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.organization_id) {
          orgIdVal = profile.organization_id
          roleVal = profile.role ?? roleVal
        }
      }

      setOrgId(orgIdVal)
      setUserRole(roleVal)
      if (!['owner', 'admin'].includes(roleVal)) {
        setStep(3)  // Members starten bei Schritt 3
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fortschritt ─────────────────────────────────────────
  const firstStep = isAdmin ? 1 : 3
  const totalSteps = isAdmin ? 5 : 3
  const progress = (step - firstStep + 1) / totalSteps

  // ── Navigation mit Fade ─────────────────────────────────
  function goTo(next: number) {
    setError('')
    setVisible(false)
    setTimeout(() => { setStep(next); setVisible(true) }, 150)
  }

  // ── Logo Upload ─────────────────────────────────────────
  async function uploadLogo(file: File) {
    if (!file.type.startsWith('image/')) { setError('Bitte ein Bild auswählen.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo max. 2 MB.'); return }
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${orgId || 'tmp'}/logo-${Date.now()}.${ext}`
    const { data, error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError('Upload fehlgeschlagen. Stelle sicher, dass der Bucket "organization-logos" existiert.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(data.path)
    setLogoUrl(publicUrl)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadLogo(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadLogo(file)
  }

  // ── Abschluss: alles über Server-API speichern (Service Role, bypasses RLS) ──
  async function finish() {
    if (!userName.trim()) { setError('Bitte deinen Namen eingeben.'); return }
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        full_name: userName.trim(),
        chat_style: chatStyle,
        model_preference: modelPref,
        ai_act_acknowledged: aiActAcknowledged,
        ai_act_acknowledged_at: new Date().toISOString(),
      }
      if (isAdmin) {
        body.org_name = orgName.trim()
        body.logo_url = logoUrl
        body.primary_color = primaryColor
        body.guide_name = guideName.trim() || 'Toro'
        body.invite_emails = inviteEmails.filter((e) => e.trim() && e.includes('@'))
      }

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Speichern fehlgeschlagen.')
      }

      // Onboarding-Cookie setzen (Proxy-Cache)
      document.cookie = 'onboarding_done=1; max-age=31536000; path=/'
      router.push('/workspaces')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler.')
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Fortschrittsbalken */}
      {userId && (
        <div style={s.progressTrack}>
          <div style={{ ...s.progressBar, width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}

      {/* Step-Content mit Fade */}
      <div style={{ ...s.content, opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}>

        {/* ── STEP 1: Deine Organisation ── */}
        {step === 1 && isAdmin && (
          <div style={s.step}>
            <div style={s.stepLabel}>Schritt 1 von 5</div>
            <h1 style={s.h1}>Wie heißt deine Organisation?</h1>
            <p style={s.sub}>Richte dein Workspace-Branding ein. Du kannst alles später anpassen.</p>

            <div style={s.field}>
              <label style={s.label}>Firmenname *</label>
              <input
                style={s.input}
                placeholder="Muster GmbH"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                autoFocus
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Logo</label>
              <div
                style={{ ...s.dropZone, ...(dragging ? s.dropZoneActive : {}), ...(logoPreview ? s.dropZoneHasLogo : {}) }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={s.logoPreview} />
                ) : uploading ? (
                  <span style={s.dropHint}>Wird hochgeladen…</span>
                ) : (
                  <>
                    <span style={{ fontSize: 28 }}>📁</span>
                    <span style={s.dropHint}>Logo ablegen oder klicken</span>
                    <span style={s.dropSub}>PNG · SVG · JPG · max. 2 MB</span>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
              {logoPreview && (
                <button style={s.removeLogo} onClick={() => { setLogoPreview(null); setLogoUrl(null) }}>
                  Logo entfernen
                </button>
              )}
            </div>

            <div style={s.field}>
              <label style={s.label}>Primärfarbe</label>
              <div style={s.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    style={{ ...s.colorSwatch, background: c, ...(primaryColor === c ? s.colorSwatchActive : {}) }}
                    onClick={() => { setPrimaryColor(c); setShowColorPicker(false) }}
                    title={c}
                  />
                ))}
                <button
                  style={{ ...s.colorSwatch, background: '#1e1e1e', border: '1px dashed #555' }}
                  onClick={() => setShowColorPicker((v) => !v)}
                  title="Eigene Farbe"
                >
                  <span style={{ fontSize: 14, color: '#888' }}>+</span>
                </button>
                {showColorPicker && (
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={s.colorInput}
                  />
                )}
              </div>
              <div style={{ ...s.colorPreviewBar, background: primaryColor }}>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.7)', fontWeight: 600 }}>{primaryColor}</span>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Name deines KI-Assistenten</label>
              <input
                style={s.input}
                placeholder="Toro"
                value={guideName}
                onChange={(e) => setGuideName(e.target.value)}
              />
              <span style={s.hint}>So heißt dein KI-Assistent im Workspace. Beliebig wählbar.</span>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button
              style={{ ...s.btnPrimary, ...(!orgName.trim() || uploading ? s.btnDisabled : {}) }}
              disabled={!orgName.trim() || uploading}
              onClick={() => goTo(2)}
            >
              Weiter →
            </button>
          </div>
        )}

        {/* ── STEP 2: Dein Team ── */}
        {step === 2 && isAdmin && (
          <div style={s.step}>
            <div style={s.stepLabel}>Schritt 2 von 5</div>
            <h1 style={s.h1}>Wie nutzt du {orgName || 'den Workspace'}?</h1>
            <p style={s.sub}>Das hilft uns, den Workspace optimal einzurichten.</p>

            <div style={s.cardRow}>
              {([
                { value: 'solo',  icon: <User size={24} weight="duotone" />, title: 'Nur ich',       sub: 'Solo-Nutzung' },
                { value: 'small', icon: <Users size={24} weight="duotone" />, title: 'Kleines Team',   sub: '2–10 Personen' },
                { value: 'large', icon: <Buildings size={24} weight="duotone" />, title: 'Größeres Team',  sub: '10+ Personen' },
              ] as { value: TeamSize; icon: IconNode; title: string; sub: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  style={{ ...s.card, ...(teamSize === opt.value ? s.cardActive : {}) }}
                  onClick={() => setTeamSize(opt.value)}
                >
                  <span style={s.cardEmoji}>{opt.icon}</span>
                  <span style={s.cardTitle}>{opt.title}</span>
                  <span style={s.cardSub}>{opt.sub}</span>
                </button>
              ))}
            </div>

            {teamSize && teamSize !== 'solo' && (
              <div style={{ ...s.field, marginTop: 28 }}>
                <label style={s.label}>Erste Teammitglieder einladen (optional)</label>
                {inviteEmails.map((email, i) => (
                  <input
                    key={i}
                    style={{ ...s.input, marginBottom: 8 }}
                    placeholder={`Email ${i + 1}`}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const next = [...inviteEmails]
                      next[i] = e.target.value
                      setInviteEmails(next)
                    }}
                  />
                ))}
                <span style={s.hint}>Einladungen werden nach Abschluss des Onboardings versendet.</span>
              </div>
            )}

            {error && <div style={s.error}>{error}</div>}

            <div style={s.btnRow}>
              <button style={s.btnSecondary} onClick={() => goTo(1)}>← Zurück</button>
              <button
                style={{ ...s.btnPrimary, ...(teamSize === null ? s.btnDisabled : {}) }}
                disabled={teamSize === null}
                onClick={() => goTo(3)}
              >
                {inviteEmails.some((e) => e.trim() && e.includes('@'))
                  ? 'Einladen & Weiter →'
                  : 'Weiter →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Dein persönlicher Stil ── */}
        {step === 3 && (
          <div style={s.step}>
            <div style={s.stepLabel}>{isAdmin ? 'Schritt 3 von 5' : 'Schritt 1 von 3'}</div>
            <h1 style={s.h1}>Wie soll {guideName || 'Toro'} mit dir sprechen?</h1>
            <p style={s.sub}>Personalisiere deinen KI-Assistenten.</p>

            <div style={s.field}>
              <label style={s.label}>Wie heißt du? *</label>
              <input
                style={s.input}
                placeholder="Vorname Nachname"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoFocus={!isAdmin}
              />
            </div>

            <div style={{ ...s.field, marginTop: 28 }}>
              <label style={s.label}>Antwortstil</label>
              <div style={s.cardRow}>
                {([
                  { value: 'clear',      icon: <Lightning size={24} weight="duotone" />, title: 'Klar & Direkt',  sub: 'Kurze, präzise Antworten. Kein Overhead.' },
                  { value: 'structured', icon: <ListBullets size={24} weight="duotone" />, title: 'Strukturiert',   sub: 'Abschnitte, Listen, klare Übersichten.' },
                  { value: 'detailed',   icon: <Article size={24} weight="duotone" />, title: 'Ausführlich',     sub: 'Tiefe Analysen, viel Kontext, vollständige Erklärungen.' },
                ] as { value: ChatStyle; icon: IconNode; title: string; sub: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    style={{ ...s.card, ...(chatStyle === opt.value ? s.cardActive : {}) }}
                    onClick={() => setChatStyle(opt.value)}
                  >
                    <span style={s.cardEmoji}>{opt.icon}</span>
                    <span style={s.cardTitle}>{opt.title}</span>
                    <span style={s.cardSub}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...s.field, marginTop: 20 }}>
              <label style={s.label}>Modell-Präferenz</label>
              <div style={s.chipRow}>
                {([
                  { value: 'cheapest', icon: <Lightning size={13} weight="duotone" />, label: 'Immer günstigstes Modell' },
                  { value: 'eu_only',  icon: <Globe size={13} weight="duotone" />, label: 'Nur europäische Modelle' },
                  { value: 'auto',     icon: <Robot size={13} weight="duotone" />, label: 'Automatisch (empfohlen)' },
                ] as { value: ModelPref; icon: IconNode; label: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    style={{ ...s.chip, ...(modelPref === opt.value ? s.chipActive : {}) }}
                    onClick={() => setModelPref(opt.value)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {opt.icon}{opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.btnRow}>
              {isAdmin && (
                <button style={s.btnSecondary} onClick={() => goTo(2)}>← Zurück</button>
              )}
              <button
                style={{ ...s.btnPrimary, ...(!userName.trim() ? s.btnDisabled : {}) }}
                disabled={!userName.trim()}
                onClick={() => goTo(4)}
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: AI Act & Verantwortungsvolle Nutzung ── */}
        {step === 4 && (
          <div style={s.step}>
            <div style={s.stepLabel}>{isAdmin ? 'Schritt 4 von 5' : 'Schritt 2 von 3'}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Parrot size={36} />
              <h1 style={{ ...s.h1, margin: 0, fontSize: 26 }}>Kurz bevor es losgeht.</h1>
            </div>

            <p style={s.aiActPara}>
              Der EU AI Act verpflichtet Unternehmen und ihre Mitarbeitenden dazu, im beruflichen
              Kontext über grundlegende KI-Kompetenzen zu verfügen.
            </p>
            <p style={s.aiActPara}>
              Was das bedeutet: Wer KI beruflich nutzt, sollte verstehen wie sie funktioniert,
              wo ihre Grenzen liegen und wie man verantwortungsvoll mit ihr umgeht.
            </p>
            <p style={{ ...s.aiActPara, marginBottom: 28 }}>
              Tropen OS ist ein Werkzeug – {guideName || 'Toro'} ist dein Guide.
              Aber das Steuer liegt bei dir.
            </p>

            {/* Pflicht-Checkbox */}
            <label style={s.checkboxLabel}>
              <input
                type="checkbox"
                style={s.checkbox}
                checked={aiActAcknowledged}
                onChange={(e) => setAiActAcknowledged(e.target.checked)}
              />
              <span style={s.checkboxText}>
                Ich habe verstanden, dass ich als berufliche/r Nutzer/in verpflichtet bin,
                KI-Grundkompetenzen zu erwerben oder weiterzuentwickeln.
              </span>
            </label>

            {/* Academy Card */}
            <div style={s.academyCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>🌿</span>
                <span style={s.academyTitle}>KI-Kompetenzen aufbauen – mit den Tropen</span>
              </div>
              <p style={s.academyText}>
                Tropen bietet Kurse und Zertifizierungen für verantwortungsvolle KI-Nutzung
                im Berufsalltag.
              </p>
              <p style={{ ...s.academyText, marginBottom: 12 }}>
                Unser Einstiegskurs:{' '}
                <strong style={{ color: '#c0c0c0' }}>"KI-Dschungel Survival Pass"</strong>
                {' '}– für alle die KI sicher, effektiv und verantwortungsvoll einsetzen wollen.
              </p>
              <a
                href="https://tropen.de/academy"
                target="_blank"
                rel="noopener noreferrer"
                style={s.academyLink}
              >Mehr erfahren →</a>
            </div>

            {/* EU AI Act Accordion */}
            <div style={s.accordionWrap}>
              <button
                style={s.accordionBtn}
                onClick={() => setAiActExpanded((v) => !v)}
              >
                Was ist der EU AI Act? {aiActExpanded ? '▴' : '▾'}
              </button>
              {aiActExpanded && (
                <div style={s.accordionBody}>
                  Der EU AI Act (in Kraft seit 2024) ist die erste umfassende KI-Regulierung
                  weltweit. Artikel 4 verpflichtet Unternehmen sicherzustellen, dass ihr Personal
                  über ausreichende KI-Kompetenz verfügt.
                </div>
              )}
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.btnRow}>
              <button style={s.btnSecondary} onClick={() => goTo(3)}>← Zurück</button>
              <button
                style={{ ...s.btnPrimary, ...(!aiActAcknowledged ? s.btnDisabled : {}) }}
                disabled={!aiActAcknowledged}
                onClick={() => goTo(5)}
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Fertig ── */}
        {step === 5 && (
          <div style={{ ...s.step, alignItems: 'center', textAlign: 'center' }}>
            <div style={s.stepLabel}>{isAdmin ? 'Schritt 5 von 5' : 'Schritt 3 von 3'}</div>

            <Parrot size={80} />

            <h1 style={{ ...s.h1, marginTop: 20 }}>
              Willkommen bei {orgName || 'Tropen OS'}
              {userName ? `, ${userName.split(' ')[0]}!` : '!'}
            </h1>
            <p style={s.sub}>
              <strong style={{ color: '#e5e5e5' }}>{guideName || 'Toro'}</strong>{' '}
              freut sich darauf, euch durch den Informationsdschungel zu führen.
            </p>

            <div style={s.featureRow}>
              {[
                { icon: <ChatCircle size={26} weight="duotone" style={{ color: '#a3b554' }} />, title: 'Workspaces',     sub: 'Team-Chats & Projekte' },
                { icon: <ChartBar size={26} weight="duotone" style={{ color: '#a3b554' }} />, title: 'Dashboard',      sub: 'Kosten & Nutzung' },
                { icon: <Scales size={26} weight="duotone" style={{ color: '#a3b554' }} />, title: 'Responsible AI', sub: 'Transparenz & Kontrolle' },
              ].map((f) => (
                <div key={f.title} style={s.featureCard}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</span>
                  <span style={s.featureTitle}>{f.title}</span>
                  <span style={s.featureSub}>{f.sub}</span>
                </div>
              ))}
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button
              style={{ ...s.btnPrimary, marginTop: 28, minWidth: 220 }}
              onClick={finish}
              disabled={saving}
            >
              {saving ? 'Wird gespeichert…' : 'Ersten Chat starten →'}
            </button>

            <button style={s.skipLink} onClick={() => goTo(4)}>
              ← Zurück
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // ── Layout ───────────────────────────────────────────────
  page: {
    minHeight: 'calc(100vh - 52px)',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    margin: '-32px',
  },
  progressTrack: {
    height: 3,
    background: '#1e1e1e',
    flexShrink: 0,
  },
  progressBar: {
    height: '100%',
    background: '#a3b554',
    transition: 'width 0.4s ease',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 24px 80px',
    overflowY: 'auto',
  },
  step: {
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },

  // ── Typography ───────────────────────────────────────────
  stepLabel: { fontSize: 12, color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  h1: { fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 8, margin: '0 0 10px' },
  sub: { fontSize: 15, color: '#666', lineHeight: 1.6, marginBottom: 32, margin: '0 0 32px' },
  label: { display: 'block', fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  hint: { display: 'block', fontSize: 12, color: '#444', marginTop: 6, lineHeight: 1.5 },
  error: { fontSize: 13, color: '#ef4444', background: '#1f0a0a', padding: '10px 14px', borderRadius: 6, marginTop: 8 },

  // ── Form ─────────────────────────────────────────────────
  field: { display: 'flex', flexDirection: 'column', marginBottom: 24 },
  input: {
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },

  // ── Logo Drop Zone ────────────────────────────────────────
  dropZone: {
    border: '1px dashed #2a2a2a',
    borderRadius: 10,
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    background: '#111',
    transition: 'border-color 0.15s, background 0.15s',
    minHeight: 100,
  },
  dropZoneActive: { borderColor: '#a3b554', background: '#1e3818' },
  dropZoneHasLogo: { borderColor: '#2a2a2a', padding: '16px', background: '#111' },
  logoPreview: { maxHeight: 64, maxWidth: '100%', objectFit: 'contain' },
  dropHint: { fontSize: 13, color: '#555' },
  dropSub: { fontSize: 11, color: '#333' },
  removeLogo: {
    background: 'none', border: 'none', color: '#444',
    fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
    textAlign: 'left', padding: '4px 0', width: 'fit-content',
  },

  // ── Color Picker ─────────────────────────────────────────
  colorRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  colorSwatch: {
    width: 30, height: 30, borderRadius: '50%', border: '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s, box-shadow 0.1s',
  },
  colorSwatchActive: { border: '2px solid #fff', transform: 'scale(1.15)', boxShadow: '0 0 0 2px rgba(255,255,255,0.15)' },
  colorInput: { width: 30, height: 30, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none', padding: 0 },
  colorPreviewBar: {
    height: 6, borderRadius: 3, transition: 'background 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    padding: '0 8px',
  },

  // ── Cards ────────────────────────────────────────────────
  cardRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  card: {
    flex: '1 1 140px', minWidth: 130,
    background: '#111', border: '1px solid #222',
    borderRadius: 10, padding: '18px 14px',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
    textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
  },
  cardActive: { background: '#1e3818', border: '1px solid #a3b554' },
  cardEmoji: { fontSize: 24 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#e5e5e5' },
  cardSub: { fontSize: 12, color: '#555', lineHeight: 1.4 },

  // ── Chips ────────────────────────────────────────────────
  chipRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: {
    fontSize: 12, padding: '8px 14px', borderRadius: 20,
    border: '1px solid #2a2a2a', background: '#111', color: '#666',
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
  },
  chipActive: { background: '#a3b554', border: '1px solid #a3b554', color: '#000', fontWeight: 600 },

  // ── Done Screen ──────────────────────────────────────────
  featureRow: { display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' },
  featureCard: {
    background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
    padding: '16px 14px', flex: '1 1 120px', maxWidth: 160,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  featureTitle: { fontSize: 13, fontWeight: 600, color: '#ccc' },
  featureSub: { fontSize: 11, color: '#555', textAlign: 'center' },

  // ── Buttons ──────────────────────────────────────────────
  btnRow: { display: 'flex', gap: 10, marginTop: 24 },
  btnPrimary: {
    background: '#a3b554', color: '#000', border: 'none',
    padding: '13px 28px', borderRadius: 8, cursor: 'pointer',
    fontSize: 15, fontWeight: 700, marginTop: 24,
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    background: 'none', color: '#555', border: '1px solid #2a2a2a',
    padding: '13px 20px', borderRadius: 8, cursor: 'pointer',
    fontSize: 14, marginTop: 24, transition: 'color 0.15s',
  },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  skipLink: {
    background: 'none', border: 'none', color: '#444',
    fontSize: 13, cursor: 'pointer', marginTop: 14,
    textDecoration: 'underline',
  },

  // ── AI Act ────────────────────────────────────────────────
  aiActPara: {
    fontSize: 15, color: '#888', lineHeight: 1.75,
    margin: '0 0 16px',
  },
  checkboxLabel: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '16px 18px', background: '#111',
    border: '1px solid #252525', borderRadius: 8,
    cursor: 'pointer', marginBottom: 24,
  },
  checkbox: {
    width: 17, height: 17, marginTop: 2, flexShrink: 0,
    accentColor: '#a3b554', cursor: 'pointer',
  },
  checkboxText: { fontSize: 14, color: '#ccc', lineHeight: 1.6 },
  academyCard: {
    background: '#08100f',
    borderWidth: '1px', borderStyle: 'solid', borderColor: '#1c3530',
    borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: '#a3b554',
    borderRadius: 8, padding: '18px 20px', marginBottom: 20,
  },
  academyTitle: { fontSize: 14, fontWeight: 600, color: '#b0b0b0' },
  academyText: { fontSize: 13, color: '#666', lineHeight: 1.65, margin: '0 0 8px' },
  academyLink: {
    fontSize: 13, color: '#a3b554', textDecoration: 'none',
    fontWeight: 500, display: 'inline-block',
  },
  accordionWrap: { marginBottom: 8 },
  accordionBtn: {
    background: 'none', border: 'none', color: '#555',
    fontSize: 13, cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  accordionBody: {
    marginTop: 10, padding: '12px 14px',
    background: '#0e0e0e', border: '1px solid #1e1e1e',
    borderRadius: 6, fontSize: 13, color: '#666', lineHeight: 1.7,
  },
}
