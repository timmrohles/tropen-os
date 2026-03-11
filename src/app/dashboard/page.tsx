import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import {
  Badge,
  Card,
  Metric,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text
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

  // Eigenes Profil (für Rollencheck)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperadmin = profile?.role === 'superadmin'
  const isPrivileged = isSuperadmin || profile?.role === 'owner' || profile?.role === 'admin'

  // Superadmin benutzt supabaseAdmin (bypasses RLS) → sieht alle Orgs
  // Alle anderen nutzen den User-Client (RLS filtert auf eigene Org)
  const db = isSuperadmin ? supabaseAdmin : supabase

  // Parallele Fetches: Perioden-Daten + Chart-Daten (immer 30 Tage)
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
  // CO₂-Schätzung (basierend auf Modellklasse + Token-Gewicht)
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
  // Chart – letzte 30 Tage, immer vollständig
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
  // Tabelle 1 – nach Workspace
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
    <div className="content-max" style={{ paddingTop: 32, paddingBottom: 32 }}>
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {isPrivileged ? 'Organisations-Übersicht' : 'Deine Nutzung'}
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-64 bg-zinc-800 rounded-lg animate-pulse" />}>
          <PeriodTabs />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="!bg-zinc-900 !border-zinc-800 !ring-0 !shadow-none">
          <Text className="!text-zinc-400 text-xs uppercase tracking-widest">
            Gesamtkosten
          </Text>
          <Metric className="!text-white mt-2">{fmt(totalCost)}</Metric>
        </Card>

        <Card className="!bg-zinc-900 !border-zinc-800 !ring-0 !shadow-none">
          <Text className="!text-zinc-400 text-xs uppercase tracking-widest">Anfragen</Text>
          <Metric className="!text-white mt-2">{requestCount.toLocaleString('de-DE')}</Metric>
        </Card>

        <Card className="!bg-zinc-900 !border-zinc-800 !ring-0 !shadow-none">
          <Text className="!text-zinc-400 text-xs uppercase tracking-widest">Top-Modell</Text>
          <Metric className="!text-[#a3b554] mt-2 text-xl truncate">{topModel}</Metric>
        </Card>

        <Card className="!bg-zinc-900 !border-zinc-800 !ring-0 !shadow-none">
          <Text className="!text-zinc-400 text-xs uppercase tracking-widest">
            {isPrivileged ? 'Aktive User' : 'Aktive Tage'}
          </Text>
          <Metric className="!text-white mt-2">
            {isPrivileged ? activeUsers : userTable[0]?.lastActive ?? '—'}
          </Metric>
        </Card>
      </div>

      {/* CO₂-Karte */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Co2Card co2Min={co2Min} co2Max={co2Max} periodLabel={periodLabel} />
          <Link
            href="/responsible-ai"
            className="block mt-2 text-xs text-zinc-700 hover:text-zinc-500 transition-colors no-underline"
          >
            Wie berechnen wir das? →
          </Link>
        </div>
      </div>

      {/* Chart */}
      <Card className="!bg-zinc-900 !border-zinc-800 !ring-0 !shadow-none">
        <Text className="!text-zinc-400 text-sm mb-4">Kosten – letzte 30 Tage</Text>
        <CostChart data={chartData} />
      </Card>

      {/* Tables */}
      <div className="grid grid-cols-2 gap-4">
        {/* Workspace-Tabelle */}
        <Card className="!bg-zinc-900 !border-zinc-800 !ring-0 !shadow-none">
          <Text className="!text-zinc-400 text-sm mb-4">Nach Workspace</Text>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="!text-zinc-500">Workspace</TableHeaderCell>
                <TableHeaderCell className="!text-zinc-500 text-right">Anfragen</TableHeaderCell>
                <TableHeaderCell className="!text-zinc-500 text-right">Kosten</TableHeaderCell>
                <TableHeaderCell className="!text-zinc-500">Top-Modell</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wsTable.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="!text-zinc-600 text-center py-8 text-sm">
                    Keine Daten für diesen Zeitraum
                  </TableCell>
                </TableRow>
              ) : (
                wsTable.map((ws, i) => (
                  <TableRow key={i}>
                    <TableCell className="!text-white font-medium">{ws.name}</TableCell>
                    <TableCell className="!text-zinc-400 text-right">{ws.requests}</TableCell>
                    <TableCell className="!text-[#a3b554] text-right font-mono text-sm">
                      {fmt(ws.cost)}
                    </TableCell>
                    <TableCell>
                      <Badge size="xs" className="!bg-zinc-800 !text-zinc-400 !border-0">
                        {ws.topModel}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* User-Tabelle */}
        <Card className="!bg-zinc-900 !border-zinc-800 !ring-0 !shadow-none">
          <Text className="!text-zinc-400 text-sm mb-4">
            {isPrivileged ? 'Nach User' : 'Deine Nutzung'}
          </Text>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="!text-zinc-500">Name</TableHeaderCell>
                <TableHeaderCell className="!text-zinc-500 text-right">Anfragen</TableHeaderCell>
                <TableHeaderCell className="!text-zinc-500 text-right">Kosten</TableHeaderCell>
                <TableHeaderCell className="!text-zinc-500">Letzter Tag</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userTable.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="!text-zinc-600 text-center py-8 text-sm">
                    Keine Daten für diesen Zeitraum
                  </TableCell>
                </TableRow>
              ) : (
                userTable.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell className="!text-white font-medium">{u.name}</TableCell>
                    <TableCell className="!text-zinc-400 text-right">{u.requests}</TableCell>
                    <TableCell className="!text-[#a3b554] text-right font-mono text-sm">
                      {fmt(u.cost)}
                    </TableCell>
                    <TableCell className="!text-zinc-400 text-sm">{u.lastActive}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
    </div>
  )
}
