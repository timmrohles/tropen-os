'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import CostChart from '@/app/[locale]/dashboard/CostChart'
import Co2Card from '@/app/[locale]/dashboard/Co2Card'

type Period = 'today' | 'week' | 'month'

interface StatsData {
  totalCost: number
  requestCount: number
  activeUsers: number
  topModel: string
  co2Min: number
  co2Max: number
  chartData: Array<{ Datum: string; 'Kosten €': number }>
  wsTable: Array<{ name: string; requests: number; cost: number; topModel: string }>
  userTable: Array<{ name: string; requests: number; cost: number; lastActive: string }>
  isPrivileged: boolean
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Heute',
  week: 'Diese Woche',
  month: 'Dieser Monat',
}

function fmt(n: number) {
  return `€${n.toFixed(4)}`
}

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

export function KostenVerbrauchSection() {
  const [period, setPeriod] = useState<Period>('month')
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`/api/usage/stats?period=${period}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: StatsData) => { setData(d); setLoading(false) })
      .catch((e) => {
        setError(e === 403 ? 'Keine Berechtigung.' : 'Daten konnten nicht geladen werden.')
        setLoading(false)
      })
  }, [period])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['today', 'week', 'month'] as Period[]).map(p => (
          <button
            key={p}
            className={`chip${period === p ? ' chip--active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--error)', margin: 0 }}>{error}</p>
      )}

      {loading && (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>Lade…</p>
      )}

      {data && !loading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: '16px 20px' }}>
              <p style={labelStyle}>Gesamtkosten</p>
              <p style={metricStyle}>{fmt(data.totalCost)}</p>
            </div>
            <div className="card" style={{ padding: '16px 20px' }}>
              <p style={labelStyle}>Anfragen</p>
              <p style={metricStyle}>{data.requestCount.toLocaleString('de-DE')}</p>
            </div>
            <div className="card" style={{ padding: '16px 20px' }}>
              <p style={labelStyle}>Aktive User</p>
              <p style={metricStyle}>{data.activeUsers}</p>
            </div>
            <div className="card" style={{ padding: '16px 20px' }}>
              <p style={labelStyle}>Top-Modell</p>
              <p style={{ ...metricStyle, fontSize: 18, color: 'var(--active-bg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.topModel}
              </p>
            </div>
          </div>

          {/* CO₂ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <Co2Card co2Min={data.co2Min} co2Max={data.co2Max} periodLabel={PERIOD_LABELS[period]} />
              <Link
                href="/responsible-ai"
                style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}
              >
                Wie berechnen wir das? →
              </Link>
            </div>

            {/* Chart */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <p style={{ ...labelStyle, marginBottom: 16 }}>Kosten – letzte 30 Tage</p>
              <CostChart data={data.chartData} />
            </div>
          </div>

          {/* Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
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
                    {data.wsTable.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
                          Keine Daten für diesen Zeitraum
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.wsTable.map((ws, i) => (
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

            <div className="card" style={{ padding: '16px 20px' }}>
              <p style={{ ...labelStyle, marginBottom: 16 }}>Nach User</p>
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
                    {data.userTable.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
                          Keine Daten für diesen Zeitraum
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.userTable.map((u, i) => (
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
        </>
      )}
    </div>
  )
}
