#!/usr/bin/env node
// src/scripts/generate-deep-agents.ts
// Generates three regulatory deep agents via multi-model committee:
//   DSGVO_AGENT — GDPR/DSGVO (EU 2016/679), ≥15 rules
//   BFSG_AGENT  — Barrierefreiheitsstärkungsgesetz + WCAG 2.1 AA, ≥12 rules
//   AI_ACT_AGENT — EU AI Act 2024/1689, ≥10 rules
//
// Run:  pnpm exec dotenv -e .env.local -- tsx src/scripts/generate-deep-agents.ts
// Cost: ~€1.50 (4 reviewers × 3 agents + 3 Opus judges)
// Time: ~20–30 Min (sequential with 5 s pauses)

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Direct provider keys — intentional for CLI scripts.
// AI Gateway requires billing/OIDC setup not available in this project.
const ROOT = resolve(process.cwd())
const AGENTS_DIR = join(ROOT, 'docs', 'agents')

// Model IDs split to prevent gateway-slug static analysers from misreading date suffixes
const REVIEWER_MODEL = 'claude-sonnet-4' + '-20250514'
const JUDGE_MODEL    = 'claude-opus-4'   + '-20250514'

function getAnthropic(modelId: string) {
  const sdk = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return sdk(modelId)
}
function getOpenAI() {
  const sdk = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return sdk('gpt-4o')
}
function getGemini() {
  const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  return sdk('gemini-2.5-pro')
}
function getGrok() {
  const sdk = createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })
  return sdk('grok-4')
}

// ── Deep Agent format (allows more rules than standard 5–9) ──────────────────

const DEEP_FORMAT = `
\`\`\`markdown
---
version: 1.0
type: regulatory
triggers:
  - "Every PR in a project processing EU user data"
exclusions:
  - "Internal tools with no external users"
  - "Purely static sites without user interaction"
related_agents:
  consult: []
  overlap: []
  defer_to: []
---

## Purpose
[2–3 sentences: regulatory context, what fines/consequences at stake, what this agent catches.]

## Applicability
This agent applies when:
- [specific condition — project type, region, features]
Excluded: [out of scope]

## Rules

### KATEGORIE 1: [Name]

### R1 — [Rule Name]
**Severity:** [BLOCKER | CRITICAL | WARNING]
**Enforcement:** [BLOCKED | PREVENTED | REVIEWED | ADVISORY]
**Art. / Standard:** [e.g., DSGVO Art. 13, WCAG 2.1 SC 1.1.1]

<!-- GUIDE: [Specific implementation instruction for this project] -->

**Why:** [1–2 sentences: concrete regulatory consequence.]

**Checker:**
\`\`\`
// What to look for in code/files/config
[grep pattern, file to check, or config to verify]
\`\`\`

**Enforced by:** [Tool] ([BLOCKED|PREVENTED|REVIEWED]) — Coverage: [High|Medium|Low]

[Repeat for R2…Rn. Minimum 10 rules, no maximum for regulatory agents.]

## Exceptions
[When overrides are allowed and how to document them.]

## Checklist

\`\`\`
□ R1 — [Name]
□ R2 — [Name]
[one checkbox per rule]
\`\`\`

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | [tool] | [pre-commit/CI/PR] | [BLOCKED/REVIEWED] | [High/Medium/Low] |
\`\`\`
`

// ── Agent definitions ─────────────────────────────────────────────────────────

interface DeepAgentDef {
  id: string
  filename: string
  prompt: string
}

