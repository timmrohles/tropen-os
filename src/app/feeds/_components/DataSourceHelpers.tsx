'use client'
// src/app/feeds/_components/DataSourceHelpers.tsx — pure helpers, constants, FormState, form layout JSX

import React from 'react'

// ─── helpers ──────────────────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)   return 'gerade eben'
  if (m < 60)  return `vor ${m} Min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `vor ${h}h`
  return `vor ${Math.floor(h / 24)}d`
}

export function authLabel(type: string | null): string {
  if (!type || type === 'none') return 'Keine Auth'
  if (type === 'bearer')  return 'Bearer'
  if (type === 'api_key') return 'API-Key'
  if (type === 'basic')   return 'Basic Auth'
  return type
}

export function intervalLabel(sec: number): string {
  if (sec === 0)     return 'Manuell'
  if (sec <= 300)    return 'Alle 5 Min'
  if (sec <= 3600)   return 'Stündlich'
  if (sec <= 86400)  return 'Täglich'
  return `${sec}s`
}

export const INTERVAL_OPTIONS = [
  { label: 'Manuell',      value: 0 },
  { label: 'Alle 5 Min',   value: 300 },
  { label: 'Stündlich',    value: 3600 },
  { label: 'Täglich',      value: 86400 },
]

export const AUTH_OPTIONS = [
  { label: 'Keine',        value: 'none' },
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'API-Key',      value: 'api_key' },
  { label: 'Basic Auth',   value: 'basic' },
]

// ─── blank form state ──────────────────────────────────────────────────────────

export function blankForm() {
  return {
    name: '', description: '', url: 'https://',
    method: 'GET' as 'GET' | 'POST',
    authType: 'none',
    bearerToken: '', apiKeyHeader: 'X-API-Key', apiKeyValue: '',
    basicUser: '', basicPassword: '',
    fetchInterval: 3600,
    schemaPath: '',
  }
}

export type FormState = ReturnType<typeof blankForm>

export function buildAuthConfig(form: FormState): Record<string, string> {
  if (form.authType === 'bearer')  return { token: form.bearerToken }
  if (form.authType === 'api_key') return { header: form.apiKeyHeader, key: form.apiKeyValue }
  if (form.authType === 'basic')   return { username: form.basicUser, password: form.basicPassword }
  return {}
}

// ─── form layout helpers ───────────────────────────────────────────────────────

export function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '14px 0 8px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

export function FormField({
  label, optional, hint, children,
}: {
  label: string
  optional?: boolean
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="tdrawer-label">
        {label}
        {optional && <span className="tdrawer-optional"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '5px 0 0', lineHeight: 1.55 }}>
          {hint}
        </p>
      )}
    </div>
  )
}
