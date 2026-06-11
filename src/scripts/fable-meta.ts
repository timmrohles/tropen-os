#!/usr/bin/env node
// src/scripts/fable-meta.ts
// Präsentiert Fable 5 die Verifikation seiner eigenen Top-5-Findings.
// Fragt es, die Implikationen für sein Meta-Finding #4 zu reflektieren.
//
// Usage:
//   ANTHROPIC_API_KEY=$(grep '^ANTHROPIC_API_KEY=' .env.local | cut -d'=' -f2- | tr -d '"') \
//   pnpm exec tsx src/scripts/fable-meta.ts

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import Anthropic from '@anthropic-ai/sdk'

const ROOT       = resolve(process.cwd())
const OUTPUT_DIR = join(ROOT, 'docs', 'committee-reviews')
const DATE       = new Date().toISOString().split('T')[0]
const OUTPUT     = join(OUTPUT_DIR, `fable-meta-${DATE}.md`)
const MODEL      = 'claude-fable-5'

function load(relPath: string): string {
  try { return readFileSync(join(ROOT, relPath), 'utf-8').trim() }
  catch { return `(not found: ${relPath})` }
}

const SYSTEM_PROMPT = `Du bist derselbe Senior-Softwarearchitekt wie zuvor.
Du hast ein technisches Assessment für TropenOS erstellt.
Nun erhältst du eine Verifikationstabelle: Der Eigentümer hat deine Top-5-Findings
am echten Code gegengeprüft. Antworte präzise und ohne Defensivität.`

const USER_PROMPT = `Du hast für TropenOS folgende Top-5-Findings priorisiert:

1. supabaseAdmin als Default → RLS umgangen, manuelle Authz
2. 4 Cron-Routes evtl. unauthentifiziert triggerbar per GET
3. /api/debug/feeds in Produktion, kein Guard
4. Messvaliditäts-Problem (eigener Score vs. 820 Warnings)
5. redact(_value) = leerer Stub, potenzielles DSGVO-Risiko

Hier ist die Verifikation am echten Code:

| # | Finding | Verdikt | Beleg |
|---|---------|---------|-------|
| 1 | supabaseAdmin → RLS umgangen | ✅ Real & größer als beschrieben | 660 Vorkommen in 164 Route-Dateien — dein „100+" war sogar untertrieben |
| 2 | Cron-Routes unauthentifiziert | ❌ False Positive | Alle 6 Cron-Routes prüfen Bearer \${CRON_SECRET} — feed-fetch, agents etc. verifiziert |
| 3 | /api/debug/feeds ohne Guard | ❌ Bereits abgesichert | Route gibt in production 404 zurück + assertSuperadmin()-Guard vorhanden |
| 4 | Messvaliditätsproblem | ⚠️ Strategisch real | Kein Code-Fix — Produkt-/Prozess-Thema |
| 5 | redact(_value) leerer Stub | ❌ Non-Issue | Gibt immer '[REDACTED]' zurück — sicher, simpel, kein Bug |

Trefferquote der Top-5: 1 von 5 als echter, signifikanter Befund bestätigt.
Finding #2 (Cron-Auth) folgt exakt dem Pattern-Matching-Fehler „GET ohne request-Parameter → unauthentifiziert",
ohne headers() zu prüfen — demselben FP-Typ, den TropenOS in seinem eigenen Checker-Stack
als bekanntes Problem dokumentiert hat (z.B. „cat-3-rule-15 cron Bearer-Token — stale").

Außerdem: Das CLAUDE.md, das dir als Kontext vorlag, enthielt diesen Satz explizit:
„cat-3-rule-15 (cron Bearer-Token) — alle waren stale aus vor bestehenden Checker-Fixes"

Ich bitte dich um drei Dinge:

**A) Selbstanalyse:** Welcher Mechanismus in deiner Analyse hat die drei False Positives erzeugt?
Sei konkret — nicht „ich hatte keinen vollständigen Code-Zugriff" (das wusste ich), sondern:
was genau hat dein Urteil in diesen drei Fällen geformt, und warum war es falsch?

**B) Meta-Ironie:** Dein Finding #4 lautete: TropenOS hat ein Messvaliditätsproblem —
sein Score koexistiert mit 820 Warnings und 183 eigenen Findings, was den Score unglaubwürdig macht.
Wie bewertest du diese Kritik angesichts einer Trefferquote von 20% in deinen eigenen Top-5?
Was bedeutet das für die Frage, wem man ein technisches Audit anvertrauen sollte — dir oder TropenOS?

**C) Konsequenz für den Review-Prozess:** Was müsste ein AI-Review-Prozess strukturell anders machen,
um die Kategorie der False Positives aus Finding #2 und #5 systematisch zu verhindern?
Nicht allgemein — konkret für statische Analyse von Next.js-API-Routes.`

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error('❌  ANTHROPIC_API_KEY fehlt'); process.exit(1) }

  const client = new Anthropic({ apiKey })

  console.log(`\n🔬  Fable Meta-Review — Modell: ${MODEL}`)
  console.log(`    Präsentiere Verifikationsergebnisse...\n`)

  const t0 = Date.now()
  let response: Anthropic.Message

  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT }],
    })
  } catch (err: unknown) {
    console.error(`\n❌  API-Fehler: ${err instanceof Error ? err.message : String(err)}`)
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

  mkdirSync(OUTPUT_DIR, { recursive: true })
  writeFileSync(OUTPUT, `# Fable-5-Meta-Review — Verifikations-Feedback
Datum: ${DATE}
Modell: \`${MODEL}\`
Input: ${inputTok.toLocaleString()} | Output: ${outputTok.toLocaleString()} Tokens
Kosten: $${costUsd.toFixed(4)} (~€${(costUsd * 0.93).toFixed(4)})
Dauer: ${durationS}s

---

${text}
`, 'utf-8')

  console.log(`✅  Fertig (${durationS}s)`)
  console.log(`    Tokens: ${inputTok.toLocaleString()} in / ${outputTok.toLocaleString()} out`)
  console.log(`    Kosten: $${costUsd.toFixed(4)} (~€${(costUsd * 0.93).toFixed(4)})`)
  console.log(`    Report: ${OUTPUT}\n`)
}

main()