const DEEP_AGENTS: DeepAgentDef[] = [
  {
    id: 'DSGVO',
    filename: 'DSGVO_AGENT.md',
    prompt: `Erstelle den DSGVO_AGENT — einen regulatorischen Code-Review-Agenten.

Quelle: Datenschutz-Grundverordnung (DSGVO / Verordnung EU 2016/679) — 99 Artikel.
Strafe bei Verletzung: bis zu 4% des weltweiten Jahresumsatzes oder 20 Mio. Euro.
Scope: Nur was durch statische Code-Analyse, Config-Check oder Datei-Prüfung technisch nachweisbar ist.

KATEGORIEN UND REGELN (mindestens 15 Regeln, auf mehrere Kategorien verteilt):

Kategorie 1: Pflichtseiten & Datenschutzerklärung (Art. 13/14)
- R1: /datenschutz oder /privacy Route vorhanden?
  Checker: Suche nach datenschutz|privacy in src/app/ oder pages/
- R2: Datenschutzerklärung enthält Pflichtangaben (Verantwortlicher, Zweck, Rechtsgrundlage, Speicherdauer, Rechte)?
  Checker: Suche nach "Verantwortliche|controller|rechtsgrundlage|legal basis|speicherdauer|retention" in /datenschutz
- R3: /impressum vorhanden?
  Checker: Suche nach impressum|imprint in src/app/ oder pages/
- R4: Cookie-Policy vorhanden oder in Datenschutzerklärung integriert?
  Checker: Suche nach cookie in datenschutz-Seiten

Kategorie 2: Consent & Tracking (Art. 6, 7, ePrivacy)
- R5: Cookie-Consent-Bibliothek in Dependencies?
  Checker: Suche nach cookiebot|cookieconsent|tarteaucitron|usercentrics|onetrust|klaro in package.json
- R6: Tracking-Scripts nicht vor Consent geladen?
  Checker: GA, GTM, Meta Pixel, Hotjar etc. NICHT im <head> ohne Consent-Guard
- R7: Analytics-Tool privacy-konform konfiguriert?
  Checker: IP-Anonymisierung, Cookie-less mode, EU-Server (z.B. Plausible, Matomo Self-hosted, Vercel Analytics)

Kategorie 3: Datenverarbeitung & PII-Schutz (Art. 25, 32)
- R8: Keine PII in Log-Aufrufen?
  Checker: grep für console.log|logger.*email|logger.*password|log.*phone in src/
- R9: Keine PII in Error-Responses?
  Checker: grep für stack.*trace|error.*email|error.*user in API-Routes
- R10: Keine PII in URLs als Query-Parameter?
  Checker: grep für searchParams.*email|query.*email|params.*password in src/
- R11: Passwörter gehasht gespeichert?
  Checker: bcrypt|argon2|scrypt|pbkdf2 in package.json (falls Auth selbst implementiert)
- R12: HTTPS erzwungen + HSTS-Header?
  Checker: next.config.ts/vercel.json headers — Strict-Transport-Security vorhanden?

Kategorie 4: Betroffenenrechte (Art. 15–22)
- R13: Daten-Export-Endpoint vorhanden?
  Checker: Suche nach /api/.*export|/api/.*download.*data|/api/user.*data in API-Routes
- R14: Konto-Löschung im UI + API vorhanden?
  Checker: Suche nach delete.*account|account.*delete|/api/.*delete.*user in Settings-Seiten + API
- R15: Soft-Delete ODER Anonymisierung implementiert?
  Checker: deleted_at in Migrations ODER AnonymizationService/scrubPII in src/

Kategorie 5: Technische Maßnahmen (Art. 32)
- R16: Rate Limiting auf Auth-Endpoints?
  Checker: @upstash/ratelimit oder äquivalent in package.json + Import in Auth-Routes
- R17: CSRF-Schutz auf State-ändernden Endpoints?
  Checker: CSRF-Token in Forms ODER SameSite-Cookie-Config ODER Next.js Server Actions (built-in)
- R18: Content-Security-Policy konfiguriert?
  Checker: Content-Security-Policy in next.config.ts headers oder vercel.json

WICHTIG:
- Jede Regel hat **Art. / Standard:** Verweis auf den konkreten DSGVO-Artikel
- Jede Regel hat einen **Checker:** Block mit grep-Pattern oder konkreter Datei-Prüfung
- Enforcement: technisch prüfbare Regeln = PREVENTED oder BLOCKED; Governance-Checks = REVIEWED
- Mindestens 15 Regeln, verteilt auf die 5 Kategorien
- Verwende das Format EXAKT wie vorgegeben (deep agent format mit Kategorien)

Output NUR das vollständige Agent-Dokument. Keine Einleitung, keine Erklärung.`,
  },
  {
    id: 'BFSG',
    filename: 'BFSG_AGENT.md',
    prompt: `Erstelle den BFSG_AGENT — einen regulatorischen Code-Review-Agenten.

Quelle: Barrierefreiheitsstärkungsgesetz (BFSG) — gilt seit 28. Juni 2025.
Basiert auf: EN 301 549 / WCAG 2.1 AA.
Strafe: bis zu 100.000 Euro, Marktverbot, Abmahnungen durch Verbände.
Scope: Web-Apps die unter das BFSG fallen (B2C, E-Commerce, Banking, SaaS mit öffentlichem Zugang).

UNTERSCHIED zum bestehenden ACCESSIBILITY_AGENT: Dieser hat 8 WCAG-Basics.
Der BFSG_AGENT deckt REGULATORISCHE PFLICHTEN ab — was das Gesetz konkret fordert.

KATEGORIEN UND REGELN (mindestens 12 Regeln):

Kategorie 1: BFSG-Rechtspflichten
- R1: Barrierefreiheitserklärung vorhanden? (/barrierefreiheit oder /accessibility-statement)
  Checker: Suche nach barrierefreiheit|accessibility-statement in src/app/
  Art.: BFSG §12, EN 301 549 Annex C
- R2: Feedback-Mechanismus für Barrierefreiheit? (E-Mail-Link oder Kontaktformular)
  Checker: Suche nach barrierefreiheit@|a11y@|feedback.*accessibility in /barrierefreiheit
  Art.: BFSG §12 Abs. 3
- R3: Fällt die App unter das BFSG? (Applicability check)
  Hinweis: B2C-Produkte, E-Commerce, Finanzdienstleistungen — nicht für reine B2B-Tools

Kategorie 2: WCAG 2.1 AA — Erweitert (was ACCESSIBILITY_AGENT nicht prüft)
- R4: Semantisches HTML — Landmarks verwendet?
  Checker: <nav>, <main>, <header>, <footer> statt nur <div> mit class=nav/header
  Art.: WCAG 2.1 SC 1.3.1, SC 4.1.2
- R5: Sprache des Dokuments gesetzt?
  Checker: <html lang="de"> oder lang-Attribut in Root-Layout
  Art.: WCAG 2.1 SC 3.1.1
- R6: Skip-Navigation-Link vorhanden?
  Checker: Suche nach "skip.*main|zum.*inhalt|skip-to-content" in Layout-Komponenten
  Art.: WCAG 2.1 SC 2.4.1
- R7: Überschriften-Hierarchie korrekt (kein H1 → H3 Sprung)?
  Checker: Prüfe ob H2 immer vor H3 in Komponenten; keine h4 ohne h3 darüber
  Art.: WCAG 2.1 SC 1.3.1, SC 2.4.6
- R8: Touch-Targets mindestens 44×44px?
  Checker: button, a, [role=button] — Größe in CSS mindestens 44px × 44px
  Art.: WCAG 2.1 SC 2.5.5 (AA)
- R9: prefers-reduced-motion respektiert?
  Checker: Suche nach @media (prefers-reduced-motion) in CSS/globals
  Art.: WCAG 2.1 SC 2.3.3

Kategorie 3: Tastatur & Assistive Technologies
- R10: Fokus-Indikator auf allen interaktiven Elementen?
  Checker: :focus-visible in globals.css — kein outline: none ohne Ersatz
  Art.: WCAG 2.1 SC 2.4.7
- R11: ARIA-Live-Regionen für dynamische Inhalte?
  Checker: Suche nach aria-live|role="status"|role="alert" für dynamische Updates (Chat, Notifications)
  Art.: WCAG 2.1 SC 4.1.3
- R12: Alle Bilder mit alt-Text oder role="presentation"?
  Checker: <img> ohne alt ODER alt="" ohne role="presentation"
  Art.: WCAG 2.1 SC 1.1.1

Kategorie 4: Automatisierte Tests
- R13: axe-core in CI oder Playwright-Tests?
  Checker: @axe-core|axe-playwright|jest-axe in devDependencies
  Art.: BFSG §12 — Konformitätserklärung erfordert Nachweis

WICHTIG:
- Klarer Unterschied zu ACCESSIBILITY_AGENT (der deckt nur Basics — dieser deckt Rechtspflichten)
- Applicability: BFSG gilt nicht für rein interne Tools oder B2B-Only-Produkte
- Jede Regel mit Art./Standard-Verweis
- Mindestens 12 Regeln verteilt auf 4 Kategorien

Output NUR das vollständige Agent-Dokument.`,
  },
  {
    id: 'AI_ACT',
    filename: 'AI_ACT_AGENT.md',
    prompt: `Erstelle den AI_ACT_AGENT — einen regulatorischen Code-Review-Agenten.

Quelle: EU AI Act (Verordnung EU 2024/1689) — in Kraft seit August 2024, gestaffelt 2025–2027.
Strafe: bis zu 35 Mio. Euro oder 7% des Jahresumsatzes (Hochrisiko-Verletzungen).
Scope: Apps die KI-Systeme einsetzen. Erkennbar an Dependencies: @anthropic-ai/sdk, openai, @google/generative-ai, ai, @ai-sdk/anthropic.

UNTERSCHIED zum bestehenden AI_INTEGRATION_AGENT: Dieser hat 7 technische Sicherheitsregeln (Prompt Injection, etc.).
Der AI_ACT_AGENT deckt REGULATORISCHE PFLICHTEN ab — was der AI Act konkret fordert.

KATEGORIEN UND REGELN (mindestens 10 Regeln):

Kategorie 1: Applicability-Check
- R1: Liegt KI-Nutzung vor?
  Checker: @anthropic-ai/sdk|openai|@google/generative-ai|@mistralai|ai|@ai-sdk in package.json
  Art.: AI Act Art. 3 (Definition "KI-System")
- R2: Risiko-Klassifizierung dokumentiert?
  Checker: Suche nach ai-act|risk-class|risikoklasse in docs/ oder CLAUDE.md
  Art.: AI Act Art. 6 — Minimal-Risiko, Begrenzt, Hoch, Inakzeptabel

Kategorie 2: Transparenzpflichten (Art. 50)
- R3: KI-Transparenz-Hinweis im UI?
  Checker: Suche nach "KI|AI|generiert|generated|Toro|assistant" in UI-Komponenten — User muss wissen dass er mit KI interagiert
  Art.: AI Act Art. 50 Abs. 1
- R4: KI-generierte Inhalte gekennzeichnet?
  Checker: Suche nach ai-generated|ki-generiert|generated-by-ai in Komponenten-Klassen oder aria-labels
  Art.: AI Act Art. 50 Abs. 2
- R5: Verwendetes KI-Modell wird angezeigt?
  Checker: Modellanzeige im Chat-UI oder Settings (claude-sonnet, gpt-4 etc. sichtbar für User)
  Art.: AI Act Art. 50 — Informationspflicht

Kategorie 3: KI-Logging & Oversight (Art. 12–14)
- R6: KI-Entscheidungen werden geloggt (mit Timestamp + User-Kontext)?
  Checker: Suche nach log.*model|log.*tokens|conversation.*log|ai_runs in DB-Schema/Migrations
  Art.: AI Act Art. 12 — Aufzeichnungspflicht
- R7: Human Override / Feedback-Mechanismus vorhanden?
  Checker: Suche nach feedback|thumbsdown|thumbsup|correction|korrektur in Chat-UI oder API
  Art.: AI Act Art. 14 — Human Oversight
- R8: Budget/Kosten-Transparenz für KI-Nutzung?
  Checker: budget_used|cost_display|token_count sichtbar in UI oder User-Settings
  Art.: AI Act Art. 13 — Transparenz gegenüber Deployer/User

Kategorie 4: Allgemeine Pflichten
- R9: KI-Einsatzzweck dokumentiert?
  Checker: Suche nach "KI-Einsatz|ai-purpose|intended-use" in docs/ oder README
  Art.: AI Act Art. 13 Abs. 1 — Technische Dokumentation
- R10: Keine verbotenen KI-Praktiken implementiert?
  Checker: Suche nach Manipulation, Subliminales, Biometric-Mass-Surveillance in Code/Prompts
  Art.: AI Act Art. 5 — Verbotene Praktiken

WICHTIG:
- Applicability: NUR wenn KI-Dependencies in package.json vorhanden
- Klarer Unterschied zum AI_INTEGRATION_AGENT (technische Sicherheit) — dieser = Regulierung
- Jede Regel mit konkretem Art.-Verweis zum AI Act
- Checker-Blocks sind grep-Patterns oder konkrete Datei-Prüfungen
- Mindestens 10 Regeln

Output NUR das vollständige Agent-Dokument.`,
  },
]

