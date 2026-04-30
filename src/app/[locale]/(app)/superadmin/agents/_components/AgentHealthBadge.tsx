'use client'

// AgentHealthBadge — status indicator for an agent in the registry
// active = normalized + rules in registry + checked recently
// draft  = normalized but rules not yet in registry
// outdated = last check > 90 days or version stale

export type AgentStatus = 'active' | 'draft' | 'outdated' | 'deprecated'

interface Props {
  status: AgentStatus
  lastCheckAt?: string | null
}

const STATUS_CONFIG: Record<AgentStatus, { dot: string; label: string; color: string }> = {
  active:     { dot: '🟢', label: 'Aktiv',       color: 'var(--accent)' },
  draft:      { dot: '🟡', label: 'Entwurf',     color: 'var(--warning)' },
  outdated:   { dot: '🔴', label: 'Veraltet',    color: 'var(--error)' },
  deprecated: { dot: '⚪', label: 'Deaktiviert', color: 'var(--text-tertiary)' },
}

export function AgentHealthBadge({ status, lastCheckAt }: Props) {
  // auto-downgrade to outdated if lastCheckAt is > 90 days ago
  let resolvedStatus = status
  if (status === 'active' && lastCheckAt) {
    // eslint-disable-next-line react-hooks/purity
    const days = (Date.now() - new Date(lastCheckAt).getTime()) / (1000 * 60 * 60 * 24)
    if (days > 90) resolvedStatus = 'outdated'
  }
  const resolvedCfg = STATUS_CONFIG[resolvedStatus]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: resolvedCfg.color,
        whiteSpace: 'nowrap',
      }}
      title={`Status: ${resolvedCfg.label}`}
    >
      <span aria-hidden="true" style={{ fontSize: 9 }}>{resolvedCfg.dot}</span>
      {resolvedCfg.label}
    </span>
  )
}
