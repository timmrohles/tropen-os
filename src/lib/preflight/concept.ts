import type { PreflightConcept } from './concept-types'
import type { PreflightPivots, CommercialModel } from './types'

const FIELD_LABELS: Record<string, string> = {
  wasFuerWen: 'Was & für wen',
  kernFunktionen: 'Kern-Funktionen',
  nutzerDaten: 'Nutzer & Daten',
  verkauf: 'Verkauf / Geschäftsmodell',
}

/** Setzt die gefüllten Konzept-Felder zu einem strukturierten Markdown-Text zusammen (leere ausgelassen). */
export function composeConceptText(concept: PreflightConcept): string {
  return (['wasFuerWen', 'kernFunktionen', 'nutzerDaten', 'verkauf'] as const)
    .filter((f) => concept[f]?.trim())
    .map((f) => `## ${FIELD_LABELS[f]}\n${concept[f].trim()}`)
    .join('\n\n')
}

/** Leitet commercialModel aus dem Verkauf-Feld ab (Keyword-Heuristik); übrige Pivots unverändert. */
export function derivePivotsFromConcept(concept: PreflightConcept, existing: PreflightPivots): PreflightPivots {
  const v = concept.verkauf.toLowerCase()
  let commercialModel: CommercialModel = existing.commercialModel
  if (/\b(abo|abonnement|subscription|monatlich|miete|mitglied)/.test(v)) commercialModel = 'subscription'
  else if (/\b(marktplatz|marketplace|vermittl|anbieter|plattform für)/.test(v)) commercialModel = 'marketplace'
  else if (/\b(shop|laden|verkauf|verkaufen|produkt|kauf|bezahl|store|e-?commerce)/.test(v)) commercialModel = 'shop'
  return { ...existing, commercialModel }
}
