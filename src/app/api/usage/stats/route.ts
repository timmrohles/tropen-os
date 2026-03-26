import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:usage:stats')

const CO2_FACTORS: Record<string, { min: number; max: number }> = {
  fast: { min: 0.1, max: 0.3 },
  deep: { min: 0.5, max: 2.0 },
  safe: { min: 0.2, max: 0.8 },
}

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

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).maybeSingle()

  const isSuperadmin = profile?.role === 'superadmin'
  const isPrivileged = isSuperadmin || profile?.role === 'owner' || profile?.role === 'admin'
  if (!isPrivileged) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const period = req.nextUrl.searchParams.get('period') ?? 'month'
  const db = isSuperadmin ? supabaseAdmin : supabase

  try {
    const [{ data: rawRows }, { data: chartRaw }] = await Promise.all([
      db.from('usage_logs')
        .select('user_id, workspace_id, cost_eur, tokens_input, tokens_output, model_class, created_at, users(full_name, email), workspaces(name), model_catalog(name)')
        .gte('created_at', periodStart(period))
        .order('created_at', { ascending: false })
        .limit(2000),
      db.from('usage_logs')
        .select('cost_eur, created_at')
        .gte('created_at', thirtyDaysAgo()),
    ])

    const rows = (rawRows ?? []) as unknown as UsageRow[]

    // KPIs
    const totalCost = rows.reduce((s, r) => s + (r.cost_eur ?? 0), 0)
    const requestCount = rows.length
    const activeUsers = new Set(rows.map(r => r.user_id)).size
    const modelCounts: Record<string, number> = {}
    for (const r of rows) {
      const name = r.model_catalog?.name ?? '—'
      modelCounts[name] = (modelCounts[name] ?? 0) + 1
    }
    const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

    // CO₂
    const co2Min = rows.reduce((sum, r) => {
      const f = CO2_FACTORS[r.model_class ?? 'fast'] ?? CO2_FACTORS.fast
      return sum + ((r.tokens_input ?? 0) + 2 * (r.tokens_output ?? 0)) / 1000 * f.min
    }, 0)
    const co2Max = rows.reduce((sum, r) => {
      const f = CO2_FACTORS[r.model_class ?? 'fast'] ?? CO2_FACTORS.fast
      return sum + ((r.tokens_input ?? 0) + 2 * (r.tokens_output ?? 0)) / 1000 * f.max
    }, 0)

    // Chart data (last 30 days)
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

    // By department
    const wsMap: Record<string, { name: string; requests: number; cost: number; models: Record<string, number> }> = {}
    for (const r of rows) {
      if (!wsMap[r.workspace_id]) wsMap[r.workspace_id] = { name: r.workspaces?.name ?? r.workspace_id, requests: 0, cost: 0, models: {} }
      wsMap[r.workspace_id].requests++
      wsMap[r.workspace_id].cost += r.cost_eur ?? 0
      const mn = r.model_catalog?.name ?? '—'
      wsMap[r.workspace_id].models[mn] = (wsMap[r.workspace_id].models[mn] ?? 0) + 1
    }
    const wsTable = Object.values(wsMap).sort((a, b) => b.cost - a.cost).map(ws => ({
      ...ws, cost: Math.round(ws.cost * 10000) / 10000,
      topModel: Object.entries(ws.models).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
    }))

    // By user
    const userMap: Record<string, { name: string; requests: number; cost: number; lastActive: string }> = {}
    for (const r of rows) {
      const u = r.users
      if (!u) continue
      if (!userMap[r.user_id]) userMap[r.user_id] = { name: u.full_name ?? u.email, requests: 0, cost: 0, lastActive: r.created_at }
      userMap[r.user_id].requests++
      userMap[r.user_id].cost += r.cost_eur ?? 0
      if (r.created_at > userMap[r.user_id].lastActive) userMap[r.user_id].lastActive = r.created_at
    }
    const userTable = Object.values(userMap).sort((a, b) => b.cost - a.cost).map(u => ({
      ...u, cost: Math.round(u.cost * 10000) / 10000, lastActive: u.lastActive.slice(0, 10),
    }))

    return NextResponse.json({
      totalCost, requestCount, activeUsers, topModel,
      co2Min, co2Max,
      chartData,
      wsTable,
      userTable,
      isPrivileged,
    })
  } catch (err) {
    log.error('usage/stats error', { error: String(err) })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
