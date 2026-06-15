#!/usr/bin/env node
// src/scripts/run-k06-committee.ts
// K0.6 — Doku-Konvention für Vibe-Coder (2026-05-07)
// 5 Modelle + Opus-Judge. Offener Auftrag, kein Frage-Schema.
// Output: docs/audit-reports/k06-doku-konvention-komitee-2026-05-07.md

import { writeFileSync, mkdirSync, appendFileSync, existsSync } from 'fs'
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

function getOpus()     { return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '', baseURL: 'https://api.anthropic.com/v1' })(OPUS_MODEL) }
function getSonnet()   { return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '', baseURL: 'https://api.anthropic.com/v1' })(SONNET_MODEL) }
function getGPT5()     { return createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })('gpt-5') }
function getGPT4o()    { return createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })('gpt-4o') }
function getGemini()   { return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })('gemini-2.5-pro') }
function getGrok()     { return createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })('grok-4') }

// ── Prompts ───────────────────────────────────────────────────────────────────

const K06_SYSTEM = `Du bist erfahrene/r Software-Engineer/in mit Schwerpunkt Knowledge-Management, Doku-Architektur und Developer-Experience. Du hast über die Jahre gesehen, wie Doku in Repos verwildert — und welche Konventionen das verhindern.

Deine Aufgabe ist offen formuliert. Es gibt kein Frage-Schema. Es gibt ein Problem, harte Constraints und einen Output-Rahmen.

Wichtig:
- Substanz vor Höflichkeit. Kein Sycophancy.
- Wenn du eine starke Position hast, vertrete sie. Wenn du unsicher bist, sag das.
- Wenn dir Constraints widersprechen oder unrealistisch erscheinen, sag das — und arbeite trotzdem mit ihnen.
- Du arbeitest unabhängig, andere Modelle bekommen denselben Auftrag separat.
- Antworte auf Deutsch.`

