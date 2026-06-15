export const CONCEPT_FIELDS = ['wasFuerWen', 'kernFunktionen', 'nutzerDaten', 'verkauf'] as const
export type ConceptField = (typeof CONCEPT_FIELDS)[number]

export interface ConceptChatTurn { role: 'user' | 'assistant'; content: string } // erst 2b-2 genutzt

export interface PreflightConcept {
  mode: 'form' | 'dialog'
  wasFuerWen: string
  kernFunktionen: string
  nutzerDaten: string
  verkauf: string
  transcript?: ConceptChatTurn[]
}
