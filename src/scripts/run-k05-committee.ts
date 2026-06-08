#!/usr/bin/env node
// src/scripts/run-k05-committee.ts
// K0.5 — Vertiefungs-Komitee mit Cross-Model-Reaktion (2026-05-07)
// 5 Modelle + Opus-Judge. K0-Synthese als Lese-Material im Kontext-Brief.
// Output: docs/audit-reports/k05-konzept-vertiefung-komitee-2026-05-07.md

import { writeFileSync, readFileSync, mkdirSync, appendFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const ROOT = resolve(process.cwd())
const START = Date.now()

// ── Provider setup ────────────────────────────────────────────────────────────

const OPUS_MODEL   = 'claude-opus-4-7'
const SONNET_MODEL = 'claude-sonnet-4-6'

function getOpus() {
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '', baseURL: 'https://api.anthropic.com/v1' })(OPUS_MODEL)
}
function getSonnet() {
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '', baseURL: 'https://api.anthropic.com/v1' })(SONNET_MODEL)
}
function getGPT5() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })('gpt-5')
}
function getGPT4o() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })('gpt-4o')
}
function getGeminiPro() {
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })('gemini-2.5-pro')
}
function getGrok() {
  return createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })('grok-4')
}

// ── Load K0 judge synthesis ───────────────────────────────────────────────────

