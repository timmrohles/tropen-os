export type FieldDef =
  | { id: string; label: string; type: 'text' | 'textarea'; placeholder?: string; optional?: boolean }
  | { id: string; label: string; type: 'select'; options: string[]; placeholder?: string; optional?: boolean }

export interface Template {
  id: 'chat' | 'research' | 'create' | 'summarize' | 'extract'
  label: string
  fields: FieldDef[]
  assemble: (values: Record<string, string>) => string
}

export const TEMPLATES: Template[] = [
  // ── 1. Ich habe eine Frage ───────────────────────────────────
  {
    id: 'chat',
    label: 'Ich habe eine Frage',
    fields: [
      {
        id: 'frage',
        label: 'Was möchtest du wissen?',
        type: 'text',
        placeholder: 'Deine Frage…',
      },
      {
        id: 'tiefe',
        label: 'Wie tief soll die Antwort gehen?',
        type: 'select',
        options: ['Kurz & knapp', 'Ausführlich mit Erklärung', 'Mit konkreten Beispielen'],
      },
    ],
    assemble: (v) => {
      const tiefeMap: Record<string, string> = {
        'Kurz & knapp': 'kurz und präzise',
        'Ausführlich mit Erklärung': 'ausführlich mit Erklärungen',
        'Mit konkreten Beispielen': 'mit konkreten Beispielen',
      }
      const tiefe = tiefeMap[v.tiefe] ?? 'kurz und präzise'
      return `Beantworte folgende Frage ${tiefe}: ${v.frage}`
    },
  },

  // ── 2. Erkläre mir ein Thema ─────────────────────────────────
  {
    id: 'research',
    label: 'Erkläre mir ein Thema',
    fields: [
      {
        id: 'thema',
        label: 'Was soll erklärt werden?',
        type: 'text',
        placeholder: 'Thema oder Begriff…',
      },
      {
        id: 'vorwissen',
        label: 'Was weißt du bereits darüber?',
        type: 'select',
        options: ['Nichts', 'Grundlagen', 'Fortgeschritten'],
      },
      {
        id: 'zweck',
        label: 'Wozu brauchst du es?',
        type: 'select',
        options: ['Zum Lernen', 'Für eine Präsentation', 'Für eine Entscheidung'],
      },
    ],
    assemble: (v) =>
      `Erkläre mir ${v.thema}. Mein Vorwissensstand: ${v.vorwissen}. Ich brauche es für: ${v.zweck}.`,
  },

  // ── 3. Schreib mir etwas ─────────────────────────────────────
  {
    id: 'create',
    label: 'Schreib mir etwas',
    fields: [
      {
        id: 'was',
        label: 'Was soll geschrieben werden?',
        type: 'text',
        placeholder: 'z.B. eine E-Mail, ein Konzept, einen Post…',
      },
      {
        id: 'fuer_wen',
        label: 'Für wen? (Zielgruppe)',
        type: 'text',
        placeholder: 'z.B. Kunden, Kollegen, Management…',
      },
      {
        id: 'ton',
        label: 'Ton',
        type: 'select',
        options: ['Formell', 'Locker', 'Überzeugend', 'Sachlich'],
      },
      {
        id: 'laenge',
        label: 'Länge',
        type: 'select',
        options: ['Kurz', 'Mittel', 'Lang'],
        optional: true,
      },
    ],
    assemble: (v) =>
      `Schreibe ${v.was} für ${v.fuer_wen} in einem ${v.ton.toLowerCase()}en Ton.${v.laenge ? ` Länge: ${v.laenge}.` : ''}`,
  },

  // ── 4. Fasse zusammen ────────────────────────────────────────
  {
    id: 'summarize',
    label: 'Fasse zusammen',
    fields: [
      {
        id: 'text',
        label: 'Füge hier den Text ein, den Toro zusammenfassen soll',
        type: 'textarea',
        placeholder: 'Text hier einfügen…',
      },
      {
        id: 'fokus',
        label: 'Was ist das Wichtigste?',
        type: 'select',
        options: ['Kernaussagen', 'Handlungsempfehlungen', 'Zahlen & Fakten'],
      },
      {
        id: 'fuer_wen',
        label: 'Für wen ist die Zusammenfassung?',
        type: 'text',
        placeholder: 'z.B. Management, Team, Kunde…',
        optional: true,
      },
    ],
    assemble: (v) =>
      `Fasse folgenden Text zusammen. Fokus auf: ${v.fokus}.${v.fuer_wen ? ` Für: ${v.fuer_wen}.` : ''}\n\n${v.text}`,
  },

  // ── 5. Hilf mir beim Denken ──────────────────────────────────
  {
    id: 'extract',
    label: 'Hilf mir beim Denken',
    fields: [
      {
        id: 'thema',
        label: 'Worum geht es?',
        type: 'text',
        placeholder: 'Beschreibe die Situation oder das Thema…',
      },
      {
        id: 'ziel',
        label: 'Was ist das Ziel?',
        type: 'select',
        options: [
          'Entscheidung treffen',
          'Ideen sammeln',
          'Problem lösen',
          'Vor- und Nachteile abwägen',
        ],
      },
      {
        id: 'hindernis',
        label: 'Was hält dich zurück?',
        type: 'text',
        placeholder: 'Optional…',
        optional: true,
      },
    ],
    assemble: (v) =>
      `Hilf mir beim ${v.ziel} zu folgendem Thema: ${v.thema}.${v.hindernis ? ` Was mich dabei zurückhält: ${v.hindernis}.` : ''} Denke strukturiert mit und stelle mir die richtigen Gegenfragen.`,
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
