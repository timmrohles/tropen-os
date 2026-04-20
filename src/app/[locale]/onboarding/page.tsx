'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/utils/supabase/client'
import type { ChatStyle, ModelPref, TeamSize } from './onboarding.types'
import { s } from './onboarding.styles'
import StepOrgSetup from './StepOrgSetup'
import StepTeam from './StepTeam'
import StepPersonalStyle from './StepPersonalStyle'
import StepAiAct from './StepAiAct'
import StepDone from './StepDone'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  // ── Auth ────────────────────────────────────────────────
  const [userId, setUserId] = useState('')
  const [orgId, setOrgId] = useState('')
  const [userRole, setUserRole] = useState('member')

  // ── UI State ────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [visible, setVisible] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // ── Step 1 – Org Setup ──────────────────────────────────
  const [orgName, setOrgName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('var(--accent)')
  const [guideName, setGuideName] = useState('Toro')

  // ── Step 2 – Team ───────────────────────────────────────
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null)
  const [inviteEmails, setInviteEmails] = useState(['', '', ''])

  // ── Step 3 – Persönlicher Stil ──────────────────────────
  const [userName, setUserName] = useState('')
  const [chatStyle, setChatStyle] = useState<ChatStyle>('structured')
  const [modelPref, setModelPref] = useState<ModelPref>('auto')

  // ── Step 4 – AI Act ─────────────────────────────────────
  const [aiActAcknowledged, setAiActAcknowledged] = useState(false)

  const isAdmin = ['owner', 'admin'].includes(userRole)

  // ── Init ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

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
        setStep(3) // Members starten bei Schritt 3
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

  // ── Abschluss ───────────────────────────────────────────
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

      document.cookie = 'onboarding_done=1; max-age=31536000; path=/'
      router.push('/audit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler.')
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="content-narrow" style={s.page}>
      {userId && (
        <div style={s.progressTrack}>
          <div style={{ ...s.progressBar, width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}

      <div style={{ ...s.content, opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}>
        {step === 1 && isAdmin && (
          <StepOrgSetup
            orgId={orgId}
            orgName={orgName} setOrgName={setOrgName}
            logoUrl={logoUrl} setLogoUrl={setLogoUrl}
            logoPreview={logoPreview} setLogoPreview={setLogoPreview}
            primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
            guideName={guideName} setGuideName={setGuideName}
            error={error} setError={setError}
            uploading={uploading} setUploading={setUploading}
            onNext={() => goTo(2)}
          />
        )}

        {step === 2 && isAdmin && (
          <StepTeam
            orgName={orgName}
            teamSize={teamSize} setTeamSize={setTeamSize}
            inviteEmails={inviteEmails} setInviteEmails={setInviteEmails}
            error={error}
            onBack={() => goTo(1)}
            onNext={() => goTo(3)}
          />
        )}

        {step === 3 && (
          <StepPersonalStyle
            isAdmin={isAdmin}
            guideName={guideName}
            userName={userName} setUserName={setUserName}
            chatStyle={chatStyle} setChatStyle={setChatStyle}
            modelPref={modelPref} setModelPref={setModelPref}
            error={error}
            onBack={() => goTo(2)}
            onNext={() => goTo(4)}
          />
        )}

        {step === 4 && (
          <StepAiAct
            isAdmin={isAdmin}
            guideName={guideName}
            aiActAcknowledged={aiActAcknowledged}
            setAiActAcknowledged={setAiActAcknowledged}
            error={error}
            onBack={() => goTo(3)}
            onNext={() => goTo(5)}
          />
        )}

        {step === 5 && (
          <StepDone
            isAdmin={isAdmin}
            orgName={orgName}
            userName={userName}
            guideName={guideName}
            error={error}
            saving={saving}
            onFinish={finish}
            onBack={() => goTo(4)}
          />
        )}
      </div>
    </div>
  )
}
