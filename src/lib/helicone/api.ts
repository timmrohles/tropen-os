// src/lib/helicone/api.ts
// Helicone API Hilfsfunktionen für das QA-Dashboard

const HELICONE_API_BASE = 'https://api.helicone.ai/v1'

function heliconeHeaders() {
  return {
    Authorization: `Bearer ${process.env.HELICONE_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

// Latenz-Statistiken der letzten N Tage
export async function getLatencyStats(days = 7): Promise<{
  p50: number
  p95: number
  totalRequests: number
}> {
  try {
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const res = await fetch(`${HELICONE_API_BASE}/request?limit=1000`, {
      method: 'POST',
      headers: heliconeHeaders(),
      body: JSON.stringify({
        filter: {
          request: { created_at: { gte: after } },
        },
        sort: { created_at: 'desc' },
      }),
    })

    if (!res.ok) throw new Error(`Helicone API ${res.status}`)

    const data = await res.json()
    const latencies: number[] = (data.data ?? [])
      .map((r: { latency: number }) => r.latency)
      .filter((l: number) => l > 0)
      .sort((a: number, b: number) => a - b)

    const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0
    const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0

    return { p50, p95, totalRequests: latencies.length }
  } catch (err) {
    console.warn('[Helicone] getLatencyStats fehlgeschlagen:', err)
    return { p50: 0, p95: 0, totalRequests: 0 }
  }
}

// Fehlerrate der letzten N Tage
export async function getErrorRate(days = 7): Promise<{
  errorRate: number
  totalRequests: number
  failedRequests: number
}> {
  try {
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const res = await fetch(`${HELICONE_API_BASE}/request?limit=1000`, {
      method: 'POST',
      headers: heliconeHeaders(),
      body: JSON.stringify({
        filter: { request: { created_at: { gte: after } } },
      }),
    })

    if (!res.ok) throw new Error(`Helicone API ${res.status}`)

    const data = await res.json()
    const requests = data.data ?? []
    const failed = requests.filter(
      (r: { response_status: number }) => r.response_status >= 400
    ).length

    return {
      errorRate:
        requests.length > 0
          ? Math.round((failed / requests.length) * 100 * 10) / 10
          : 0,
      totalRequests: requests.length,
      failedRequests: failed,
    }
  } catch (err) {
    console.warn('[Helicone] getErrorRate fehlgeschlagen:', err)
    return { errorRate: 0, totalRequests: 0, failedRequests: 0 }
  }
}

// Kosten der letzten N Tage gruppiert nach Modell
export async function getCostByModel(days = 7): Promise<
  Array<{
    model: string
    totalCostUsd: number
    requestCount: number
  }>
> {
  try {
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const res = await fetch(`${HELICONE_API_BASE}/request?limit=1000`, {
      method: 'POST',
      headers: heliconeHeaders(),
      body: JSON.stringify({
        filter: { request: { created_at: { gte: after } } },
      }),
    })

    if (!res.ok) throw new Error(`Helicone API ${res.status}`)

    const data = await res.json()
    const byModel: Record<string, { cost: number; count: number }> = {}

    for (const r of data.data ?? []) {
      const model = r.model ?? 'unknown'
      if (!byModel[model]) byModel[model] = { cost: 0, count: 0 }
      byModel[model].cost += r.cost_usd ?? 0
      byModel[model].count += 1
    }

    return Object.entries(byModel).map(([model, { cost, count }]) => ({
      model,
      totalCostUsd: Math.round(cost * 10000) / 10000,
      requestCount: count,
    }))
  } catch (err) {
    console.warn('[Helicone] getCostByModel fehlgeschlagen:', err)
    return []
  }
}

// Tägliche Request-Anzahl der letzten 7 Tage (für Dashboard-Chart)
export async function getDailyRequestCounts(days = 7): Promise<
  Array<{
    day: string
    count: number
    avgLatencyMs: number
  }>
> {
  try {
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const res = await fetch(`${HELICONE_API_BASE}/request?limit=1000`, {
      method: 'POST',
      headers: heliconeHeaders(),
      body: JSON.stringify({
        filter: { request: { created_at: { gte: after } } },
        sort: { created_at: 'asc' },
      }),
    })

    if (!res.ok) throw new Error(`Helicone API ${res.status}`)

    const data = await res.json()
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

    const byDay: Record<string, { count: number; latencies: number[] }> = {}
    for (const r of data.data ?? []) {
      const day = dayNames[new Date(r.created_at).getDay()]
      if (!byDay[day]) byDay[day] = { count: 0, latencies: [] }
      byDay[day].count += 1
      if (r.latency > 0) byDay[day].latencies.push(r.latency)
    }

    return Object.entries(byDay).map(([day, { count, latencies }]) => ({
      day,
      count,
      avgLatencyMs:
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b) / latencies.length)
          : 0,
    }))
  } catch (err) {
    console.warn('[Helicone] getDailyRequestCounts fehlgeschlagen:', err)
    return []
  }
}
