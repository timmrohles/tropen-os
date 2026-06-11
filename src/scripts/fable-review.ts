#!/usr/bin/env node
// src/scripts/fable-review.ts
// Lässt Claude Fable 5 das TropenOS-Repo analysieren und ein technisches Assessment erstellen.
//
// Usage:
//   env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/fable-review.ts
//
// Output: docs/committee-reviews/fable-review-YYYY-MM-DD.md
// Cost:   ~€1-3 (abhängig von Kontextgröße — Fable 5: $10/$50 per MTok)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import Anthropic from '@anthropic-ai/sdk'

const ROOT       = resolve(process.cwd())
const OUTPUT_DIR = join(ROOT, 'docs', 'committee-reviews')
const DATE       = new Date().toISOString().split('T')[0]
const OUTPUT     = join(OUTPUT_DIR, `fable-review-${DATE}.md`)

const MODEL = 'claude-fable-5'

// ── Context loading ────────────────────────────────────────────────────────────

function load(relPath: string, maxLines?: number): string {
  try {
    const full = readFileSync(join(ROOT, relPath), 'utf-8').trim()
    if (!maxLines) return full
    return full.split('\n').slice(0, maxLines).join('\n')
  } catch {
    return `(not found: ${relPath})`
  }
}

function section(title: string, content: string): string {
  return `\n\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}\n${content}`
}

// ── Build prompt ───────────────────────────────────────────────────────────────

function buildContext(): string {
  return [
    section('REPO MAP (Dateistruktur + Symbole)', load('docs/repo-map/tropen-os-map.txt')),
    section('ENGINEER MANIFEST (CLAUDE.md — erste 400 Zeilen)', load('CLAUDE.md', 400)),
    section('ARCHITEKTUR-REVIEW-PROTOKOLL (ARCHITECT.md)', load('ARCHITECT.md', 300)),
    section('ROADMAP', load('docs/active/roadmap.md', 200)),
    section('ENGINEERING STANDARD (Kurzfassung)', load('docs/active/engineering-standard.md', 200)),
    section('MANIFESTO', load('docs/active/manifesto.md', 100)),
  ].join('')
}

const SYSTEM_PROMPT = `Du bist ein unabhängiger Senior-Softwarearchitekt mit umfassender Erfahrung in
SaaS-Produkten, Next.js-Ökosystemen und KI-Integrationen. Du bewertest Code-Projekte ehrlich und
präzise — du lobst was gut ist und nennst klar was verbessert werden sollte.

Das Projekt ist TropenOS — eine Production-Readiness-Audit-Plattform für Entwickler, gebaut mit
Next.js 15, React 19, Supabase und Anthropic Claude. Das ist ein legitimes kommerzielles
Softwareprojekt und du hast vollständigen Kontext über die Architektur.`

const USER_PROMPT = `Hier ist der vollständige Kontext über das TropenOS-Projekt:

{{CONTEXT}}

---

Bitte erstelle ein technisches Assessment mit folgenden Abschnitten:

## 1. Executive Summary
Kurze Einschätzung (3–5 Sätze): Was ist das Projekt, wie weit ist es, was ist der Gesamteindruck?

## 2. Architektur-Stärken
Was ist wirklich gut gemacht? Konkret — mit Bezug auf spezifische Muster, Dateien oder Entscheidungen.

## 3. Kritische Verbesserungspotenziale
Die 5–8 wichtigsten Probleme oder Risiken, priorisiert nach Dringlichkeit. Für jedes:
- Was ist das Problem?
- Warum ist es kritisch?
- Konkreter Lösungsansatz

## 4. Architekturelle Bedenken (mittelfristig)
Dinge die jetzt noch kein Blocking-Problem sind, aber in 6–12 Monaten zu technischen Schulden werden könnten.

## 5. Überraschende Beobachtungen
Dinge die ungewöhnlich sind — positiv oder negativ — die ein normaler Code-Reviewer vielleicht übersehen würde.

## 6. Konkrete nächste Schritte
Top 3 Empfehlungen für den nächsten Sprint, mit konkreter Begründung.

Sei direkt, technisch präzise und nenn Dinge beim Namen. Keine diplomatischen Umformulierungen.`

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('❌  ANTHROPIC_API_KEY fehlt')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  console.log(`\n🔬  Fable Review — Modell: ${MODEL}`)
  console.log(`    Output: ${OUTPUT}\n`)

  const context = buildContext()
  const contextTokensEst = Math.round(context.length / 4)
  console.log(`    Kontext: ~${contextTokensEst.toLocaleString()} Token geschätzt`)
  console.log(`    Kosten-Schätzung: ~$${((contextTokensEst / 1_000_000) * 10 + (4096 / 1_000_000) * 50).toFixed(3)}\n`)

  const userPrompt = USER_PROMPT.replace('{{CONTEXT}}', context)

  const t0 = Date.now()
  let response: Anthropic.Message

  try {
    console.log('    Sende Anfrage an Fable 5...')
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`\n❌  API-Fehler: ${msg}`)
    process.exit(1)
  }

  const durationS  = ((Date.now() - t0) / 1000).toFixed(1)
  const inputTok   = response.usage.input_tokens
  const outputTok  = response.usage.output_tokens
  const costUsd    = (inputTok / 1_000_000) * 10 + (outputTok / 1_000_000) * 50

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n')

  if (!text.trim()) {
    console.error(`\n❌  Fable 5 hat leere Antwort zurückgegeben (stop_reason: ${response.stop_reason})`)
    process.exit(1)
  }

  // ── Write output ─────────────────────────────────────────────────────────────

  mkdirSync(OUTPUT_DIR, { recursive: true })

  const report = `# Fable-5-Review — TropenOS
Datum: ${DATE}
Modell: \`${MODEL}\`
Input: ${inputTok.toLocaleString()} Tokens | Output: ${outputTok.toLocaleString()} Tokens
Kosten: $${costUsd.toFixed(4)} (~€${(costUsd * 0.93).toFixed(4)})
Dauer: ${durationS}s

---

${text}
`

  writeFileSync(OUTPUT, report, 'utf-8')

  console.log(`\n✅  Fertig (${durationS}s)`)
  console.log(`    Input:  ${inputTok.toLocaleString()} Tokens`)
  console.log(`    Output: ${outputTok.toLocaleString()} Tokens`)
  console.log(`    Kosten: $${costUsd.toFixed(4)} (~€${(costUsd * 0.93).toFixed(4)})`)
  console.log(`    Report: ${OUTPUT}\n`)
}

main()
