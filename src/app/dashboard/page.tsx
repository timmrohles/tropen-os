import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import Link from 'next/link'
import PeriodTabs from './PeriodTabs'
import CostChart from './CostChart'
import Co2Card from './Co2Card'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type UsageRow = {
  user_id: string
  workspace_id: string
  cost_eur: number | null
  tokens_input: number | null
  tokens_output: number | null
  model_class: string | null
  created_at: string
  users: { full_name: string | null; email: string } | null
  workspaces: { name: string } | null
  model_catalog: { name: string } | null
}

// CO₂-Schätzfaktoren (g CO₂ pro 1k gewichtete Tokens)
const CO2_FACTORS: Record<string, { min: number; max: number }> = {
  fast: { min: 0.1, max: 0.3 },
  deep: { min: 0.5, max: 2.0 },
  safe: { min: 0.2, max: 0.8 },
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function periodStart(period: string): string {
  const d = new Date()
  if (period === 'today') {
    d.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    d.setDate(d.getDate() - 7)
    d.setHours(0, 0, 0, 0)
  } else {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d.toISOString()
}

function thirtyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function fmt(n: number) {
  return `€${n.toFixed(4)}`
}

// ------------------------------------------------------------------
// Shared styles
// ------------------------------------------------------------------
const labelStyle = {
  fontSize: 11,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '0 0 8px',
  fontWeight: 500,
}

const metricStyle = {
  fontSize: 26,
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  margin: 0,
  lineHeight: 1.2,
}

const metricAccentStyle = {
  ...metricStyle,
  fontSize: 20,
  color: 'var(--active-bg)',
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period = 'month' } = await searchParams
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperadmin = profile?.role === 'superadmin'
  const isPrivileged = isSuperadmin || profile?.role === 'owner' || profile?.role === 'admin'

  const db = isSuperadmin ? supabaseAdmin : supabase

  const [{ data: rawRows }, { data: chartRaw }] = await Promise.all([
    db
      .from('usage_logs')
      .select(
        'user_id, workspace_id, cost_eur, tokens_input, tokens_output, model_class, created_at, users(full_name, email), workspaces(name), model_catalog(name)'
      )
      .gte('created_at', periodStart(period))
      .order('created_at', { ascending: false })
      .limit(2000),
    db
      .from('usage_logs')
      .select('cost_eur, created_at')
      .gte('created_at', thirtyDaysAgo())
  ])

  const rows = (rawRows ?? []) as unknown as UsageRow[]

  // ------------------------------------------------------------------
  // KPIs
  // ------------------------------------------------------------------
  const totalCost = rows.reduce((s, r) => s + (r.cost_eur ?? 0), 0)
  const requestCount = rows.length
  const activeUsers = new Set(rows.map((r) => r.user_id)).size

  const modelCounts: Record<string, number> = {}
  for (const r of rows) {
    const name = r.model_catalog?.name ?? '—'
    modelCounts[name] = (modelCounts[name] ?? 0) + 1
  }
  const topModel =
    Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // ------------------------------------------------------------------
  // CO₂-Schätzung
  // ------------------------------------------------------------------
  const co2Min = rows.reduce((sum, r) => {
    const cls = r.model_class ?? 'fast'
    const factor = CO2_FACTORS[cls] ?? CO2_FACTORS.fast
    const weight = (r.tokens_input ?? 0) + 2 * (r.tokens_output ?? 0)
    return sum + (weight / 1000) * factor.min
  }, 0)
  const co2Max = rows.reduce((sum, r) => {
    const cls = r.model_class ?? 'fast'
    const factor = CO2_FACTORS[cls] ?? CO2_FACTORS.fast
    const weight = (r.tokens_input ?? 0) + 2 * (r.tokens_output ?? 0)
    return sum + (weight / 1000) * factor.max
  }, 0)

  const periodLabels: Record<string, string> = {
    today: 'Heute',
    week: 'Diese Woche',
    month: 'Dieser Monat',
  }
  const periodLabel = periodLabels[period] ?? 'Dieser Monat'

  // ------------------------------------------------------------------
  // Chart – letzte 30 Tage
  // ------------------------------------------------------------------
  const byDate: Record<string, number> = {}
  for (const r of chartRaw ?? []) {
    const day = (r.created_at as string).slice(0, 10)
    byDate[day] = (byDate[day] ?? 0) + (r.cost_eur ?? 0)
  }
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const key = d.toISOString().slice(0, 10)
    return { Datum: key, 'Kosten €': Math.round((byDate[key] ?? 0) * 10000) / 10000 }
  })

  // ------------------------------------------------------------------
  // Tabelle 1 – nach Department
  // ------------------------------------------------------------------
  const wsMap: Record<
    string,
    { name: string; requests: number; cost: number; models: Record<string, number> }
  > = {}
  for (const r of rows) {
    const id = r.workspace_id
    if (!wsMap[id])
      wsMap[id] = { name: r.workspaces?.name ?? id, requests: 0, cost: 0, models: {} }
    wsMap[id].requests++
    wsMap[id].cost += r.cost_eur ?? 0
    const mn = r.model_catalog?.name ?? '—'
    wsMap[id].models[mn] = (wsMap[id].models[mn] ?? 0) + 1
  }
  const wsTable = Object.values(wsMap)
    .sort((a, b) => b.cost - a.cost)
    .map((ws) => ({
      ...ws,
      cost: Math.round(ws.cost * 10000) / 10000,
      topModel: Object.entries(ws.models).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    }))

  // ------------------------------------------------------------------
  // Tabelle 2 – nach User
  // ------------------------------------------------------------------
  const userMap: Record<
    string,
    { name: string; requests: number; cost: number; lastActive: string }
  > = {}
  for (const r of rows) {
    const id = r.user_id
    const u = r.users
    if (!u) continue
    if (!userMap[id])
      userMap[id] = {
        name: u.full_name ?? u.email,
        requests: 0,
        cost: 0,
        lastActive: r.created_at
      }
    userMap[id].requests++
    userMap[id].cost += r.cost_eur ?? 0
    if (r.created_at > userMap[id].lastActive) userMap[id].lastActive = r.created_at
  }
  const userTable = Object.values(userMap)
    .sort((a, b) => b.cost - a.cost)
    .map((u) => ({
      ...u,
      cost: Math.round(u.cost * 10000) / 10000,
      lastActive: u.lastActive.slice(0, 10)
    }))

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="content-max">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div className="page-header-text">
            <h1 className="page-header-title">Dashboard</h1>
            <p className="page-header-sub">{isPrivileged ? 'Organisations-Übersicht' : 'Deine Nutzung'}</p>
          </div>
          <div className="page-header-actions">
            <Suspense fallback={
              <div style={{ height: 36, width: 240, background: 'rgba(255,255,255,0.5)', borderRadius: 8 }} />
            }>
              <PeriodTabs />
            </Suspense>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={labelStyle}>Gesamtkosten</p>
            <p style={metricStyle}>{fmt(totalCost)}</p>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={labelStyle}>Anfragen</p>
            <p style={metricStyle}>{requestCount.toLocaleString('de-DE')}</p>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={labelStyle}>Top-Modell</p>
            <p style={{ ...metricAccentStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topModel}</p>
          </div>
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={labelStyle}>{isPrivileged ? 'Aktive User' : 'Aktive Tage'}</p>
            <p style={metricStyle}>
              {isPrivileged ? activeUsers : userTable[0]?.lastActive ?? '—'}
            </p>
          </div>
        </div>

        {/* CO₂-Karte */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <Co2Card co2Min={co2Min} co2Max={co2Max} periodLabel={periodLabel} />
            <Link
              href="/responsible-ai"
              style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}
            >
              Wie berechnen wir das? →
            </Link>
          </div>
        </div>

        {/* Chart */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <p style={{ ...labelStyle, marginBottom: 16 }}>Kosten – letzte 30 Tage</p>
          <CostChart data={chartData} />
        </div>

        {/* Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {/* Department-Tabelle */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={{ ...labelStyle, marginBottom: 16 }}>Nach Department</p>
            <div className="table-scroll">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Department</TableHeaderCell>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12, textAlign: 'right' }}>Anfragen</TableHeaderCell>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12, textAlign: 'right' }}>Kosten</TableHeaderCell>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Top-Modell</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wsTable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0', fontSize: 13 }}>
                        Keine Daten für diesen Zeitraum
                      </TableCell>
                    </TableRow>
                  ) : (
                    wsTable.map((ws, i) => (
                      <TableRow key={i}>
                        <TableCell style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ws.name}</TableCell>
                        <TableCell style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{ws.requests}</TableCell>
                        <TableCell style={{ color: 'var(--active-bg)', textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                          {fmt(ws.cost)}
                        </TableCell>
                        <TableCell>
                          <span style={{
                            display: 'inline-block', fontSize: 11, padding: '2px 8px',
                            borderRadius: 999, background: 'rgba(26,46,35,0.08)',
                            color: 'var(--text-secondary)', border: '1px solid rgba(26,46,35,0.12)',
                          }}>
                            {ws.topModel}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* User-Tabelle */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={{ ...labelStyle, marginBottom: 16 }}>
              {isPrivileged ? 'Nach User' : 'Deine Nutzung'}
            </p>
            <div className="table-scroll">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Name</TableHeaderCell>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12, textAlign: 'right' }}>Anfragen</TableHeaderCell>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12, textAlign: 'right' }}>Kosten</TableHeaderCell>
                    <TableHeaderCell style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Letzter Tag</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userTable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0', fontSize: 13 }}>
                        Keine Daten für diesen Zeitraum
                      </TableCell>
                    </TableRow>
                  ) : (
                    userTable.map((u, i) => (
                      <TableRow key={i}>
                        <TableCell style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</TableCell>
                        <TableCell style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>{u.requests}</TableCell>
                        <TableCell style={{ color: 'var(--active-bg)', textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                          {fmt(u.cost)}
                        </TableCell>
                        <TableCell style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.lastActive}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