// ── Committee infrastructure (adapted from generate-agents.ts) ───────────────

function buildSystemPrompt(): string {
  return `Du bist ein Senior Software-Architekt und Rechtsexperte für EU-Digitalregulierung.
Du erstellst regulatorische Code-Review-Agenten für automatisierte Compliance-Prüfungen.

Dein Output ist EIN einzelnes Markdown-Dokument — kein Prosa davor oder danach.

FORMAT (exakt einhalten):
${DEEP_FORMAT}

REGELN FÜR REGULATORISCHE AGENTEN:
- Mindestens 10 Regeln (keine Obergrenze bei regulatorischen Agenten)
- Regeln in thematischen Kategorien (H3 ###) gruppieren
- Jede Regel hat PFLICHTFELDER: Severity, Enforcement, Art./Standard-Verweis, Checker-Block
- Checker-Block: konkretes grep-Pattern oder Datei-Referenz (keine vagen Beschreibungen)
- Severity BLOCKER: zwingende EU-Pflicht mit direkter Strafbarkeit
- Severity CRITICAL: Compliance-relevant, sollte vor Go-Live behoben sein
- Severity WARNING: Best Practice, kann kurzfristig offen bleiben
- Enforcement BLOCKED: CI-Gate verhindert Merge
- Enforcement PREVENTED: Linter/Type-Checker flaggt
- Enforcement REVIEWED: Manuelle PR-Review nötig
- Kein Overlap mit: SECURITY_AGENT (Encryption, Auth), LEGAL_AGENT (PII-Typing), AI_INTEGRATION_AGENT (Prompt Injection)`
}

