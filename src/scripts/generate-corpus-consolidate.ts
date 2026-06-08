import './corpus-gen/load-env' // muss zuerst laufen: lädt .env.local, umgeht Empty-Key-Shadow
// Run: npx tsx src/scripts/generate-corpus-consolidate.ts  (Opus, ~9 Sektion-Calls)
import { writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { RAW_RULES } from './corpus-gen/raw-rules'
import { filterBySource, groupBySection } from './corpus-gen/consolidate'
import { parseRules, validateAgainstVocab, dedupeRules } from './corpus-gen/postprocess'
import { RULE_CORPUS } from '@/lib/preflight/corpus/rule-corpus'
import { ALL_TAGS, CONTENT_SECTIONS } from '@/lib/preflight/corpus/vocabulary'
import type { ConventionRule } from '@/lib/preflight/corpus/types'

const MODEL = 'claude-opus-4-8'
const ROOT = resolve(process.cwd())

function getAnthropicModel(modelId: string) {
  // baseURL mit /v1 nötig: die installierte SDK-Version erzeugt sonst api.anthropic.com/messages → 404
  // (gleicher Fix wie in src/lib/llm/anthropic.ts).
  const sdk = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    baseURL: 'https://api.anthropic.com/v1',
  })
  return sdk(modelId)
}

async function callOpus(system: string, user: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: getAnthropicModel(MODEL) as Parameters<typeof generateText>[0]['model'],
      system,
      prompt: user,
      maxOutputTokens: 4096,
    })
    return text.trim()
  } catch (err) {
    console.warn(`  ⚠ Opus-Call fehlgeschlagen: ${String(err).slice(0, 120)}`)
    return ''
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error('✗ ANTHROPIC_API_KEY fehlt'); process.exit(1) }

  const filtered = filterBySource(RAW_RULES)
  const rawBySec = groupBySection(filtered)
  const seedBySec = groupBySection(RULE_CORPUS)
  const all: ConventionRule[] = []

  for (const section of CONTENT_SECTIONS) {
    if (!rawBySec[section]?.length) continue

    const system = `Du konsolidierst Engineering-Konventions-Regeln für die Section "${section}".
Output: NUR ein JSON-Array von Objekten { id, section, rule, rationale?, appliesWhen?, severity, source }. Keine Prosa.
Regeln:
- section MUSS exakt "${section}" sein.
- appliesWhen NUR aus dieser Liste (undefined = universell, gilt immer): ${ALL_TAGS.join(', ')}
- rule: imperativ ("tu X"), prägnant, ein Satz.
- severity: "must" oder "should".
- source: übernimm die Herkunft der Kandidaten (z.B. "agent:CODE_STYLE").
- FÜHRE ähnliche Kandidaten ZUSAMMEN (eine Regel statt drei).
- MAXIMAL 6 universelle Regeln (ohne appliesWhen); zusätzlich beliebig viele bedingte.
- LASS reine Rechts-/Compliance-/Datenschutz-/KI-Transparenz-Regeln WEG (gehören nicht in Engineering-Konventionen).
- KI-spezifische Engineering-Regeln (z.B. Token-Limits, Prompt-Hygiene) bekommen appliesWhen: ["ai:true"].
- Dupliziere KEINE Regel, die schon in der Baseline steht.`

    const user = `BEREITS IN DER BASELINE (nicht duplizieren):
${(seedBySec[section] ?? []).map((r) => '- ' + r.rule).join('\n') || '(keine)'}

---
KANDIDATEN zum Konsolidieren (${rawBySec[section].length}):
${rawBySec[section].map((r) => '- [' + (r.appliesWhen?.join(',') || 'universell') + '] ' + r.rule).join('\n')}`

    const text = await callOpus(system, user)
    const parsed = validateAgainstVocab(parseRules(text))
    all.push(...parsed)
    console.log('  ' + section + ': ' + parsed.length + ' Regeln')
    await sleep(2000)
  }

  const final = dedupeRules(all, new Set(RULE_CORPUS.map((r) => r.id)))

  const body = `// AUTO-GENERIERT von generate-corpus-consolidate.ts — nicht von Hand editieren.\n`
    + `import type { ConventionRule } from './types'\n\n`
    + `export const GENERATED_CORPUS: ConventionRule[] = ${JSON.stringify(final, null, 2)}\n`
  writeFileSync(join(ROOT, 'src/lib/preflight/corpus/rule-corpus.generated.ts'), body, 'utf-8')
  console.log(`\n✓ ${final.length} Regeln → rule-corpus.generated.ts`)
}

main().catch((e) => { console.error('Fatal', e); process.exit(1) })