const K06_BRIEF = `KONTEXT-BRIEF — DOKU-KONVENTION FÜR VIBE-CODER (K0.6)

DAS PROBLEM

"Vibe-Coding" beschreibt eine neue Form der Software-Erstellung: Menschen ohne tiefe Entwickler-Erfahrung bauen SaaS-Anwendungen mit AI-Bau-Agenten (Cursor, Claude Code, Lovable, Bolt, Replit, GitHub Copilot, Continue, Aider, Windsurf, Cline, und weitere). Der Bau-Agent generiert auf Zuruf Code, oft sehr schnell.

Im Lauf eines Projekts entsteht parallel zum Code eine wachsende Menge an Doku — Roadmaps, Strategie-Dokumente, ADRs, Status-Reports, Sparring-Outputs, Übergabe-Notizen, Konzept-Dokus, Pivot-Notizen, Plan-Dateien. Der Bau-Agent erstellt diese Dokumente ebenfalls auf Zuruf — oft mit der besten Absicht, neuen Inhalt sauber zu kapseln, dafür aber in immer neuen Verzeichnissen, mit immer neuen Dateinamen, ohne Rücksicht auf den Bestand.

Das Resultat ist ein typisches Vibe-Coding-Phänomen, das wir "Doku-Wildwuchs" nennen:

- Mehrere parallele Roadmaps, die sich teilweise widersprechen ("roadmap.md", "roadmap-v2.md", "roadmap-2026-q2.md", "ROADMAP.md")
- Strategie-Dokumente, deren Status (Entwurf / aktiv / überholt) nirgends ablesbar ist
- ADRs ohne klare Kennzeichnung, ob sie noch gültig sind
- Konzept-Dokus, die nirgendwo verlinkt sind und im Repo "verwaist" liegen
- Übergabe-Dokumente, die nie konsolidiert werden — jeder neue Chat erzeugt einen neuen Stand
- Doku-Verzeichnisse, die organisch entstehen (docs/, docs/notes/, docs/strategy/, docs/inventur/, docs/handover/, documents/, notes/)

Der Vibe-Coder verliert über Wochen den Überblick. Der Bau-Agent verliert ihn auch — er findet beim nächsten Aufruf nicht mehr verlässlich die maßgebliche Quelle und produziert deshalb noch mehr Doku.

DEINE AUFGABE

Entwirf eine Doku-Konvention für Vibe-Coder, die diesen Wildwuchs verhindert.

Du entscheidest selbst:
- Welche Tools du in deinem Entwurf berücksichtigst (Cursor, Claude Code, Lovable, Bolt, ggf. weitere — du wählst)
- Welche Architektur die Konvention hat (einheitlich für alle Tools? Tool-spezifische Adapter? Gemeinsamer Kern + Adapter? Tool-agnostisch und User spiegelt selbst?)
- Welche Verzeichnis-Struktur, welche Datei-Typen, welche Lebenszyklen
- Welche Verbindlichkeit (was ist Pflicht, was ist Empfehlung)
- Welche Mechaniken Drift verhindern (Status-Felder, Verfallsdaten, Verlinkungs-Pflicht, Index-Datei)

HARTE CONSTRAINTS

Diese Constraints prägen deine Antworten — sie sind nicht verhandelbar:

- **Solo-Founder oder Kleinteam (1–3 Personen)**, der/die selbst entwickelt mit AI-Bau-Agent.
- **6–12 Monate Projekt-Laufzeit** ist die typische Erfahrung. Konvention muss diese Zeit überstehen, ohne dass der Mensch zum Doku-Bibliothekar wird.
- **Mehrere parallele Projekte** sind realistisch (User hat oft 2–4 Repos parallel). Konvention muss konsistent über Projekte hinweg anwendbar sein, ohne dass jedes Projekt neu erfunden wird.
- **AI-Bau-Agent ist die Ausführungs-Hand.** Die Konvention muss vom Agent verlässlich befolgt werden können — sie muss in einer Form vorliegen, die der Agent versteht und respektiert. Konventionen, die nur ein menschlicher Disziplin-Mensch durchhält, scheitern.
- **Tool-Wechsel ist Realität, nicht Ausnahme.** User probieren aus, wechseln zwischen Cursor, Claude Code, Lovable, Bolt. Die Konvention sollte diesen Wechsel als Anforderung benennen — du musst den Wechsel nicht *lösen*, aber als zu adressierende Anforderung sichtbar machen.

DOPPEL-VERWENDUNG (WICHTIG)

Dein Entwurf hat zwei mögliche Verwendungen, die du beide bedienen sollst:

a) **Eigene Doku-Disziplin** für ein konkretes Vibe-Coding-Projekt namens Tropen OS (Begleitplattform für Vibe-Coder, derzeit in Entwicklung). Tropen OS hat selbst Doku-Wildwuchs.

b) **Substanz für ein Produkt-Feature** in Tropen OS: Doku-Hygiene als fünfte Wissens-Domäne ("Vier-Domänen-Spezialist" wird "Fünf-Domänen-Spezialist"). Tropen würde dann Repos auf Doku-Wildwuchs scannen, gemäß deiner Konvention oder einer ähnlichen.

Berücksichtige beide Verwendungen, aber halte sie im Output sauber getrennt — was ist die Konvention, was wäre als Produkt-Feature implementierbar.

OUTPUT-FORMAT

# Doku-Konvention K0.6 — [Modell]

## Kern-Position (5–7 Sätze)
Was ist deine Grundidee? Welche Wette steckt drin?

## Konvention (für eigene Doku-Disziplin)

### Architektur-Entscheidung
Wie geht deine Konvention mit Tool-Vielfalt um (einheitlich / Adapter / agnostisch / anders)? Welche Tools hast du berücksichtigt? Begründung in 3–5 Sätzen.

### Verzeichnis-Struktur
Welche Verzeichnisse, welche Datei-Typen, welche Datei-Namen-Konventionen. Konkret, nicht abstrakt.

### Lebenszyklus pro Datei
Wie wird eine neue Datei angelegt, wie wird sie aktualisiert, wann wird sie archiviert oder gelöscht. Welche Status-Felder. Wie verhindert die Konvention "Datei XY-v2.md" neben "Datei XY.md".

### Verbindlichkeits-Stufen
Was ist Pflicht (verstößt der Agent dagegen, ist es ein Bug), was Empfehlung (verstößt der Agent, ist es ein Hinweis), was Freistil.

### Drift-Schutz-Mechaniken
Konkrete Mechaniken die verhindern, dass Doku binnen 3 Monaten wieder verwildert. Nenne 3–5 mit Wirkungsweise.

### Tool-Wechsel-Anforderung
Benennen (nicht lösen): Was muss eine Konvention berücksichtigen, wenn der User von Tool A zu Tool B wechselt? Welche Anforderungen entstehen?

### Wie der Agent die Konvention befolgt
Wo steht die Konvention, sodass jeder Bau-Agent sie verlässlich liest? Datei-Pfad, Format, Verlinkung.

## Produkt-Feature-Skizze (für Tropen OS Achse 9)

### Was Tropen scannen würde
Welche konkreten Verstöße gegen Doku-Hygiene würde Tropen als Findings melden? 5–10 Beispiele (analog zu Audit-Findings für DSGVO oder Security).

### Severity-Logik
Welche Verstöße sind Critical (würde Release blockieren), welche Should, welche Info.

### Fix-Prompt-Beispiele
Skizziere 2 Fix-Prompts, die Tropen User geben würde — ein einfacher (z.B. "Doppelte Roadmap erkannt"), einer komplexer (z.B. "Konzept-Doku verwaist, kein Anker im Repo").

### Abgrenzung
Was sollte Tropen als Doku-Hygiene-Feature *nicht* tun? Wo ist die Grenze zwischen Hilfe und Bevormundung?

## Drei Risiken / Schwächen deines Vorschlags
Sei selbstkritisch. Wo bricht die Konvention?

## Eine alternative Konvention, die du *nicht* gewählt hast
Skizziere kurz: Was wäre eine andere plausible Konvention, und warum hast du sie nicht gewählt?`