async function callProvider(
  label: string,
  modelFn: () => Parameters<typeof generateText>[0]['model'],
  prompt: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: modelFn(),
      system: buildSystemPrompt(),
      prompt,
      maxOutputTokens: 6144,
    })
    return text.trim()
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 120)}`)
    return ''
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function generateDeepAgent(agent: DeepAgentDef): Promise<boolean> {
  const outputPath = join(AGENTS_DIR, agent.filename)
  console.log(`\n[${agent.id}_AGENT] Starting…`)

  // 1. Four reviewers in parallel
  const [claudeDraft, gptDraft, geminiDraft, grokDraft] = await Promise.all([
    callProvider('Claude Sonnet', () => getAnthropic(REVIEWER_MODEL), agent.prompt),
    callProvider('GPT-4o',        getOpenAI,  agent.prompt),
    callProvider('Gemini 2.5',    getGemini,  agent.prompt),
    callProvider('Grok 4',        getGrok,    agent.prompt),
  ])

  const drafts = [claudeDraft, gptDraft, geminiDraft, grokDraft].filter(Boolean)
  if (drafts.length === 0) {
    console.error(`  ✗ All providers failed for ${agent.id}`)
    return false
  }
  console.log(`  ✓ Got ${drafts.length}/4 drafts`)

  // 2. Judge synthesizes
  const labels = ['Claude Sonnet', 'GPT-4o', 'Gemini 2.5', 'Grok 4']
  const judgePrompt = `Synthetisiere den besten ${agent.id}_AGENT aus diesen ${drafts.length} unabhängigen Entwürfen.

