#!/usr/bin/env node
// src/scripts/run-k0-committee.ts
// K0 — Exploratives Konzept-Komitee (2026-05-07)
// Einmaliger Sprint. Wiederverwendet Provider-Setup aus committee-review.ts.
// Output: docs/audit-reports/k0-konzept-explorativ-komitee-2026-05-07.md
// Handover: docs/handover/k0-sprint-handover-2026-05-07.md

import { writeFileSync, mkdirSync, readFileSync, appendFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const ROOT = resolve(process.cwd())
const START = Date.now()

// ── Provider setup (direkte Keys — AI Gateway nicht für CLI konfiguriert) ────────

const REVIEWER_MODEL = 'claude-sonnet-4-6'
const JUDGE_MODEL    = 'claude-opus-4-8'

function getAnthropicModel(modelId: string) {
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })(modelId)
}
function getOpenAIModel() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })('gpt-4o')
}
function getGeminiModel() {
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })('gemini-2.5-flash')
}
function getGrokModel() {
  return createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })('grok-4')
}

// ── K0 Prompts ────────────────────────────────────────────────────────────────

const K0_SYSTEM_PROMPT = `Du bist erfahrene/r Produkt-Designer/in mit Erfahrung in Developer-Tools, Coaching-Plattformen und EU-Compliance-Software. Du wirst beauftragt, ein Produkt für eine spezifische Zielgruppe zu konzipieren. Du arbeitest unabhängig — andere Modelle bekommen denselben Auftrag separat.

Aufgabe: Konzipiere ein Produkt für die im Kontext-Brief beschriebene Zielgruppe und Marktsituation. Beantworte fünf Kern-Fragen substantiell. Halte dich an das Output-Format am Ende.

Wichtig:
- Du sollst ein Produkt entwerfen, nicht ein bestehendes verbessern.
- Du darfst widersprechen, wenn die Fragen schlecht gestellt sind.
- Substanz vor Höflichkeit. Sycophancy ist nicht hilfreich.
- Wenn dir wichtige Entscheidungen unterwegs auffallen, die nicht in den fünf Fragen stehen, benenne sie als zusätzlichen Punkt.
- Antworte auf Deutsch.`

