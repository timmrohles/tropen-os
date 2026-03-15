// scripts/ci/save-lighthouse-results.mjs
// Parses lhci-output.txt and saves results to qa_lighthouse_runs table

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
const commitSha   = process.env.CI_COMMIT_SHA ?? 'unknown'

if (!supabaseUrl || !serviceKey) {
  console.log('Supabase env vars not set — skipping lighthouse save')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, serviceKey)

// Try to read LHCI JSON results from .lighthouseci/
let scores = { performance: null, accessibility: null, best_practices: null, seo: null }

try {
  const lhciDir = '.lighthouseci'
  const files = readdirSync(lhciDir).filter(f => f.endsWith('.json') && f.startsWith('lhr-'))
  if (files.length > 0) {
    const lhr = JSON.parse(readFileSync(join(lhciDir, files[0]), 'utf8'))
    scores = {
      performance:    Math.round((lhr.categories?.performance?.score    ?? 0) * 100),
      accessibility:  Math.round((lhr.categories?.accessibility?.score  ?? 0) * 100),
      best_practices: Math.round((lhr.categories?.['best-practices']?.score ?? 0) * 100),
      seo:            Math.round((lhr.categories?.seo?.score            ?? 0) * 100),
    }
  }
} catch (err) {
  console.warn('Could not parse LHCI JSON:', err.message)
}

const row = {
  commit_sha:     commitSha,
  performance:    scores.performance,
  accessibility:  scores.accessibility,
  best_practices: scores.best_practices,
  seo:            scores.seo,
  created_at:     new Date().toISOString(),
}

const { error } = await supabase.from('qa_lighthouse_runs').insert(row)
if (error) {
  console.error('Failed to save lighthouse results:', error.message)
  process.exit(1)
}

console.log('Lighthouse results saved:', scores)
