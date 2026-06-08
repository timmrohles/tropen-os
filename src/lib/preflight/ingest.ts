// src/lib/preflight/ingest.ts
// Niedrige Schwelle: nur echt-leerer/Müll-Input wird abgelehnt. Kurzer aber echter
// Input ("Baue mir ein LMS") wird analysiert + als dünn geflaggt → On-Ramp zur
// geführten Tour (ADR-030: "zu kurz" ist kein Dead-End mehr, sondern fällt in "dünn").
const MIN_CHARS = 5

export function normalizeInput(raw: string): string {
  const text = raw.trim()
  if (text.length < MIN_CHARS) {
    throw new Error('Input zu kurz — gib mehr Detail (mind. ein paar Sätze oder ein Schema).')
  }
  return text
}
