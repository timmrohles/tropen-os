'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function NewClientPage() {
  const router = useRouter()
  const t = useTranslations('superadmin')
  const [form, setForm] = useState({
    org_name: '',
    plan: 'free' as 'free' | 'pro' | 'enterprise',
    org_budget_limit: '',
    workspace_name: 'Haupt-Department',
    workspace_budget_limit: '',
    owner_email: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/superadmin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: form.org_name.trim(),
          plan: form.plan,
          org_budget_limit: form.org_budget_limit ? parseFloat(form.org_budget_limit) : null,
          workspace_name: form.workspace_name.trim(),
          workspace_budget_limit: form.workspace_budget_limit ? parseFloat(form.workspace_budget_limit) : null,
          owner_email: form.owner_email.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/superadmin/clients'), 2000)
      } else {
        setError(data.error ?? 'Fehler beim Anlegen.')
      }
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={s.successBox}>
          <div style={s.successIcon}>🦜</div>
          <h2 style={s.successHeading}>{t('newClient.successTitle')}</h2>
          <p style={s.successText}>
            {t('newClient.successText', { email: form.owner_email })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">{t('newClient.title')}</h1>
          <p className="page-header-sub">{t('newClient.subtitle')}</p>
        </div>
      </div>

      <Link href="/superadmin/clients" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: 'inline-flex' }}>{t('newClient.backBtn')}</Link>

      <form onSubmit={handleSubmit} style={s.form}>
        {/* Section 1 – Organisation */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '20px 24px' }}>
            <div style={s.sectionLabel}>{t('newClient.sectionOrg')}</div>
            <div style={s.field}>
              <label style={s.label}>{t('newClient.firmenname')}</label>
              <input
                style={s.input}
                type="text"
                name="org_name"
                value={form.org_name}
                onChange={handleChange}
                required
                placeholder="Firmenname"
              />
            </div>
            <div style={s.row}>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{t('newClient.plan')}</label>
                <select
                  style={s.input}
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{t('newClient.budgetLimitOrg')}</label>
                <input
                  style={s.input}
                  type="number"
                  name="org_budget_limit"
                  value={form.org_budget_limit}
                  onChange={handleChange}
                  placeholder={t('newClient.noLimit')}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 – Department */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '20px 24px' }}>
            <div style={s.sectionLabel}>{t('newClient.sectionDept')}</div>
            <div style={s.row}>
              <div style={{ ...s.field, flex: 2 }}>
                <label style={s.label}>{t('newClient.deptName')}</label>
                <input
                  style={s.input}
                  type="text"
                  name="workspace_name"
                  value={form.workspace_name}
                  onChange={handleChange}
                  required
                  placeholder="Haupt-Department"
                />
              </div>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{t('newClient.budgetLimitDept')}</label>
                <input
                  style={s.input}
                  type="number"
                  name="workspace_budget_limit"
                  value={form.workspace_budget_limit}
                  onChange={handleChange}
                  placeholder={t('newClient.noLimit')}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 – Owner einladen */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '20px 24px' }}>
            <div style={s.sectionLabel}>{t('newClient.sectionOwner')}</div>
            <div style={s.field}>
              <label style={s.label}>{t('newClient.emailLabel')}</label>
              <input
                style={s.input}
                type="email"
                name="owner_email"
                value={form.owner_email}
                onChange={handleChange}
                required
                placeholder="owner@beispiel.de"
              />
              <p style={s.hint}>
                {t('newClient.inviteHint')}
              </p>
            </div>
          </div>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.buttonRow}>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={saving}>
            {saving ? t('newClient.saving') : t('newClient.submit')}
          </button>
          <Link href="/superadmin/clients" className="btn btn-ghost">
            {t('newClient.cancel')}
          </Link>
        </div>
      </form>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  sectionLabel: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: 12,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  label: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '9px 12px',
    borderRadius: 7,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    marginTop: 6,
    marginBottom: 0,
  },
  error: {
    background: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
    color: 'var(--error)',
    borderRadius: 7,
    padding: '10px 14px',
    fontSize: 13,
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 12,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 48,
    lineHeight: 1,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  successText: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: 0,
  },
}
