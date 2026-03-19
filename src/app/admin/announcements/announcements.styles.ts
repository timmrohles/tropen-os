import type React from 'react'

export const s: Record<string, React.CSSProperties> = {
  formTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px 20px',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '9px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '9px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    minHeight: 72,
    fontFamily: 'inherit',
  },
  formFooter: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid var(--border)',
  },
  muted: {
    color: 'var(--text-tertiary)',
    fontSize: 14,
    padding: '24px 0',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  errorBanner: {
    background: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 16,
  },
  rowMeta: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    marginTop: 3,
  },
  rowActions: {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  },
}

export function typeBadgeStyle(type: string): React.CSSProperties {
  if (type === 'warning') {
    return { ...s.typeBadge, background: 'var(--warning-bg)', color: 'var(--text-secondary)' }
  }
  if (type === 'update') {
    return { ...s.typeBadge, background: 'var(--accent-light)', color: 'var(--accent)' }
  }
  return { ...s.typeBadge, background: 'var(--bg-inset)', color: 'var(--text-tertiary)' }
}
