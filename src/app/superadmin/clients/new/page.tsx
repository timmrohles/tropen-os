'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    org_name: '',
    plan: 'free' as 'free' | 'pro' | 'enterprise',
    org_budget_limit: '',
    workspace_name: 'Haupt-Workspace',
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
      if (!res.ok) {
        setError(data.error ?? 'Fehler beim Anlegen.')
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/superadmin/clients'), 2000)
      }
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div style={s.page}>
        <div style={s.successBox}>
          <div style={s.successIcon}>🦜</div>
          <h2 style={s.successHeading}>Client angelegt!</h2>
          <p style={s.successText}>
            Einladung wurde an {form.owner_email} gesendet. Weiterleitung…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <Link href="/superadmin/clients" style={s.backLink}>← Alle Clients</Link>
      <h1 style={s.heading}>Neuer Client</h1>

      <form onSubmit={handleSubmit} style={s.form}>
        {/* Section 1 – Organisation */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Organisation</div>
          <div style={s.field}>
            <label style={s.label}>Firmenname</label>
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
              <label style={s.label}>Plan</label>
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
              <label style={s.label}>Budget Limit Org</label>
              <input
                style={s.input}
                type="number"
                name="org_budget_limit"
                value={form.org_budget_limit}
                onChange={handleChange}
                placeholder="Kein Limit"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Section 2 – Workspace */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Workspace</div>
          <div style={s.row}>
            <div style={{ ...s.field, flex: 2 }}>
              <label style={s.label}>Workspace-Name</label>
              <input
                style={s.input}
                type="text"
                name="workspace_name"
                value={form.workspace_name}
                onChange={handleChange}
                required
                placeholder="Haupt-Workspace"
              />
            </div>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Budget Limit Workspace</label>
              <input
                style={s.input}
                type="number"
                name="workspace_budget_limit"
                value={form.workspace_budget_limit}
                onChange={handleChange}
                placeholder="Kein Limit"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Section 3 – Owner einladen */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Owner einladen</div>
          <div style={s.field}>
            <label style={s.label}>E-Mail</label>
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
              Einladungsmail wird sofort versendet. Owner landet im Onboarding.
            </p>
          </div>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.buttonRow}>
          <button type="submit" style={s.submitBtn} disabled={saving}>
            {saving ? 'Wird angelegt…' : 'Client anlegen & Einladung senden'}
          </button>
          <Link href="/superadmin/clients" style={s.cancelBtn}>
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    padding: '32px 24px',
    maxWidth: 640,
    margin: '0 auto',
  },
  backLink: {
    color: '#555',
    fontSize: 12,
    textDecoration: 'none',
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    marginTop: 8,
    marginBottom: 24,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 10,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: 2,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: 600,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: '9px 12px',
    borderRadius: 7,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: 11,
    color: '#444',
    marginTop: 6,
    marginBottom: 0,
  },
  error: {
    background: '#1a0a0a',
    border: '1px solid #3a1a1a',
    color: '#f87171',
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
  submitBtn: {
    background: '#14b8a6',
    color: '#000',
    fontWeight: 700,
    fontSize: 14,
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    cursor: 'pointer',
  },
  cancelBtn: {
    border: '1px solid #2a2a2a',
    color: '#666',
    textDecoration: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
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
    color: '#fff',
    margin: 0,
  },
  successText: {
    fontSize: 14,
    color: '#555',
    margin: 0,
  },
}
