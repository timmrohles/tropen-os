// scripts/ci/write-test-results.mjs
// Liest test-results/unit.json und schreibt in qa_test_runs
// Läuft in GitHub Actions nach den Tests — Node.js, kein TypeScript

import { readFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function parseVitestJson(file) {
  if (!existsSync(file)) {
    console.log(`[CI] ${file} nicht gefunden — überspringe`)
    return null
  }
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8'))
    return {
      total:   raw.numTotalTests   ?? 0,
      passed:  raw.numPassedTests  ?? 0,
      failed:  raw.numFailedTests  ?? 0,
      skipped: raw.numPendingTests ?? 0,
    }
  } catch (err) {
    console.warn(`[CI] Konnte ${file} nicht parsen:`, err.message)
    return null
  }
}

function outcomeToStatus(outcome) {
  if (outcome === 'success') return 'passed'
  if (outcome === 'failure') return 'failed'
  return 'partial'
}

async function main() {
  const unitResults = parseVitestJson('test-results/unit.json')
  const commitSha = (process.env.CI_COMMIT_SHA ?? '').slice(0, 40) || null
  const now = new Date().toISOString()

  const runs = []

  if (unitResults) {
    runs.push({
      run_type:     'functional',
      triggered_by: 'ci_cd',
      status:       outcomeToStatus(process.env.UNIT_TEST_OUTCOME),
      commit_sha:   commitSha,
      summary:      unitResults,
      started_at:   now,
      completed_at: now,
    })
  }

  runs.push({
    run_type:     'regression',
    triggered_by: 'ci_cd',
    status:       outcomeToStatus(process.env.TYPECHECK_OUTCOME),
    commit_sha:   commitSha,
    summary: {
      total:   1,
      passed:  process.env.TYPECHECK_OUTCOME === 'success' ? 1 : 0,
      failed:  process.env.TYPECHECK_OUTCOME === 'success' ? 0 : 1,
      skipped: 0,
    },
    started_at:   now,
    completed_at: now,
  })

  if (runs.length === 0) {
    console.log('[CI] Keine Ergebnisse zum Schreiben')
    return
  }

  const { error } = await supabase.from('qa_test_runs').insert(runs)

  if (error) {
    console.error('[CI] Supabase-Fehler:', error.message)
    // Kein process.exit(1) — CI soll nicht wegen Dashboard-Fehler brechen
    return
  }

  console.log(`[CI] ${runs.length} Run(s) in qa_test_runs geschrieben:`)
  runs.forEach(r =>
    console.log(`  ✓ ${r.run_type}: ${r.status} (${r.summary.passed}/${r.summary.total} passed)`)
  )
}

main().catch(err => {
  console.error('[CI] Unerwarteter Fehler:', err.message)
  // Kein process.exit(1)
})