function loadK0Synthesis(): string {
  const k0Path = join(ROOT, 'docs', 'audit-reports', 'k0-konzept-explorativ-komitee-2026-05-07.md')
  try {
    const content = readFileSync(k0Path, 'utf-8')
    const start = content.indexOf('## Judge-Synthese')
    const end = content.indexOf('---\n\n## Sprint-Metadaten')
    if (start === -1) return '(K0-Synthese nicht gefunden)'
    const section = end > start ? content.slice(start + '## Judge-Synthese'.length, end) : content.slice(start)
    return section.trim()
  } catch {
    return '(K0-Datei nicht lesbar)'
  }
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const K05_SYSTEM_PROMPT = `Du bist erfahrene/r Produkt-Designer/in mit Erfahrung in Developer-Tools, Coaching-Plattformen und EU-Compliance-Software.

In einem ersten Komitee-Sprint (K0) haben vier Modelle unabhängig ein Produkt-Konzept für eine Vibe-Coding-Begleitplattform entworfen. Eine Judge-Synthese hat Konvergenzen, Divergenzen und übersehene Punkte herausgearbeitet. Diese Synthese liest du jetzt mit.

Deine Aufgabe ist NICHT, das K0-Konzept zu wiederholen. Deine Aufgabe ist:
- Position beziehen *gegen oder für* die K0-Konvergenzen — bestätige nicht reflexhaft, prüfe.
- Fünf neue Vertiefungs-Fragen substantiell beantworten, die in K0 nicht oder nur am Rand adressiert wurden.
- Strikte Constraints einhalten: Solo-Founder, 6 Monate Runway, 1 Person Bau-Team, €20–50k Budget. Konkrete Trade-offs benennen.

Wichtig:
- Substanz vor Höflichkeit. Kein Sycophancy.
- Widerspreche K0 wenn nötig. Eine starke Position ist wertvoller als ein gefälliger Kompromiss.
- Wenn dir Constraints widersprechen oder unrealistisch erscheinen, sag das — und arbeite trotzdem mit ihnen.
- Antworte auf Deutsch.`

function buildK05UserPrompt(k0Synthesis: string): string {
  return `KONTEXT-BRIEF — TROPEN OS PRODUKT-VERTIEFUNG (K0.5)

AUSGANGSLAGE

Tropen OS ist eine in Entwicklung befindliche Begleitplattform für nicht-traditionelle Entwickler/innen, die mit Vibe-Coding-Tools (Lovable, Cursor, Claude Code, Bolt, Replit) Apps bauen. Zielgruppe: Solo-Entrepreneurs und kleine Teams in DACH/EU.

Existierende Substanz:
- Audit-Engine mit 242 Regeln in 26 Kategorien (Stärken: DSGVO, Testing, Accessibility, i18n, Supply Chain, Git Governance, SLOP-Detection)
- Multi-Model-Komitee-Mechanik (vier Modelle plus Judge, Konsens durch Aggregation)
- Fix-Prompt-Generator
- Repo-Integration via File System Access API

EU-Moat-Hypothese: Tiefe in DSGVO, BFSG, AI Act, CRA — von US-Tools nur oberflächlich abgedeckt.

ERSTE KOMITEE-RUNDE (K0) — JUDGE-SYNTHESE

Vier Modelle haben unabhängig ein Konzept entworfen. Die Judge-Synthese ist hier:

${k0Synthesis}

DEINE AUFGABE IN K0.5

Lies die K0-Synthese sorgfältig. Beantworte dann fünf Vertiefungs-Fragen, die K0 nicht oder nur am Rand adressiert hat. Beziehe dich dabei explizit auf K0-Konvergenzen — bestätige sie wenn überzeugend, widersprich wenn nötig.

HARTE CONSTRAINTS

Du arbeitest unter folgenden realen Constraints — diese müssen deine Antworten prägen:

- **Team:** 1 Person (Solo-Founder, der/die selbst entwickelt mit Hilfe von Claude Code als Bau-Agent)
- **Runway:** 6 Monate bis Beta-Launch und erste zahlende Kunden
- **Budget:** €20–50k für die kommenden 6 Monate (Infrastruktur, Tooling, Marketing zusammen)
- **Bestehende Substanz:** Audit-Engine + Komitee-Mechanik laufen. Wiederverwendung priorisieren über Neubau.
- **Markt-Reife:** Beta-Pilot mit ~10–30 ersten Usern angepeilt, von dort iterativ wachsen.

Diese Constraints sind nicht verhandelbar. Wenn dein Konzept sie sprengt, sag das ehrlich und priorisiere ruthless.

DIE FÜNF VERTIEFUNGS-FRAGEN

1. **Integrations-Tiefe (höchste Tragweite laut K0-Judge)**
   Soll die Plattform als (a) Deep-Integration/Plugin in Cursor/Claude-Code/Lovable, (b) Browser-Extension, (c) eigenständige Web-Plattform, (d) CLI-Tool, oder (e) Hybrid gebaut werden? Welche Tiefe ist mit den Constraints in 6 Monaten realistisch? Welche schließt sich aus?

2. **Flow-Preservation als Design-Prinzip**
   Wie viel Unterbrechung verkraftet ein Vibe-Coder, bevor er die Plattform abschaltet? Konkret: Wie viele proaktive Meldungen pro Stunde sind akzeptabel? Wann ist Schweigen wertvoller als Substanz? Schlage konkrete Verhaltens-Regeln vor.

3. **Komitee-Rolle im Produkt**
   Sollte das vorhandene Multi-Model-Komitee nur intern (für Regel-Updates, Lern-Validierung) oder auch user-facing (z.B. "Lass das Komitee deine Architektur prüfen") genutzt werden? Wenn user-facing: Pricing-Implikation (Komitee-Calls kosten €0.30–€0.80 pro Run), Frequenz-Limit, Kommunikation.

4. **Lern-Monetarisierung und Daten-Eigentum**
   Wenn die Plattform aus User-Repos lernt: Wem gehört das aggregierte Wissen? Entsteht ein Netzwerkeffekt-Moat (je mehr User, desto besser die Regeln)? Wie verhält sich das zu DSGVO und Daten-Souveränität europäischer User? Welche Lizenz-/Vertrags-Architektur ist nötig?

5. **Modi-Konstrukt: ein Begleiter oder zwei Eintritte?**
   K0 hat einen einzigen durchgehenden Begleiter konzipiert. Eine intern diskutierte Alternative ist: zwei explizite Modi — "Mittendrin" (User mit existierendem Repo + Audit als Eintritt) und "Von Anfang an" (User ohne Code, strukturiertes Onboarding als Eintritt), die später konvergieren. Ist diese Trennung sinnvoll oder UI-Komplexität ohne Substanz-Gewinn? Begründe ehrlich.

OUTPUT-FORMAT

# Vertiefung K0.5 — [Modell]

## Position zur K0-Synthese (3–5 Sätze)
Welche K0-Konvergenzen trägst du mit, welche bestreitest du? Konkrete Stellen.

## Antworten auf die fünf Vertiefungs-Fragen

### 1. Integrations-Tiefe
[Antwort, Constraint-bewusst]

### 2. Flow-Preservation
[Antwort mit konkreten Verhaltens-Regeln]

### 3. Komitee-Rolle
[Antwort mit Pricing/Frequenz-Implikation]

### 4. Lern-Monetarisierung und Daten-Eigentum
[Antwort mit Vertrags-Architektur-Skizze]

### 5. Modi-Konstrukt
[Antwort: ja oder nein, mit Begründung]

## Trade-off-Tabelle
Drei konkrete Trade-offs, die deine Antworten erzwingen (was wird priorisiert, was zurückgestellt). Format: Aspekt → Was wir tun → Was wir aufgeben.

## Drei Schwächen / Risiken deines Vorschlags
Sei selbstkritisch.

## Wo K0 deiner Meinung nach am stärksten daneben lag
Eine konkrete Stelle, an der du der K0-Konvergenz widersprichst, mit Begründung.`
}

const K05_JUDGE_SYSTEM = `Du bist Judge im Vertiefungs-Komitee K0.5. Fünf Modelle haben — auf Basis der K0-Judge-Synthese und unter harten Constraints — fünf Vertiefungs-Fragen beantwortet. Deine Aufgabe ist eine STRENGE, ENTSCHEIDUNGS-ORIENTIERTE Synthese. Anders als in K0: Hier sollst du Empfehlungen geben.`

const K05_JUDGE_PROMPT = `# K0.5 Komitee-Synthese — Opus-Judge

## Wo K0.5 K0 bestätigt
Welche K0-Konvergenzen werden in K0.5 tragfähig bestätigt — auch unter Constraints?

## Wo K0.5 K0 revidiert
Welche K0-Konvergenzen halten den Constraints nicht stand und müssen revidiert werden?

## Empfehlungen pro Vertiefungs-Frage

### 1. Integrations-Tiefe — Empfehlung
[Konkrete Empfehlung, mit Begründung aus den fünf Antworten]

### 2. Flow-Preservation — Empfehlung
[Konkrete Verhaltens-Regeln, die du übernehmen würdest]

### 3. Komitee-Rolle — Empfehlung
[User-facing oder rein intern? Frequenz-Limit?]

### 4. Lern-Monetarisierung — Empfehlung
[Vertrags-/Lizenz-Architektur-Vorschlag]

### 5. Modi-Konstrukt — Empfehlung
[Ein Begleiter oder zwei Modi? Klare Antwort.]

## Drei Trade-offs, die das Tropen-Team explizit treffen muss
Sortiert nach Tragweite.

## Was die Constraints (6 Monate, 1 Person, €20–50k) konkret ausschließen
Welche Konzept-Bestandteile aus K0/K0.5 sind unter diesen Constraints nicht realisierbar und müssen aus dem MVP-Scope?

## Methodisches Feedback
Was hat Cross-Model-Reaktion gebracht? Was würde ein drittes Komitee anders machen?`

// ── Provider call ─────────────────────────────────────────────────────────────

interface CallResult {
  text: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  actualModel: string
}

async function callModel(
  label: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelFn: () => any,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fallbackFn?: () => any,
  fallbackLabel?: string,
): Promise<CallResult & { usedLabel: string }> {
  const t0 = Date.now()
  const tryCall = async (fn: () => any, lbl: string): Promise<CallResult & { usedLabel: string }> => {
    try {
      const result = await generateText({ model: fn(), system: systemPrompt, prompt: userPrompt, maxOutputTokens })
      return {
        text: result.text?.trim() ?? '',
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        durationMs: Date.now() - t0,
        actualModel: lbl,
        usedLabel: lbl,
      }
    } catch (err) {
      const msg = String(err).slice(0, 200)
      console.warn(`  ⚠ ${lbl} failed: ${msg}`)
      if (fallbackFn && lbl === label) {
        console.log(`  → Fallback zu ${fallbackLabel}`)
        return tryCall(fallbackFn, fallbackLabel ?? lbl + '-fallback')
      }
      return { text: '', inputTokens: 0, outputTokens: 0, durationMs: Date.now() - t0, actualModel: lbl, usedLabel: lbl }
    }
  }
  return tryCall(modelFn, label)
}

// ── Cost estimation ───────────────────────────────────────────────────────────

const PRICES: Record<string, { inPerM: number; outPerM: number }> = {
  'Claude Opus 4.7':      { inPerM: 15.0, outPerM: 75.0 },
  'Claude Sonnet 4.6':    { inPerM: 3.0,  outPerM: 15.0 },
  'GPT-5':                { inPerM: 10.0, outPerM: 40.0 },
  'GPT-4o':               { inPerM: 2.5,  outPerM: 10.0 },
  'Gemini 2.5 Pro':       { inPerM: 1.25, outPerM: 10.0 },
  'Grok 4':               { inPerM: 3.0,  outPerM: 15.0 },
  'Judge (Opus)':         { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93

function eur(label: string, inTok: number, outTok: number) {
  const key = Object.keys(PRICES).find(k => label.includes(k.split(' ')[0]) && label.includes(k.split(' ').slice(-1)[0])) ?? label
  const p = PRICES[key] ?? PRICES[label] ?? { inPerM: 3.0, outPerM: 15.0 }
  return ((inTok * p.inPerM + outTok * p.outPerM) / 1_000_000) * USD_TO_EUR
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY fehlt')
    process.exit(1)
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(' K0.5 — Vertiefungs-Komitee (Cross-Model-Reaktion)')
  console.log(' 2026-05-07')
  console.log('═══════════════════════════════════════════════════════')

  const k0Synthesis = loadK0Synthesis()
  console.log(`\nK0-Synthese geladen (${k0Synthesis.length} Zeichen)`)

  const userPrompt = buildK05UserPrompt(k0Synthesis)

  console.log('\nRufe 5 Reviewer parallel auf…')
  const [r1, r2, r3, r4, r5] = await Promise.all([
    callModel('Claude Opus 4.7',   getOpus,      K05_SYSTEM_PROMPT, userPrompt, 5000),
    callModel('Claude Sonnet 4.6', getSonnet,    K05_SYSTEM_PROMPT, userPrompt, 5000),
    callModel('GPT-5',             getGPT5,      K05_SYSTEM_PROMPT, userPrompt, 5000, getGPT4o, 'GPT-4o (Fallback)'),
    callModel('Gemini 2.5 Pro',    getGeminiPro, K05_SYSTEM_PROMPT, userPrompt, 5000),
    callModel('Grok 4',            getGrok,      K05_SYSTEM_PROMPT, userPrompt, 5000),
  ])

  const reviewers = [
    { label: 'Claude Opus 4.7',   ...r1 },
    { label: 'Claude Sonnet 4.6', ...r2 },
    { label: r3.usedLabel,        ...r3 },
    { label: 'Gemini 2.5 Pro',    ...r4 },
    { label: 'Grok 4',            ...r5 },
  ]

  const modellVerfuegbarkeit: string[] = []
  for (const r of reviewers) {
    const status = r.text ? '✓' : '✗'
    console.log(`  ${status} ${r.label}: ${r.inputTokens} in / ${r.outputTokens} out (${(r.durationMs/1000).toFixed(1)}s)`)
    if (r.label !== r.usedLabel) modellVerfuegbarkeit.push(`${r.label} → Fallback: ${r.usedLabel}`)
  }

  const successful = reviewers.filter(r => r.text)
  if (successful.length === 0) { console.error('✗ Alle Reviewer fehlgeschlagen'); process.exit(1) }

  const judgeInput = successful.map(r => `=== ${r.label.toUpperCase()} ===\n\n${r.text}`).join('\n\n---\n\n')
  const judgeUserPrompt = `${successful.length} Modelle haben unabhängig auf die K0-Synthese reagiert und Vertiefungs-Fragen beantwortet:\n\n${judgeInput}\n\n---\n\n${K05_JUDGE_PROMPT}`

  console.log('\nJudge (Opus 4.7) destilliert…')
  const judge = await callModel('Judge (Opus)', getOpus, K05_JUDGE_SYSTEM, judgeUserPrompt, 6000)
  console.log(`  ✓ Judge: ${judge.inputTokens} in / ${judge.outputTokens} out (${(judge.durationMs/1000).toFixed(1)}s)`)

  const costs = [
    ...reviewers.map(r => ({ label: r.label, inTok: r.inputTokens, outTok: r.outputTokens, costEur: eur(r.label, r.inputTokens, r.outputTokens) })),
    { label: 'Judge (Opus)', inTok: judge.inputTokens, outTok: judge.outputTokens, costEur: eur('Judge (Opus)', judge.inputTokens, judge.outputTokens) },
  ]
  const totalEur = costs.reduce((s, c) => s + c.costEur, 0)
  const totalDurS = ((Date.now() - START) / 1000).toFixed(0)

  const costTable = `| Modell                | In-Tok  | Out-Tok | Kosten     |
|-----------------------|---------|---------|------------|
${costs.map(c => `| ${c.label.padEnd(21)} | ${String(c.inTok).padStart(7)} | ${String(c.outTok).padStart(7)} | €${c.costEur.toFixed(4)} |`).join('\n')}
| **Gesamt**            |         |         | **€${totalEur.toFixed(4)}** |`

  // ── Output ────────────────────────────────────────────────────────────────

  const outputDir = join(ROOT, 'docs', 'audit-reports')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'k05-konzept-vertiefung-komitee-2026-05-07.md')

  const reviewerSections = reviewers
    .map(r => r.text
      ? `## ${r.label}\n\n${r.text}`
      : `## ${r.label}\n\n_(Kein Output — Fehler beim Aufruf)_`
    ).join('\n\n---\n\n')

  writeFileSync(outputPath, `# K0.5 — Vertiefungs-Komitee (Cross-Model-Reaktion)

> Sprint: 2026-05-07 · Modelle: ${reviewers.map(r => r.label).join(', ')} · Judge: Claude Opus 4.7 · Dauer: ${totalDurS}s · Kosten: €${totalEur.toFixed(4)}

---

## Kontext-Brief (verbatim, inkl. K0-Synthese)

${buildK05UserPrompt(k0Synthesis)}

---

## Modell-Antworten (unverändert)

${reviewerSections}

---

## Judge-Synthese

${judge.text || '_(Judge hat kein Ergebnis produziert)_'}

---

## Sprint-Metadaten

${costTable}

**Reviewer:** ${reviewers.map(r => r.label).join(', ')}
**Judge:** Claude Opus 4.7 (${OPUS_MODEL})
**Dauer:** ${totalDurS}s · **Erfolgreiche Reviewer:** ${successful.length}/5
${modellVerfuegbarkeit.length > 0 ? `**Modell-Fallbacks:** ${modellVerfuegbarkeit.join(', ')}` : ''}
`, 'utf-8')

  console.log('\n  ✓ Output: docs/audit-reports/k05-konzept-vertiefung-komitee-2026-05-07.md')

  // ── Handover ──────────────────────────────────────────────────────────────

  const handoverDir = join(ROOT, 'docs', 'handover')
  mkdirSync(handoverDir, { recursive: true })

  writeFileSync(join(handoverDir, 'k05-sprint-handover-2026-05-07.md'), `# K0.5 Sprint — Hand-Over

## Status
${successful.length >= 4 ? 'Erfolgreich' : `Teil-erfolgreich (${successful.length}/5 Reviewer)`}

## Output-Datei
docs/audit-reports/k05-konzept-vertiefung-komitee-2026-05-07.md

## Sprint-Daten
- Modelle (geplant): Claude Opus 4.7, Claude Sonnet 4.6, GPT-5, Gemini 2.5 Pro, Grok 4
- Modelle (tatsächlich): ${reviewers.map(r => r.label).join(', ')}
- Output-Token-Summe: ${costs.reduce((s, c) => s + c.outTok, 0).toLocaleString()}
- Kosten: €${totalEur.toFixed(4)}
- Dauer: ${totalDurS}s

## Modell-Verfügbarkeits-Notizen
${modellVerfuegbarkeit.length > 0 ? modellVerfuegbarkeit.join('\n') : 'Alle Modelle wie geplant verfügbar.'}

## Beobachtungen während des Laufs
${reviewers.filter(r => !r.text).length > 0
  ? `Fehler bei: ${reviewers.filter(r => !r.text).map(r => r.label).join(', ')}`
  : 'Alle 5 Reviewer erfolgreich abgeschlossen.'}

## Empfehlung für Synthese-Session
K0 + K0.5 zusammen lesen. Besonders: Wo revidiert K0.5 die K0-Konvergenzen?
Judge-Abschnitt "Was die Constraints konkret ausschließen" priorisieren.
`, 'utf-8')

  console.log('  ✓ Handover: docs/handover/k05-sprint-handover-2026-05-07.md')

  const logEntry = `\n## 2026-05-07 — K0.5 Sprint\nK0.5 Vertiefungs-Komitee (Cross-Model-Reaktion) gelaufen. Output: docs/audit-reports/k05-konzept-vertiefung-komitee-2026-05-07.md. Kosten: €${totalEur.toFixed(4)}. Synthese steht aus.\n`
  const logPath = join(ROOT, 'docs', 'architect-log.md')
  if (existsSync(logPath)) appendFileSync(logPath, logEntry, 'utf-8')
  else writeFileSync(logPath, `# Architect Log\n${logEntry}`, 'utf-8')
  console.log('  ✓ architect-log.md aktualisiert')

  console.log(`\n✓ K0.5 Sprint abgeschlossen — €${totalEur.toFixed(4)} — ${totalDurS}s\n`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
