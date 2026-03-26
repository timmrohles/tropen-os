import type { GuidedStep, GuidedOption } from '@/lib/workspace-types'

// ─────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────

export type ComplexityCategory = 'marketing' | 'strategy' | 'content' | 'process' | 'presentation'

export interface ComplexityResult {
  isComplex: boolean
  category: ComplexityCategory | null
  suggestedSteps: GuidedStep[]
}

// ─────────────────────────────────────────────────────────
// Step definitions per category
// ─────────────────────────────────────────────────────────

const CUSTOM_OPTION: GuidedOption = { label: 'Eigene Antwort...', value: 'custom', isCustom: true }

const MARKETING_STEPS: GuidedStep[] = [
  {
    id: 'goal',
    phase: 'scout',
    question: 'Was soll die Kampagne erreichen?',
    options: [
      { label: 'Mehr Leads generieren', value: 'lead_generation' },
      { label: 'Markenbekanntheit steigern', value: 'brand_awareness' },
      { label: 'Produktlaunch begleiten', value: 'product_launch' },
      { label: 'Bestandskunden aktivieren', value: 'retention' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'audience',
    phase: 'scout',
    question: 'Wen wollt ihr ansprechen?',
    options: [
      { label: 'Bestandskunden', value: 'existing' },
      { label: 'Neue Zielgruppe', value: 'new' },
      { label: 'Beide', value: 'both' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'budget',
    phase: 'planner',
    question: 'Welches Budget steht zur Verfügung?',
    options: [
      { label: 'Unter 1.000€', value: 'under_1k' },
      { label: '1.000 – 5.000€', value: '1k_5k' },
      { label: 'Über 5.000€', value: 'over_5k' },
      { label: 'Noch nicht definiert', value: 'undefined' },
    ],
  },
]

const STRATEGY_STEPS: GuidedStep[] = [
  {
    id: 'horizon',
    phase: 'scout',
    question: 'Für welchen Zeithorizont?',
    options: [
      { label: 'Kurzfristig (bis 3 Monate)', value: 'short' },
      { label: 'Mittelfristig (3–12 Monate)', value: 'mid' },
      { label: 'Langfristig (1+ Jahr)', value: 'long' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'focus',
    phase: 'scout',
    question: 'Was steht im Mittelpunkt?',
    options: [
      { label: 'Wachstum / Umsatz', value: 'growth' },
      { label: 'Effizienz / Kosten', value: 'efficiency' },
      { label: 'Produkt / Innovation', value: 'product' },
      { label: 'Team / Organisation', value: 'team' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'constraints',
    phase: 'planner',
    question: 'Welche Rahmenbedingungen gibt es?',
    options: [
      { label: 'Budget-limitiert', value: 'budget_limited' },
      { label: 'Team-limitiert', value: 'team_limited' },
      { label: 'Zeitdruck', value: 'time_pressure' },
      { label: 'Keine besonderen Einschränkungen', value: 'none' },
      CUSTOM_OPTION,
    ],
  },
]

const CONTENT_STEPS: GuidedStep[] = [
  {
    id: 'format',
    phase: 'scout',
    question: 'Welches Format soll erstellt werden?',
    options: [
      { label: 'Social-Media-Posts', value: 'social' },
      { label: 'Blog-Artikel', value: 'blog' },
      { label: 'Newsletter', value: 'newsletter' },
      { label: 'Gemischter Mix', value: 'mixed' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'period',
    phase: 'planner',
    question: 'Für welchen Zeitraum soll der Plan gelten?',
    options: [
      { label: '1 Woche', value: '1w' },
      { label: '1 Monat', value: '1m' },
      { label: 'Quartal', value: '3m' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'tone',
    phase: 'planner',
    question: 'Welcher Ton soll die Inhalte prägen?',
    options: [
      { label: 'Professionell & seriös', value: 'professional' },
      { label: 'Locker & nahbar', value: 'casual' },
      { label: 'Inspirierend & motivierend', value: 'inspiring' },
      { label: 'Informativ & sachlich', value: 'informative' },
    ],
  },
]

const PROCESS_STEPS: GuidedStep[] = [
  {
    id: 'scope',
    phase: 'scout',
    question: 'Was soll der Prozess regeln?',
    options: [
      { label: 'Onboarding / Einarbeitung', value: 'onboarding' },
      { label: 'Kunden-Kommunikation', value: 'customer_comm' },
      { label: 'Interne Abläufe', value: 'internal' },
      { label: 'Qualitätskontrolle', value: 'qa' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'team_size',
    phase: 'planner',
    question: 'Wie viele Personen sind beteiligt?',
    options: [
      { label: 'Nur ich', value: 'solo' },
      { label: 'Kleines Team (2–5)', value: 'small' },
      { label: 'Größeres Team (6+)', value: 'large' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'output_format',
    phase: 'executor',
    question: 'In welchem Format soll das Ergebnis sein?',
    options: [
      { label: 'Checkliste', value: 'checklist' },
      { label: 'Schritt-für-Schritt-Anleitung', value: 'guide' },
      { label: 'Flussdiagramm (Beschreibung)', value: 'flowchart' },
      { label: 'Tabelle', value: 'table' },
    ],
  },
]

const PRESENTATION_STEPS: GuidedStep[] = [
  {
    id: 'audience',
    phase: 'scout',
    question: 'Wer ist das Zielpublikum?',
    options: [
      { label: 'Kunden / Interessenten', value: 'customers' },
      { label: 'Investoren', value: 'investors' },
      { label: 'Internes Team', value: 'internal' },
      { label: 'Management / Führung', value: 'management' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'goal',
    phase: 'scout',
    question: 'Was soll die Präsentation erreichen?',
    options: [
      { label: 'Überzeugen / Verkaufen', value: 'persuade' },
      { label: 'Informieren / Berichten', value: 'inform' },
      { label: 'Idee präsentieren', value: 'pitch' },
      { label: 'Ergebnisse zeigen', value: 'results' },
      CUSTOM_OPTION,
    ],
  },
  {
    id: 'length',
    phase: 'planner',
    question: 'Wie lang soll die Präsentation sein?',
    options: [
      { label: '5–7 Slides (kompakt)', value: 'short' },
      { label: '10–15 Slides (mittel)', value: 'medium' },
      { label: '20+ Slides (ausführlich)', value: 'long' },
    ],
  },
]

// ─────────────────────────────────────────────────────────
// Pattern matching
// ─────────────────────────────────────────────────────────

const PATTERNS: Array<{ category: ComplexityCategory; re: RegExp }> = [
  { category: 'marketing',     re: /kampagne|werbung|marketing.?plan|social.?media.?strateg/i },
  { category: 'strategy',      re: /strategi|businessplan|unternehmens.?konzept|roadmap|jahres.?plan/i },
  { category: 'content',       re: /content.?plan|redaktions.?plan|themen.?plan|content.?kalender/i },
  { category: 'process',       re: /prozess|workflow|ablauf|standard.?operating|sop|checkliste.?erstell/i },
  { category: 'presentation',  re: /pr[äa]sentation|pitch.?deck|folie|slide|vortrag|keynote/i },
  // Broader planning patterns (fallback to marketing if no specific match)
  { category: 'strategy',      re: /plan(en|ung)|konzept|aufbau|aufsetzen|einf[üu]hr|entwickl.*strateg/i },
]

// ─────────────────────────────────────────────────────────
// Main function
// ─────────────────────────────────────────────────────────

const STEPS_MAP: Record<ComplexityCategory, GuidedStep[]> = {
  marketing: MARKETING_STEPS,
  strategy: STRATEGY_STEPS,
  content: CONTENT_STEPS,
  process: PROCESS_STEPS,
  presentation: PRESENTATION_STEPS,
}

export function detectComplexity(
  message: string,
  hasProjectContext: boolean,
  hasEnoughDetail: boolean,
): ComplexityResult {
  // Skip if user already gave enough context
  if (hasProjectContext || hasEnoughDetail) {
    return { isComplex: false, category: null, suggestedSteps: [] }
  }

  for (const { category, re } of PATTERNS) {
    if (re.test(message)) {
      return {
        isComplex: true,
        category,
        suggestedSteps: STEPS_MAP[category],
      }
    }
  }

  return { isComplex: false, category: null, suggestedSteps: [] }
}