const K0_KONTEXT_BRIEF = `KONTEXT-BRIEF — TROPEN OS PRODUKT-KONZEPTION

MARKT-SITUATION

"Vibe-Coding" beschreibt eine neue Form der Software-Erstellung: Menschen ohne tiefe Entwickler-Erfahrung bauen Apps mit AI-gestützten Tools (Lovable, Cursor, Claude Code, Bolt, Replit). Die Tools generieren funktionierenden Code, oft sehr schnell — aber die Output-Qualität schwankt stark. Sicherheits-, Architektur-, Compliance- und Wartbarkeits-Probleme treten häufig auf, ohne dass der/die Vibe-Coder/in sie erkennt.

ZIELGRUPPE

Primär: Solo-Entrepreneurs und kleine Teams (auch KMU mit eigenen Tech-Initiativen) in DACH und EU, die mit Vibe-Coding-Tools Projekte bauen. Sie sind nicht-traditionelle Entwickler/innen — Domänen-Experten, Gründer/innen, Designer/innen, kleine interne Teams.

Charakteristika:
- Können Code lesen, aber nicht systematisch beurteilen.
- Wollen ihre Idee schnell live bringen.
- Sind sich der Lücken bewusst, aber wissen nicht, welche Lücken die wichtigsten sind.
- Haben oft kein/wenig Budget für klassische Berater/innen oder Auditor/innen.
- EU-Kontext: DSGVO, BFSG, AI Act, CRA sind reale Anforderungen, oft unklar in Reichweite.

EU-MOAT-HYPOTHESE

EU-spezifische Compliance (DSGVO, BFSG, AI Act, CRA) wird von US-zentrischen AI-Code-Review-Tools nur oberflächlich abgedeckt. Eine EU-Plattform, die diese Themen tief versteht, hat einen verteidigbaren Vorsprung in EU-Märkten.

VORHANDENE SUBSTANZ DES UNTERNEHMENS (NICHT als Architektur-Vorgabe verstehen)

- **Audit-Engine** mit 242 Regeln in 26 Kategorien. Findet sehr viele Probleme in typischen Vibe-Coder-Repos (Größenordnung: 18× mehr Findings als generische AI-Code-Reviews). Stärken: DSGVO, Testing, Accessibility, i18n, Supply Chain, Git Governance, SLOP-Detection.
- **Regelwerk** als kuratierte Sammlung — manuell erstellt, durch Komitee-Reviews validiert.
- **Multi-Model-Komitee-Mechanik** — vier Modelle plus Judge bewerten unabhängig, Konsens entsteht durch Aggregation. Funktioniert produktiv und hat in der Vergangenheit echte Architektur-Fehler korrigiert.
- **Fix-Prompt-Generator** — Findings werden in Prompts umgewandelt, die User in ihrem Bau-Tool (Cursor, Claude Code) einfügt.

Diese Substanz ist *vorhanden*, aber **nicht** als Architektur-Vorgabe für deine Konzeption gedacht. Du kannst sie wiederverwenden, umnutzen oder ignorieren — was auch immer dein Konzept verlangt.

WAS NICHT IM AUFTRAG STEHT

- Kein Naming-Vorschlag (separater Sprint).
- Keine UI-Layouts oder Wireframes.
- Keine Pricing-Strategie.
- Keine konkrete Technologie-Wahl (Frameworks, DBs, etc.) — bleib auf Konzept-Ebene.

DIE FÜNF KERN-FRAGEN

1. **Phasen-Modell**
   Welche Phasen durchläuft ein typisches Vibe-Coding-Projekt — von Idee bis Production? In welchen dieser Phasen sollte die Plattform aktiv begleiten? Wo sollte sie schweigen?

2. **Eingriffs-Logik**
   Wie spricht die Plattform den/die User/in an? Reaktiv (nur auf Frage), proaktiv (meldet sich von selbst), präventiv (strukturiert vor)? Sollte sie widersprechen, wenn der/die User/in eine schlechte Entscheidung trifft? Wenn ja, wie?

3. **Wissens-Asymmetrie**
   Was weiß ein/e typische/r Vibe-Coder/in *nicht*, was er/sie aber wissen müsste? Wo ist die größte Lücke? Sollte die Plattform Spezialist/in für eine Domäne sein oder Generalist/in?

4. **Wissens-Persistenz**
   Wie hält die Plattform Projekt-Wissen lebendig — über Wochen, über mehrere Chat-Sitzungen, über mehrere Code-Generationen hinweg? Was wird wo gespeichert? Wer schreibt rein, wer liest? (Hintergrund: Chat-Verläufe in Bau-Tools laufen voll, wichtige Entscheidungen versinken.)

5. **Lernfähigkeit**
   Sollte die Plattform mit der Zeit klüger werden? Wenn ja: Lernen aus gescannten User-Repos (Privacy-Implikationen!), aus externer Wissens-Zufuhr (CVEs, neue Gesetze, neue Best Practices), aus internen Komitee-Reviews? Wie kommt Gelerntes zu User/innen? Sehen sie es?

ZUSÄTZLICH WILLKOMMEN

Wenn dir bei der Konzeption ein wichtiger Punkt auffällt, der in den fünf Fragen nicht steht, benenne ihn als sechsten Punkt am Ende deiner Antwort. Beispiele für solche Punkte könnten sein: Verhältnis zur Bau-Tool-Welt, Geschäftsmodell-Implikationen, Risiken, alternative Zielgruppen-Schneidungen.

OUTPUT-FORMAT

Markdown mit folgenden Abschnitten:

# Konzept-Vorschlag — [dein/e Modell-Name/Kürzel]

## Kurz-Position (3–5 Sätze)
Worum geht es bei deinem Konzept im Kern?

## Antworten auf die fünf Kern-Fragen

### 1. Phasen-Modell
[Antwort]

### 2. Eingriffs-Logik
[Antwort]

### 3. Wissens-Asymmetrie
[Antwort]

### 4. Wissens-Persistenz
[Antwort]

### 5. Lernfähigkeit
[Antwort]

## Zusatzpunkte (falls relevant)
[Punkte, die nicht in die fünf Fragen passen]

## Drei Risiken / Schwächen deines eigenen Konzepts
Sei selbstkritisch. Wo ist dein Vorschlag fragil?

## Eine alternative Konzeption, die du *nicht* gewählt hast
Skizziere kurz: Was wäre eine andere plausible Konzeption, und warum hast du sie nicht gewählt?`

