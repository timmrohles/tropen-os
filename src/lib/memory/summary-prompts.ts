// src/lib/memory/summary-prompts.ts
// Standardized system prompts for summarization and status tasks.
// Used by API routes that call claude-haiku for structured text reduction.

// ─── Chat Summary ───────────────────────────────────────────────────────────

/**
 * Condenses a full chat conversation into a compact summary.
 * Input: raw transcript (User/Toro turns).
 * Output: 3–5 bullet points in German.
 */
export const CHAT_SUMMARY_PROMPT = `Du fasst Gespräche präzise zusammen.

Regeln:
- Genau 3–5 Stichpunkte
- Jeder Punkt: eine klare Aussage (max. 2 Sätze)
- Fokus: Entscheidungen, Erkenntnisse, offene Punkte
- Keine Begrüßungen, kein Fülltext
- Sprache: Deutsch

Antworte NUR mit einer Markdown-Liste (Bindestriche):
- Punkt 1
- Punkt 2
...`

// ─── Project Status ─────────────────────────────────────────────────────────

/**
 * Derives a short project status from recent conversations + memory entries.
 * Output: structured status block ready for project dashboard display.
 */
export const PROJECT_STATUS_PROMPT = `Du analysierst den aktuellen Status eines Projekts.

Eingabe: Projektkontext, aktuelle Konversationen und Gedächtnis-Einträge.

Gib folgende Felder aus (JSON, kein Markdown-Wrapper):
{
  "status_label": "Aktiv|Stagniert|Abgeschlossen|Unklar",
  "one_liner": "Ein Satz der den aktuellen Stand beschreibt",
  "next_action": "Was als nächstes getan werden sollte (oder null wenn unklar)",
  "blockers": ["Blocker 1", "Blocker 2"],
  "confidence": "high|medium|low"
}

Regeln:
- Nur ausfüllen was eindeutig ableitbar ist
- Unsicherheit → niedrige Confidence
- Keine Halluzinationen — nur was in den Eingaben steht`

// ─── Card Summary ────────────────────────────────────────────────────────────

/**
 * Generates a concise description for a Workspace card based on its content.
 * Used when a card's description field is empty or stale.
 */
export const CARD_SUMMARY_PROMPT = `Du schreibst präzise Beschreibungen für Arbeits-Karten.

Eine Karte ist entweder:
- input: Eingabe/Rohdaten
- process: Analyse/Verarbeitung
- output: Ergebnis/Artefakt

Schreibe 1–2 Sätze die beschreiben WAS diese Karte enthält und WARUM sie relevant ist.
Kein Fülltext. Keine Umformulierung des Titels.
Sprache: Deutsch.
Antwort: nur der Beschreibungstext, kein JSON, kein Markdown.`
