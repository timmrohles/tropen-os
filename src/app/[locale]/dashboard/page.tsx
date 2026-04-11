import { redirect } from 'next/navigation'
import { House, ArrowUp, ArrowDown, Minus, Plus, FolderOpen, Lightning, Target } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fetchUserOrgId, fetchScanProjects, fetchAuditRuns } from '@/lib/audit/page-data'

export const metadata = { title: 'Dashboard — Tropen OS' }

type ScoreStatus = 'production_grade' | 'stable' | 'risky' | 'prototype'

function getStatus(score: number): ScoreStatus {
  if (score >= 90) return 'production_grade'
  if (score >= 80) return 'stable'
  if (score >= 60) return 'risky'
  return 'prototype'
}

const STATUS_LABEL: Record<ScoreStatus, string> = {
  production_grade: 'Production Grade',
  stable:           'Stable',
  risky:            'Risky',
  prototype:        'Prototype',
}

// Score number color
const STATUS_COLOR: Record<ScoreStatus, string> = {
  production_grade: 'var(--accent)',
  stable:           'var(--accent)',
  risky:            '#E5A000',
  prototype:        'var(--error)',
}

// Badge: solid bg + white text
const STATUS_BADGE_BG: Record<ScoreStatus, string> = {
  production_grade: 'var(--accent)',
  stable:           'var(--accent)',
  risky:            '#E5A000',
  prototype:        'var(--error)',
}