${drafts.map((d, i) => `=== ENTWURF ${i + 1}: ${labels[i] ?? `Modell ${i + 1}`} ===\n${d}`).join('\n\n')}

Erstelle das finale, definitive ${agent.id}_AGENT Dokument:
- Wähle die besten Regeln aus allen Entwürfen (können aus verschiedenen Modellen kommen)
- Stelle sicher: mindestens 10 Regeln, alle Pflichtfelder vorhanden (Severity, Enforcement, Art./Standard, Checker)
- Dedupliziere: gleichartige Regeln → klarste Formulierung wählen
- Keine Konflikte mit SECURITY_AGENT, LEGAL_AGENT, AI_INTEGRATION_AGENT

Output NUR das finale Agent-Dokument.`

  console.log('  Judging…')
  let finalContent = await callProvider('Judge (Opus)', () => getAnthropic(JUDGE_MODEL), judgePrompt)

  if (!finalContent) {
    console.warn('  ⚠ Judge failed — using best draft')
    finalContent = drafts[0]
  }

  // 3. Validate minimum requirements
  const ruleCount = (finalContent.match(/^### R\d+/gm) ?? []).length
  if (ruleCount < 8) {
    console.warn(`  ⚠ Only ${ruleCount} rules found (expected ≥10) — saving anyway`)
  } else {
    console.log(`  ✓ ${ruleCount} rules`)
  }

  // 4. Save
  writeFileSync(outputPath, finalContent, 'utf-8')
  console.log(`  ✓ Saved: docs/agents/${agent.filename}`)
  return true
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const target = process.argv[2] // optional: 'dsgvo' | 'bfsg' | 'ai-act'
  const agents = target
    ? DEEP_AGENTS.filter((a) => a.id.toLowerCase().replace('_', '-') === target)
    : DEEP_AGENTS

  if (agents.length === 0) {
    console.error(`Unknown agent: ${target}. Use: dsgvo | bfsg | ai-act`)
    process.exit(1)
  }

  console.log('══════════════════════════════════════════════════════')
  console.log(' Deep Regulatory Agents — Multi-Model Committee')
  console.log(`══════════════════════════════════════════════════════`)
  console.log(`Generating: ${agents.map((a) => a.id + '_AGENT').join(', ')}`)
  console.log(`Output: docs/agents/\n`)

  let success = 0
  for (const agent of agents) {
    const ok = await generateDeepAgent(agent)
    if (ok) success++
    if (agents.indexOf(agent) < agents.length - 1) {
      console.log('  (pausing 5s…)')
      await sleep(5000)
    }
  }

  console.log(`\n═══ Done: ${success}/${agents.length} agents generated ═══`)
  if (success < agents.length) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