const K06_JUDGE_SYSTEM = `Du bist Judge im Komitee K0.6. Fünf Modelle haben unabhängig eine Doku-Konvention für Vibe-Coder entworfen. Anders als bei K0/K0.5 gab es keine vorgegebenen Fragen — die Modelle hatten freie Hand. Deine Aufgabe ist Konzept-Familien-Bildung, nicht Frage-für-Frage-Synthese.`

const K06_JUDGE_PROMPT = `# K0.6 Komitee-Synthese — Opus-Judge

## Konzept-Familien (was die Modelle vorgeschlagen haben)

Cluster die fünf Vorschläge in 2–4 Konzept-Familien. Pro Familie:

- **Familie [Name]:** Kern-Idee in 2–3 Sätzen
- **Vertretene Modelle:** [welche Modelle gehören dazu]
- **Stärken** (was diese Familie gut adressiert)
- **Schwächen** (wo diese Familie fragil ist)

## Querliegende Konvergenzen

Was haben *alle* Vorschläge gemeinsam, unabhängig von Konzept-Familie? Diese Punkte sind die robuste Basis.

## Querliegende Divergenzen

Wo widersprechen sich die Vorschläge fundamental? Welche Entscheidungen muss das Tropen-Team also explizit treffen?

## Empfehlung pro Schicht

Für jede der folgenden Schichten eine konkrete Empfehlung, mit Begründung aus den fünf Vorschlägen:

1. **Architektur-Entscheidung Tool-Umgang** (einheitlich / Adapter / agnostisch / anders)
2. **Verzeichnis-Struktur** (was ist die robuste Empfehlung)
3. **Lebenszyklus-Mechanik** (wie verhindern wir Versions-Wildwuchs)
4. **Verbindlichkeits-Stufen** (was ist Pflicht, was Empfehlung)
5. **Drift-Schutz** (welche 3 Mechaniken sind die wirksamsten)
6. **Wie Bau-Agent die Konvention liest** (Pfad, Format)

## Tropen-Produkt-Feature: Was tragen die Vorschläge

Welche der vorgeschlagenen Doku-Hygiene-Findings sind als Produkt-Feature in Tropens Audit-Engine umsetzbar? Welche sind zu subjektiv oder zu schwer automatisierbar?

## Tool-Wechsel-Anforderung: Synthese

Wie haben die Modelle die Tool-Wechsel-Anforderung benannt? Welche Anforderungen kristallisieren sich heraus?

## Drei Trade-offs, die das Tropen-Team explizit treffen muss

Sortiert nach Tragweite.

## Was die Constraints konkret ausschließen

Welche der Vorschläge sind unter den Constraints (1–3 Personen, 6–12 Monate, mehrere Projekte, Tool-Wechsel) unrealistisch?

## Methodisches Feedback

Hat der offene Auftrag (kein Frage-Schema) funktioniert? Was würdest du beim nächsten offenen Komitee anders machen?`

// ── Provider call ─────────────────────────────────────────────────────────────