function getNextStatus(status: ScoreStatus): { label: string; threshold: number } | null {
  if (status === 'prototype') return { label: 'Risky', threshold: 60 }
  if (status === 'risky')     return { label: 'Stable', threshold: 80 }
  if (status === 'stable')    return { label: 'Production Grade', threshold: 90 }
  return null
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours   = Math.floor(diff / 3600000)
  const days    = Math.floor(diff / 86400000)
  if (minutes < 60)  return `vor ${minutes}m`
  if (hours   < 24)  return `vor ${hours}h`
  if (days    < 7)   return `vor ${days}d`
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function stackLabel(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  const s = raw as { framework?: string | null; language?: string | null; database?: string | null }
  const parts = [s.framework, s.language, s.database].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await fetchUserOrgId(user.id)

  // ── Data ──────────────────────────────────────────────────────────────────
  const [scanProjects, allRuns] = orgId
    ? await Promise.all([
        fetchScanProjects(orgId),
        fetchAuditRuns(orgId),
      ])
    : [[], []]

  type RunRow = { id: string; project_name: string; percentage: number; status: string; created_at: string; scan_project_id: string | null }
  const runs = allRuns as RunRow[]

  const runsByProject = new Map<string | null, RunRow[]>()
  for (const run of runs) {
    const key = run.scan_project_id
    if (!runsByProject.has(key)) runsByProject.set(key, [])
    runsByProject.get(key)!.push(run)
  }

  const internalRuns = runsByProject.get(null) ?? []

  type ProjectCard = {
    id: string | null
    name: string
    score: number
    status: ScoreStatus
    trend: 'up' | 'down' | 'flat'
    trendDelta: number
    lastScanAt: string | null
    stack: string | null
  }

  const projectCards: ProjectCard[] = []

  if (internalRuns.length > 0) {
    const latest = internalRuns[0]
    const prev   = internalRuns[1]
    const score  = latest.percentage
    const delta  = prev ? score - prev.percentage : 0
    projectCards.push({
      id:         null,
      name:       latest.project_name ?? 'Tropen OS',
      score,
      status:     getStatus(score),
      trend:      delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat',
      trendDelta: Math.abs(delta),
      lastScanAt: latest.created_at,
      stack:      'Next.js 15, Supabase, TypeScript',
    })
  }

  type ScanProject = { id: string; name: string; last_score: number | null; last_scan_at: string | null; detected_stack: unknown }
  for (const p of scanProjects as ScanProject[]) {
    const projectRuns = runsByProject.get(p.id) ?? []
    const score       = p.last_score ?? projectRuns[0]?.percentage ?? 0
    const prev        = projectRuns[1]
    const delta       = prev ? score - prev.percentage : 0
    projectCards.push({
      id:         p.id,
      name:       p.name,
      score,
      status:     getStatus(score),
      trend:      delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat',
      trendDelta: Math.abs(delta),
      lastScanAt: p.last_scan_at,
      stack:      stackLabel(p.detected_stack),
    })
  }

  const hasProjects = projectCards.length > 0

  // No lowest-score highlight — differentiation via score color + badge only

  return (
    <div className="content-max">
      <style>{`
        .dash-project-card {
          transition: box-shadow 180ms, transform 180ms;
        }
        .dash-project-card:hover {
          box-shadow: 0 6px 20px rgba(26,23,20,0.10);
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <House size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Dashboard
          </h1>
          <p className="page-header-sub">
            {hasProjects
              ? `${projectCards.length} Projekt${projectCards.length !== 1 ? 'e' : ''} im Überblick`
              : 'Von der Idee zum production-reifen Produkt'}
          </p>
        </div>
        {hasProjects && (
          <div className="page-header-actions">
            <Link href="/audit/scan" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <Plus size={15} weight="bold" aria-hidden="true" />
              Projekt scannen
            </Link>
          </div>
        )}
      </div>

      {/* ── Empty State ────────────────────────────────────────────────────── */}
      {!hasProjects && (
        <>
          <div className="card" style={{ padding: '40px 40px 36px', textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.3 }}>
              Was hast du gebaut?<br />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Lass es uns prüfen.</span>
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
              60 Sekunden. Score + Top-Probleme. Kein Setup, kein Konto nötig für den ersten Scan.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/audit/scan"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '10px 20px', fontSize: 14 }}
              >
                <FolderOpen size={16} weight="bold" aria-hidden="true" />
                Ordner scannen
              </Link>
              <button className="btn btn-ghost" disabled style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5, cursor: 'default' }}>
                GitHub verbinden
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--border)', padding: '1px 6px', borderRadius: 4 }}>bald</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Lightning size={20} weight="fill" color="var(--accent)" aria-hidden="true" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Speedrun</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Sofort scannen, Score in 60 Sekunden. Sieh auf einen Blick was deine App production-ready macht.
              </p>
            </div>
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Target size={20} weight="fill" color="var(--accent)" aria-hidden="true" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Guided</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Schritt für Schritt zum Launch. Für jedes Finding gibt es einen Prompt den du direkt in Cursor oder Claude kopieren kannst.
              </p>
            </div>
            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <House size={20} weight="fill" color="var(--accent)" aria-hidden="true" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Rescue</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Bestehendes Projekt verbessern. Score-Verlauf zeigt dir ob du in die richtige Richtung gehst.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Project Grid ───────────────────────────────────────────────────── */}
      {hasProjects && (
        <>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
            color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
          }}>
            <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
            Deine Projekte
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {projectCards.map((p) => {
              const next       = getNextStatus(p.status)
              const pctToNext  = next ? next.threshold - p.score : null
              const auditHref  = p.id ? `/audit?project=${p.id}` : '/audit'
              const cardKey    = p.id ?? 'internal'
              const scoreColor = STATUS_COLOR[p.status]

              return (
                <Link
                  key={cardKey}
                  href={auditHref}
                  className="card dash-project-card"
                  style={{ padding: '20px 22px', textDecoration: 'none', display: 'block' }}
                >
                  {/* Project name + trend */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {p.name}
                    </span>
                    <TrendBadge trend={p.trend} delta={p.trendDelta} />
                  </div>

                  {/* Score + badge */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 40, fontWeight: 800,
                      color: scoreColor,
                      lineHeight: 1,
                      fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
                    }}>
                      {p.score.toFixed(0)}%
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '4px 10px', borderRadius: 4,
                      background: STATUS_BADGE_BG[p.status],
                      color: '#fff',
                      flexShrink: 0,
                    }}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>

                  {/* Progress text */}
                  {pctToNext && pctToNext > 0 ? (
                    <p style={{ fontSize: 12, color: scoreColor, marginBottom: 10, fontWeight: 500 }}>
                      Noch {Math.ceil(pctToNext)}% bis {next!.label}
                    </p>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 10, fontWeight: 500 }}>
                      Ziel erreicht
                    </p>
                  )}

                  {/* Meta: time + stack */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {p.lastScanAt && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {formatTimeAgo(p.lastScanAt)}
                      </span>
                    )}
                    {p.stack && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                        {p.stack}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}

            {/* Add project card */}
            <Link
              href="/audit/scan"
              className="card dash-project-card"
              style={{
                padding: '20px 22px', textDecoration: 'none', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                border: '1px dashed var(--border)', background: 'transparent',
                color: 'var(--text-tertiary)', fontSize: 13, minHeight: 120,
              }}
            >
              <Plus size={16} weight="bold" aria-hidden="true" />
              Neues Projekt scannen
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function TrendBadge({ trend, delta }: { trend: 'up' | 'down' | 'flat'; delta: number }) {
  if (trend === 'flat' || delta < 0.1) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-tertiary)' }}>
        <Minus size={12} weight="bold" aria-hidden="true" />
      </span>
    )
  }
  if (trend === 'up') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
        <ArrowUp size={12} weight="bold" aria-hidden="true" />
        +{delta.toFixed(1)}%
      </span>
    )
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--error)', fontWeight: 600 }}>
      <ArrowDown size={12} weight="bold" aria-hidden="true" />
      -{delta.toFixed(1)}%
    </span>
  )
}
