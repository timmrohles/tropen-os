'use client'

import { Badge } from '@tremor/react'
import type { QaComplianceStatus } from '@/types/qa'

// ── Styles ──────────────────────────────────────────────────────────────

export const s: Record<string, React.CSSProperties> = {
  skeleton: {
    borderRadius: 6,
    background: 'var(--border)',
  },
  sectionCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 24,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-tertiary)',
  },
  kpiCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 24,
  },
  kpiLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-tertiary)',
    marginBottom: 8,
  },
  kpiSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  thCell: {
    textAlign: 'left' as const,
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  tdCell: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  trBorder: {
    borderTop: '1px solid var(--border)',
  },
  textPrimary: { color: 'var(--text-primary)' },
  textSecondary: { color: 'var(--text-secondary)' },
  textTertiary: { color: 'var(--text-tertiary)' },
  textMuted: { color: 'var(--text-muted)' },
  textAccent: { color: 'var(--accent)' },
  textWarning: { color: 'var(--warning)' },
  textError: { color: 'var(--error)' },
  textInfo: { color: 'var(--info)' },
  mono: { fontFamily: 'monospace' },
}

// ── Color helpers ───────────────────────────────────────────────────────

/** Map model name to CSS variable color */
export const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4': 'var(--accent)',
  'gpt-4o': 'var(--info)',
  'gemini-1.5-pro': 'var(--warning)',
  'mistral-large': 'var(--text-secondary)', /* no purple in design system */
}

export const MODEL_TREMOR_COLORS: Record<string, 'emerald' | 'blue' | 'yellow' | 'violet'> = {
  'claude-sonnet-4': 'emerald',
  'gpt-4o': 'blue',
  'gemini-1.5-pro': 'yellow',
  'mistral-large': 'violet',
}

export function modelColor(model: string): string {
  return MODEL_COLORS[model] ?? 'var(--text-secondary)'
}

/** Return inline color style for a score-based value */
export function scoreColor(ok: boolean): React.CSSProperties {
  return { color: ok ? 'var(--accent)' : 'var(--error)' }
}

export function latencyColor(status: string, latencyMs: number | null): React.CSSProperties {
  if (status !== 'success') return { color: 'var(--error)' }
  if (latencyMs !== null && latencyMs < 400) return { color: 'var(--accent)' }
  return { color: 'var(--warning)' }
}

// ── Skeleton ────────────────────────────────────────────────────────────

export function Skeleton({ width, height }: { width?: string | number; height?: string | number }) {
  return (
    <div
      className="animate-pulse"
      style={{
        ...s.skeleton,
        width: width ?? '100%',
        height: height ?? 16,
      }}
    />
  )
}

// ── StatusBadge ─────────────────────────────────────────────────────────

type StatusBadgeColor = 'emerald' | 'yellow' | 'red'

const STATUS_MAP: Record<QaComplianceStatus, { color: StatusBadgeColor; label: string }> = {
  pass: { color: 'emerald', label: '+ OK' },
  warn: { color: 'yellow', label: 'Offen' },
  fail: { color: 'red', label: 'Fehlt' },
}

export function StatusBadge({ status }: { status: QaComplianceStatus }) {
  const { color, label } = STATUS_MAP[status]
  return <Badge color={color}>{label}</Badge>
}

// ── SectionCard ─────────────────────────────────────────────────────────

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={s.sectionCard}>
      <div style={s.sectionHeader}>
        <span style={s.sectionLabel}>{title}</span>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}

// ── KpiCard ─────────────────────────────────────────────────────────────

export function KpiCard({
  label,
  value,
  sub,
  valueColor = 'var(--accent)',
  loading = false,
}: {
  label: string
  value: string
  sub: string
  valueColor?: string
  loading?: boolean
}) {
  return (
    <div style={s.kpiCard}>
      <div style={s.kpiLabel}>{label}</div>
      {loading ? (
        <Skeleton height={32} width={96} />
      ) : (
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1,
            marginBottom: 4,
            color: valueColor,
          }}
        >
          {value}
        </div>
      )}
      <div style={s.kpiSub}>{sub}</div>
    </div>
  )
}
