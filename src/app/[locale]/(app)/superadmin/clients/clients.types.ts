// Types and styles for the Superadmin Clients page

export interface ImpModal {
  orgId: string
  userId: string
  email: string
}

export interface ImpForm {
  ticketRef: string
  durationMinutes: number
}

export interface OrgRow {
  id: string
  name: string
  plan: string
  budget_limit: number | null
  created_at: string
  workspaces: { id: string; name: string; budget_limit: number | null }[]
  organization_settings: { onboarding_completed: boolean }[]
  users: { id: string; email: string; role: string }[]
}

export interface EditState {
  org_name: string
  plan: string
  org_budget_limit: string
  workspace_name: string
  workspace_budget_limit: string
  owner_email: string
}

export const owner = (org: OrgRow) =>
  (org.users.find((u) => u.role === 'owner') ?? org.users.find((u) => u.role === 'superadmin'))?.email ?? '–'

export const onboardingDone = (org: OrgRow) =>
  org.organization_settings?.[0]?.onboarding_completed === true

export const planStyle: Record<string, React.CSSProperties> = {
  free:       { background: '#4a5568', color: '#ffffff' },
  pro:        { background: 'var(--accent)', color: '#ffffff' },
  enterprise: { background: 'var(--accent)', color: '#ffffff', border: '1px solid var(--accent)' },
}

export const s: Record<string, React.CSSProperties> = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, color: 'var(--text-primary)', tableLayout: 'fixed' },
  th: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '12px 12px', verticalAlign: 'middle', color: 'var(--text-primary)' },
  orgName: { fontWeight: 500, color: 'var(--text-primary)' },
  orgId: { color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 },
  wsName: { color: 'var(--text-secondary)' },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
    letterSpacing: '0.03em',
  },
  badgeDone: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 4,
    fontSize: 12, fontWeight: 600, background: 'var(--accent-subtle)', color: 'var(--accent)',
  },
  badgePending: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 4,
    fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)',
  },
  actions: { display: 'flex', gap: 8, flexWrap: 'nowrap' },
  muted: { color: 'var(--text-tertiary)', fontSize: 14, padding: '24px 0' },

  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: 'var(--bg-elevated)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '32px 36px',
    width: 440,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' },
  label: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 },
  input: {
    background: 'var(--bg-input)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'var(--text-primary)',
    padding: '9px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 },
  confirmText: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px' },

  // User expand
  expandBtn: {
    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
    fontSize: 12, cursor: 'pointer', padding: '2px 0', textAlign: 'left' as const,
  },
  userList: { marginTop: 8, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  userRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 5,
  },
  userEmail: { fontSize: 12, color: 'var(--text-primary)' },
  userRole: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 },
  impWarning: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7, padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)',
    lineHeight: 1.6, marginBottom: 8,
  },
}
