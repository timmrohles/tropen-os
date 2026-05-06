// src/lib/audit/trend.ts
// Score-Trend-Berechnung für PolishScoreIsland.
// Schwelle ±1% — unter Schwelle = Rauschen (direction: 'stable').

export interface ScoreTrend {
  delta: number | null
  direction: 'up' | 'down' | 'stable' | 'first-audit'
  previousScore: number | null
  previousAuditDate: string | null  // ISO string
}

const TREND_THRESHOLD = 1

export function calculateScoreTrend(
  currentScore: number,
  previousRun: { percentage: number; created_at: string } | null | undefined,
  isFirstAudit: boolean,
): ScoreTrend {
  if (isFirstAudit || !previousRun) {
    return { delta: null, direction: 'first-audit', previousScore: null, previousAuditDate: null }
  }

  const delta = currentScore - previousRun.percentage

  if (Math.abs(delta) < TREND_THRESHOLD) {
    return {
      delta: null,
      direction: 'stable',
      previousScore: previousRun.percentage,
      previousAuditDate: previousRun.created_at,
    }
  }

  return {
    delta: Math.round(delta * 10) / 10,
    direction: delta > 0 ? 'up' : 'down',
    previousScore: previousRun.percentage,
    previousAuditDate: previousRun.created_at,
  }
}

export function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `vor ${mins} Min.`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `vor ${hrs} Std.`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  if (days < 30) return `vor ${Math.floor(days / 7)} Wochen`
  return new Date(isoDate).toLocaleDateString('de-DE')
}
