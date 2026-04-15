// src/lib/audit/score-percentile.ts
// Percentile rank against v7 benchmark (49 repos).

/** Sorted scores from v7 benchmark run, by topic. */
const SCORES_BY_TOPIC: Record<string, number[]> = {
  lovable: [
    47.9, 68.7, 71.1, 73.3, 74.2, 76.8, 78.3, 78.5, 78.7, 78.9,
    79.4, 79.4, 79.5, 79.9, 79.9, 80.4, 80.4, 80.8, 81.0, 81.1,
    81.9, 82.2, 82.2, 82.2, 82.4, 82.4, 82.5, 82.5, 82.7, 82.8,
    82.8, 83.0, 83.0, 83.2, 83.3, 83.8, 84.0, 84.2, 85.0,
  ],
  bolt: [63.9, 68.8, 80.1],
  cursor: [82.7, 83.4, 83.6],
  manual: [83.7, 87.8],
}

/** All repos combined (fallback). */
const ALL_SCORES = [
  47.9, 63.9, 68.7, 68.8, 71.1, 73.3, 74.2, 76.8, 78.3, 78.5,
  78.7, 78.9, 79.4, 79.4, 79.5, 79.9, 79.9, 80.1, 80.4, 80.4,
  80.8, 81.0, 81.0, 81.1, 81.9, 82.2, 82.2, 82.2, 82.4, 82.4,
  82.5, 82.5, 82.5, 82.7, 82.7, 82.8, 82.8, 83.0, 83.0, 83.2,
  83.3, 83.4, 83.6, 83.7, 83.8, 84.0, 84.2, 85.0, 87.8,
]

/**
 * Returns percentile rank (0–100). Optionally scoped to a topic.
 */
export function getPercentileRank(score: number, topic?: string): number {
  const table = (topic ? SCORES_BY_TOPIC[topic] : undefined) ?? ALL_SCORES
  const below = table.filter((s: number) => s < score).length
  return Math.round((below / table.length) * 100)
}