const K0_JUDGE_SYSTEM_PROMPT = `Du bist Judge in einem Multi-Model-Komitee. Vier Modelle haben unabhängig ein Produkt-Konzept für eine Vibe-Coding-Begleitplattform entworfen. Deine Aufgabe ist NICHT zu entscheiden, welches Konzept "gewinnt". Deine Aufgabe ist, Konvergenzen und Divergenzen so klar wie möglich sichtbar zu machen.`

const K0_JUDGE_PROMPT = `# K0 Komitee-Synthese — Opus-Judge

## Konvergenz (was alle/fast alle vier Modelle ähnlich sehen)
Pro Kern-Frage: was ist Konsens? Wo wären Architektur-Entscheidungen "sicher"?

## Divergenz (was sich substantiell unterscheidet)
Pro Kern-Frage: wo gehen die Modelle auseinander? Welche unterschiedlichen Architektur-Pfade ergeben sich?

## Übersehene Punkte
Welche Themen tauchen in den Zusatz-Punkten der Modelle auf, die in den fünf Kern-Fragen nicht enthalten waren? (Diese Themen sind potenziell die wichtigsten — sie waren nicht im Auftrag, kamen aber trotzdem hoch.)

## Sechs Fragen für die menschliche Entscheidung
Nach der Komitee-Lektüre — welche sechs offenen Fragen muss das Tropen-Team selbst beantworten? Sortiere nach Tragweite.

## Methoden-Hinweise
Was im Sprint-Setup hat funktioniert, was würdest du beim nächsten explorativen Komitee anders machen?`

// ── Provider call ────────────────────────────────────────────────────────────

interface CallResult {
  text: string
  inputTokens: number
  outputTokens: number
  durationMs: number
}

