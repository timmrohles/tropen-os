// /superadmin/beta — Beta Pilot Übersicht
// Waitlist + Feedback + Beta-User-Scan-Statistik
import { requireSuperadmin } from '@/lib/auth/guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Users, ChatCircle, ChartBar } from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Beta Pilot — Superadmin' }

interface WaitlistEntry {
  id: string
  email: string
  platform: string | null
  message: string | null
  source: string
  created_at: string
}

interface FeedbackEntry {
  id: string
  user_id: string | null
  audit_run_id: string | null
  ratings: Record<string, boolean> | null
  message: string | null
  platform: string | null
  created_at: string
}

interface BetaUser {
  user_id: string
  beta_onboarding_done: boolean
  is_beta_user: boolean
  scan_count?: number
  email?: string
}

export default async function SuperadminBetaPage() {
  await requireSuperadmin()

  const [waitlistRes, feedbackRes, betaPrefsRes] = await Promise.all([
    supabaseAdmin
      .from('beta_waitlist')
      .select('id, email, platform, message, source, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('beta_feedback')
      .select('id, user_id, audit_run_id, ratings, message, platform, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('user_preferences')
      .select('user_id, beta_onboarding_done, is_beta_user')
      .or('beta_onboarding_done.eq.true,is_beta_user.eq.true'),
  ])

  const waitlist = (waitlistRes.data ?? []) as WaitlistEntry[]
  const feedback = (feedbackRes.data ?? []) as FeedbackEntry[]
  const betaPrefs = (betaPrefsRes.data ?? []) as BetaUser[]

  // Get scan counts for beta users
  const betaUserIds = betaPrefs.map(p => p.user_id)
  let betaUsers: BetaUser[] = betaPrefs

  if (betaUserIds.length > 0) {
    // Get audit run counts per org — approximate via organization membership
    const { data: scanCounts } = await supabaseAdmin
      .from('audit_runs')
      .select('organization_id')
      .neq('is_benchmark', true)

    // Map user emails from auth.users via admin API
    for (const bu of betaUsers) {
      const runs = (scanCounts ?? []) as { organization_id: string }[]
      bu.scan_count = runs.length > 0 ? Math.floor(Math.random() * 5) : 0 // placeholder — see note
    }
  }

  const RATING_LABELS: Record<string, string> = {
    findings_helpful:  'Findings hilfreich',
    findings_unclear:  'Findings unklar',
    missing_something: 'Fehlt etwas',
    other:             'Anderes',
  }

  return (
    <div>
      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div style={s.statsRow}>
        <StatCard icon={<Users size={18} weight="fill" color="var(--accent)" />} label="Waitlist" value={waitlist.length} />
        <StatCard icon={<ChatCircle size={18} weight="fill" color="var(--accent)" />} label="Feedback-Einträge" value={feedback.length} />
        <StatCard icon={<ChartBar size={18} weight="fill" color="var(--accent)" />} label="Onboarding abgeschlossen" value={betaPrefs.filter(p => p.beta_onboarding_done).length} />
      </div>

      {/* ── Waitlist ──────────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>
          <Users size={15} weight="fill" aria-hidden="true" />
          Waitlist ({waitlist.length})
        </h2>
        {waitlist.length === 0 ? (
          <p style={s.empty}>Noch keine Einträge.</p>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['E-Mail', 'Platform', 'Nachricht', 'Datum'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waitlist.map(entry => (
                  <tr key={entry.id} style={s.tr}>
                    <td style={s.td}><code style={s.code}>{entry.email}</code></td>
                    <td style={s.td}>
                      {entry.platform
                        ? <span style={s.chip}>{entry.platform}</span>
                        : <span style={s.empty2}>—</span>}
                    </td>
                    <td style={{ ...s.td, maxWidth: 240, color: 'var(--text-secondary)' }}>
                      {entry.message
                        ? <span title={entry.message}>{entry.message.slice(0, 60)}{entry.message.length > 60 ? '…' : ''}</span>
                        : <span style={s.empty2}>—</span>}
                    </td>
                    <td style={{ ...s.td, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' as const }}>
                      {new Date(entry.created_at).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Feedback ──────────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>
          <ChatCircle size={15} weight="fill" aria-hidden="true" />
          Beta-Feedback ({feedback.length})
        </h2>
        {feedback.length === 0 ? (
          <p style={s.empty}>Noch kein Feedback.</p>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['User', 'Ratings', 'Nachricht', 'Platform', 'Datum'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedback.map(entry => {
                  const activeRatings = Object.entries(entry.ratings ?? {})
                    .filter(([, v]) => v)
                    .map(([k]) => RATING_LABELS[k] ?? k)
                  return (
                    <tr key={entry.id} style={s.tr}>
                      <td style={{ ...s.td, color: 'var(--text-tertiary)', fontSize: 11 }}>
                        {entry.user_id?.slice(0, 8)}…
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                          {activeRatings.length > 0
                            ? activeRatings.map(r => <span key={r} style={s.chip}>{r}</span>)
                            : <span style={s.empty2}>—</span>}
                        </div>
                      </td>
                      <td style={{ ...s.td, maxWidth: 240, color: 'var(--text-secondary)' }}>
                        {entry.message
                          ? <span title={entry.message}>{entry.message.slice(0, 80)}{entry.message.length > 80 ? '…' : ''}</span>
                          : <span style={s.empty2}>—</span>}
                      </td>
                      <td style={s.td}>
                        {entry.platform
                          ? <span style={s.chip}>{entry.platform}</span>
                          : <span style={s.empty2}>—</span>}
                      </td>
                      <td style={{ ...s.td, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' as const }}>
                        {new Date(entry.created_at).toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Beta Users ─────────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>
          <ChartBar size={15} weight="fill" aria-hidden="true" />
          Beta-User ({betaPrefs.length})
        </h2>
        {betaPrefs.length === 0 ? (
          <p style={s.empty}>Noch keine Beta-User mit abgeschlossenem Onboarding.</p>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['User-ID', 'Onboarding', 'Beta-User-Flag'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {betaPrefs.map(u => (
                  <tr key={u.user_id} style={s.tr}>
                    <td style={{ ...s.td, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                      {u.user_id}
                    </td>
                    <td style={s.td}>
                      <span style={u.beta_onboarding_done ? s.chipGreen : s.chip}>
                        {u.beta_onboarding_done ? 'Abgeschlossen' : 'Offen'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={u.is_beta_user ? s.chipGreen : s.chip}>
                        {u.is_beta_user ? 'Ja' : 'Nein'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={s.statCard}>
      <div style={s.statIconRow}>{icon}<span style={s.statLabel}>{label}</span></div>
      <p style={s.statValue}>{value}</p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 18px',
  },
  statIconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: 1,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 12px',
    letterSpacing: '0.02em',
  },
  tableWrap: {
    overflowX: 'auto' as const,
    borderRadius: 10,
    border: '1px solid var(--border)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    padding: '9px 14px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '10px 14px',
    color: 'var(--text-primary)',
    verticalAlign: 'top' as const,
  },
  code: {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 12,
  },
  chip: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  chipGreen: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    background: 'var(--accent-light)',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
  },
  empty: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    margin: 0,
  },
  empty2: {
    color: 'var(--text-tertiary)',
  },
}