interface CallResult {
  text: string; inputTokens: number; outputTokens: number; durationMs: number; usedLabel: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callModel(label: string, modelFn: () => any, sys: string, user: string, maxOut: number, fallbackFn?: () => any, fallbackLabel?: string): Promise<CallResult> {
  const t0 = Date.now()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attempt = async (fn: () => any, lbl: string): Promise<CallResult> => {
    try {
      const r = await generateText({ model: fn(), system: sys, prompt: user, maxOutputTokens: maxOut })
      return { text: r.text?.trim() ?? '', inputTokens: r.usage?.inputTokens ?? 0, outputTokens: r.usage?.outputTokens ?? 0, durationMs: Date.now() - t0, usedLabel: lbl }
    } catch (err) {
      console.warn(`  ⚠ ${lbl} failed: ${String(err).slice(0, 160)}`)
      if (fallbackFn && lbl === label) return attempt(fallbackFn, fallbackLabel ?? lbl + '-fallback')
      return { text: '', inputTokens: 0, outputTokens: 0, durationMs: Date.now() - t0, usedLabel: lbl }
    }
  }
  return attempt(modelFn, label)
}

// ── Cost estimation ───────────────────────────────────────────────────────────

const PRICES: Record<string, { inPerM: number; outPerM: number }> = {
  'Claude Opus 4.7':   { inPerM: 15.0, outPerM: 75.0 },
  'Claude Sonnet 4.6': { inPerM: 3.0,  outPerM: 15.0 },
  'GPT-5':             { inPerM: 10.0, outPerM: 40.0 },
  'GPT-4o':            { inPerM: 2.5,  outPerM: 10.0 },
  'Gemini 2.5 Pro':    { inPerM: 1.25, outPerM: 10.0 },
  'Grok 4':            { inPerM: 3.0,  outPerM: 15.0 },
  'Judge (Opus)':      { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93

function eur(label: string, inTok: number, outTok: number) {
  const p = PRICES[label] ?? { inPerM: 3.0, outPerM: 15.0 }
  return ((inTok * p.inPerM + outTok * p.outPerM) / 1_000_000) * USD_TO_EUR
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error('✗ ANTHROPIC_API_KEY fehlt'); process.exit(1) }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(' K0.6 — Doku-Konvention für Vibe-Coder')
  console.log(' 2026-05-07')
  console.log('═══════════════════════════════════════════════════════')
  console.log('\nRufe 5 Reviewer parallel auf…')

  const [r1, r2, r3, r4, r5] = await Promise.all([
    callModel('Claude Opus 4.7',   getOpus,   K06_SYSTEM, K06_BRIEF, 5000),
    callModel('Claude Sonnet 4.6', getSonnet, K06_SYSTEM, K06_BRIEF, 5000),
    callModel('GPT-5',             getGPT5,   K06_SYSTEM, K06_BRIEF, 5000, getGPT4o, 'GPT-4o (Fallback)'),
    callModel('Gemini 2.5 Pro',    getGemini, K06_SYSTEM, K06_BRIEF, 5000),
    callModel('Grok 4',            getGrok,   K06_SYSTEM, K06_BRIEF, 5000),
  ])

  const reviewers = [
    { label: 'Claude Opus 4.7',   ...r1 },
    { label: 'Claude Sonnet 4.6', ...r2 },
    { label: r3.usedLabel,        ...r3 },
    { label: 'Gemini 2.5 Pro',    ...r4 },
    { label: 'Grok 4',            ...r5 },
  ]

  const fallbacks: string[] = []
  for (const r of reviewers) {
    console.log(`  ${r.text ? '✓' : '✗'} ${r.label}: ${r.inputTokens} in / ${r.outputTokens} out (${(r.durationMs/1000).toFixed(1)}s)`)
    if (r.label !== r.usedLabel) fallbacks.push(`${r.label} → ${r.usedLabel}`)
  }

  const successful = reviewers.filter(r => r.text)
  if (!successful.length) { console.error('✗ Alle Reviewer fehlgeschlagen'); process.exit(1) }

  const judgeInput = successful.map(r => `=== ${r.label.toUpperCase()} ===\n\n${r.text}`).join('\n\n---\n\n')
  const judgePrompt = `${successful.length} Modelle haben unabhängig eine Doku-Konvention entworfen:\n\n${judgeInput}\n\n---\n\n${K06_JUDGE_PROMPT}`

  console.log('\nJudge (Opus 4.7) destilliert…')
  const judge = await callModel('Judge (Opus)', getOpus, K06_JUDGE_SYSTEM, judgePrompt, 6000)
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

  const reviewerSections = reviewers
    .map(r => r.text ? `## ${r.label}\n\n${r.text}` : `## ${r.label}\n\n_(Kein Output)_`)
    .join('\n\n---\n\n')

  writeFileSync(join(outputDir, 'k06-doku-konvention-komitee-2026-05-07.md'), `# K0.6 — Doku-Konvention für Vibe-Coder

> Sprint: 2026-05-07 · Modelle: ${reviewers.map(r => r.label).join(', ')} · Judge: Claude Opus 4.7 · Dauer: ${totalDurS}s · Kosten: €${totalEur.toFixed(4)}

---

## Kontext-Brief (verbatim)

${K06_BRIEF}

---

## Modell-Antworten (unverändert)

${reviewerSections}

---

## Judge-Synthese

${judge.text || '_(Judge hat kein Ergebnis produziert)_'}

---

## Sprint-Metadaten

${costTable}

**Judge:** Claude Opus 4.7 (${OPUS_MODEL})
**Dauer:** ${totalDurS}s · **Erfolgreiche Reviewer:** ${successful.length}/5
${fallbacks.length > 0 ? `**Fallbacks:** ${fallbacks.join(', ')}` : ''}
`, 'utf-8')

  console.log('\n  ✓ Output: docs/audit-reports/k06-doku-konvention-komitee-2026-05-07.md')

  // ── Handover ──────────────────────────────────────────────────────────────

  const handoverDir = join(ROOT, 'docs', 'handover')
  mkdirSync(handoverDir, { recursive: true })

  writeFileSync(join(handoverDir, 'k06-sprint-handover-2026-05-07.md'), `# K0.6 Sprint — Hand-Over

## Status
${successful.length >= 4 ? 'Erfolgreich' : `Teil-erfolgreich (${successful.length}/5 Reviewer)`}

## Output-Datei
docs/audit-reports/k06-doku-konvention-komitee-2026-05-07.md

## Sprint-Daten
- Modelle (geplant): Claude Opus 4.7, Claude Sonnet 4.6, GPT-5, Gemini 2.5 Pro, Grok 4
- Modelle (tatsächlich): ${reviewers.map(r => r.label).join(', ')}
- Output-Token-Summe: ${costs.reduce((s, c) => s + c.outTok, 0).toLocaleString()}
- Kosten: €${totalEur.toFixed(4)}
- Dauer: ${totalDurS}s

## Modell-Verfügbarkeits-Notizen
${fallbacks.length > 0 ? fallbacks.join('\n') : 'Alle Modelle wie geplant verfügbar.'}

## Beobachtungen während des Laufs
${reviewers.filter(r => !r.text).length > 0
  ? `Fehler bei: ${reviewers.filter(r => !r.text).map(r => r.label).join(', ')}`
  : 'Alle 5 Reviewer erfolgreich.'}

## Konzept-Familien-Spreizung
Aus Judge-Synthese erschließbar (Abschnitt "Konzept-Familien").

## Empfehlung für Synthese-Session
Konzept-Familien gegen eigenen Doku-Wildwuchs in Tropen OS mappen.
Dann: Aufräum-Aktion auf Repo gemäß beschlossener Konvention.
`, 'utf-8')

  console.log('  ✓ Handover: docs/handover/k06-sprint-handover-2026-05-07.md')

  const logEntry = `\n## 2026-05-07 — K0.6 Sprint\nK0.6 Doku-Konvention-Komitee gelaufen. Output: docs/audit-reports/k06-doku-konvention-komitee-2026-05-07.md. Kosten: €${totalEur.toFixed(4)}.\n`
  const logPath = join(ROOT, 'docs', 'architect-log.md')
  if (existsSync(logPath)) appendFileSync(logPath, logEntry, 'utf-8')
  else writeFileSync(logPath, `# Architect Log\n${logEntry}`, 'utf-8')
  console.log('  ✓ architect-log.md aktualisiert')

  console.log(`\n✓ K0.6 Sprint abgeschlossen — €${totalEur.toFixed(4)} — ${totalDurS}s\n`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