async function callModel(
  label: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelFn: () => any,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number,
): Promise<CallResult> {
  const t0 = Date.now()
  try {
    const result = await generateText({
      model: modelFn(),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens,
    })
    return {
      text: result.text?.trim() ?? '',
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      durationMs: Date.now() - t0,
    }
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 200)}`)
    return { text: '', inputTokens: 0, outputTokens: 0, durationMs: Date.now() - t0 }
  }
}

// ── Cost estimation ──────────────────────────────────────────────────────────

const PRICES: Record<string, { inPerM: number; outPerM: number }> = {
  'Claude Sonnet':  { inPerM: 3.0,  outPerM: 15.0 },
  'GPT-4o':        { inPerM: 2.5,  outPerM: 10.0 },
  'Gemini 2.5 Flash': { inPerM: 0.30, outPerM: 2.50 },
  'Grok 4':        { inPerM: 3.0,  outPerM: 15.0 },
  'Judge (Opus)':  { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93

function eur(label: string, inTok: number, outTok: number) {
  const p = PRICES[label] ?? { inPerM: 3.0, outPerM: 15.0 }
  return ((inTok * p.inPerM + outTok * p.outPerM) / 1_000_000) * USD_TO_EUR
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY fehlt in .env.local')
    process.exit(1)
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(' K0 — Exploratives Konzept-Komitee')
  console.log(' 2026-05-07')
  console.log('═══════════════════════════════════════════════════════')
  console.log('\nRufe 4 Reviewer parallel auf…')

  const [r1, r2, r3, r4] = await Promise.all([
    callModel('Claude Sonnet',     () => getAnthropicModel(REVIEWER_MODEL), K0_SYSTEM_PROMPT, K0_KONTEXT_BRIEF, 5000),
    callModel('GPT-4o',            getOpenAIModel,                          K0_SYSTEM_PROMPT, K0_KONTEXT_BRIEF, 5000),
    callModel('Gemini 2.5 Flash',  getGeminiModel,                          K0_SYSTEM_PROMPT, K0_KONTEXT_BRIEF, 5000),
    callModel('Grok 4',            getGrokModel,                            K0_SYSTEM_PROMPT, K0_KONTEXT_BRIEF, 5000),
  ])

  const reviewers = [
    { label: 'Claude Sonnet',    ...r1 },
    { label: 'GPT-4o',           ...r2 },
    { label: 'Gemini 2.5 Flash', ...r3 },
    { label: 'Grok 4',           ...r4 },
  ]

  for (const r of reviewers) {
    const status = r.text ? '✓' : '✗'
    console.log(`  ${status} ${r.label}: ${r.inputTokens} in / ${r.outputTokens} out (${(r.durationMs/1000).toFixed(1)}s)`)
  }

  const successful = reviewers.filter(r => r.text)
  if (successful.length === 0) { console.error('✗ Alle Reviewer fehlgeschlagen'); process.exit(1) }

  // Build judge input: all reviewer outputs verbatim
  const judgeInput = successful.map(r => `=== ${r.label.toUpperCase()} ===\n\n${r.text}`).join('\n\n---\n\n')
  const judgeUserPrompt = `${successful.length} Modelle haben unabhängig ein Produkt-Konzept entworfen:\n\n${judgeInput}\n\n---\n\n${K0_JUDGE_PROMPT}`

  console.log('\nJudge (Opus) destilliert…')
  const judge = await callModel('Judge (Opus)', () => getAnthropicModel(JUDGE_MODEL), K0_JUDGE_SYSTEM_PROMPT, judgeUserPrompt, 6000)
  console.log(`  ✓ Judge: ${judge.inputTokens} in / ${judge.outputTokens} out (${(judge.durationMs/1000).toFixed(1)}s)`)

  // Cost table
  const costs = [
    ...reviewers.map(r => ({ label: r.label, inTok: r.inputTokens, outTok: r.outputTokens, costEur: eur(r.label, r.inputTokens, r.outputTokens) })),
    { label: 'Judge (Opus)', inTok: judge.inputTokens, outTok: judge.outputTokens, costEur: eur('Judge (Opus)', judge.inputTokens, judge.outputTokens) },
  ]
  const totalEur = costs.reduce((s, c) => s + c.costEur, 0)
  const totalDurS = ((Date.now() - START) / 1000).toFixed(0)

  const costTable = `| Modell              | In-Tok  | Out-Tok | Kosten     |
|---------------------|---------|---------|------------|
${costs.map(c => `| ${c.label.padEnd(19)} | ${String(c.inTok).padStart(7)} | ${String(c.outTok).padStart(7)} | €${c.costEur.toFixed(4)} |`).join('\n')}
| **Gesamt**          |         |         | **€${totalEur.toFixed(4)}** |`

  // ── Output file ───────────────────────────────────────────────────────────

  const outputDir = join(ROOT, 'docs', 'audit-reports')
  const outputPath = join(outputDir, 'k0-konzept-explorativ-komitee-2026-05-07.md')
  mkdirSync(outputDir, { recursive: true })

  const reviewerSections = reviewers
    .map(r => r.text
      ? `## ${r.label}\n\n${r.text}`
      : `## ${r.label}\n\n_(Kein Output — Fehler beim Aufruf)_`
    ).join('\n\n---\n\n')

  const outputMd = `# K0 — Exploratives Konzept-Komitee

> Sprint: 2026-05-07 · Modelle: Claude Sonnet, GPT-4o, Gemini 2.5 Flash, Grok 4 · Judge: Claude Opus · Dauer: ${totalDurS}s · Kosten: €${totalEur.toFixed(4)}

---

## Kontext-Brief (verbatim)

${K0_KONTEXT_BRIEF}

---

## Modell-Antworten (unverändert)

${reviewerSections}

---

## Judge-Synthese

${judge.text || '_(Judge hat kein Ergebnis produziert)_'}

---

## Sprint-Metadaten

${costTable}

**Modelle:** Claude Sonnet 4 (${REVIEWER_MODEL}), GPT-4o, Gemini 2.5 Flash, Grok 4
**Judge:** Claude Opus 4 (${JUDGE_MODEL})
**Dauer:** ${totalDurS}s
**Erfolgreiche Reviewer:** ${successful.length}/4
`

  writeFileSync(outputPath, outputMd, 'utf-8')
  console.log(`\n  ✓ Output: docs/audit-reports/k0-konzept-explorativ-komitee-2026-05-07.md`)

  // ── Handover file ─────────────────────────────────────────────────────────

  const handoverDir = join(ROOT, 'docs', 'handover')
  mkdirSync(handoverDir, { recursive: true })

  const handoverMd = `# K0 Sprint — Hand-Over

## Status
${successful.length === 4 ? 'Erfolgreich' : `Teil-erfolgreich (${successful.length}/4 Reviewer)`}

## Output-Datei
docs/audit-reports/k0-konzept-explorativ-komitee-2026-05-07.md

## Sprint-Daten
- Modelle: Claude Sonnet (${REVIEWER_MODEL}), GPT-4o, Gemini 2.5 Flash, Grok 4
- Judge: Claude Opus (${JUDGE_MODEL})
- Output-Token-Summe: ${costs.reduce((s, c) => s + c.outTok, 0).toLocaleString()}
- Kosten: €${totalEur.toFixed(4)}
- Dauer: ${totalDurS}s

## Beobachtungen während des Laufs
${reviewers.filter(r => !r.text).length > 0
  ? `Fehler bei: ${reviewers.filter(r => !r.text).map(r => r.label).join(', ')}`
  : 'Alle 4 Reviewer erfolgreich abgeschlossen.'}

## Empfehlung für Synthese-Session
Konvergenzen und Divergenzen in der Judge-Synthese gegen zielbild-2026-q3.md mappen.
Besonders auf "Übersehene Punkte" und "Sechs Fragen für die menschliche Entscheidung" achten.
`

  writeFileSync(join(handoverDir, 'k0-sprint-handover-2026-05-07.md'), handoverMd, 'utf-8')
  console.log('  ✓ Handover: docs/handover/k0-sprint-handover-2026-05-07.md')

  // ── architect-log.md ──────────────────────────────────────────────────────

  const logEntry = `\n## 2026-05-07 — K0 Sprint\nK0 Komitee-Sprint gelaufen. Output: docs/audit-reports/k0-konzept-explorativ-komitee-2026-05-07.md. Kosten: €${totalEur.toFixed(4)}. Synthese steht aus (Sparring-Session Mensch + Claude.ai).\n`
  const logPath = join(ROOT, 'docs', 'architect-log.md')
  if (existsSync(logPath)) {
    appendFileSync(logPath, logEntry, 'utf-8')
  } else {
    writeFileSync(logPath, `# Architect Log\n${logEntry}`, 'utf-8')
  }
  console.log('  ✓ architect-log.md aktualisiert')

  console.log(`\n✓ K0 Sprint abgeschlossen — €${totalEur.toFixed(4)} — ${totalDurS}s\n`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
