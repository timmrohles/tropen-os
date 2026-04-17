import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'agent-stack-review',
  contextFiles: [
    'docs/audit-reports/committee-agents-2026-04-17.md',
    'docs/audit-reports/benchmark-2026-04-15-v7-analysis.md',
    'docs/audit-reports/committee-results-2026-04-15.md',
  ],
  contextTransforms: {
    'docs/audit-reports/benchmark-2026-04-15-v7-analysis.md': (content) =>
      content.split('\n').slice(0, 80).join('\n') + '\n... (gekürzt)',
  },
  systemPrompt: `Du bist ein Senior Software Engineer + Product Analyst der Production-Readiness-Scanning-Systeme bewertet.
Das System (Tropen OS / Prodify) scannt statisch GitHub-Repos von Vibe-Coderns (Lovable, Bolt, Cursor).
Kein LLM-Call pro Regel — alles regelbasiert + deterministisch.
Vibe-Coder = Entwickler ohne tiefes Ingenieurwissen die mit AI-Tools (Lovable, Bolt, Cursor) Apps bauen.
Ihr Hauptproblem: 68 Findings als Liste ist überwältigend — sie wollen "Fix this first" mit Copy-Paste-Commands.

Sei konkret, nicht abstrakt. Zeige echte Beispiele. Bevorzuge Antworten die direkt umsetzbar sind.`,

  userPrompt: `Beantworte alle 8 Fragen für den kompletten Agenten-Stack.
Das Dokument mit allen 31 Agenten und den 8 Fragen findest du oben im Kontext.

WICHTIG: Beantworte ALLE 8 Fragen (F1–F8). Halte jede Antwort unter 150 Wörtern.

F1 — VIBE-CODER-RELEVANZ
Kategorisiere jeden der 26 bestehenden Agenten: Ja / Nur EU / Nur AI-Repos / Nein (zu nischig für Vibe-Coder-MVP).
Format: "AGENT: Ja/Nur EU/Nur AI/Nein — 1 Satz Begründung"

F2 — ABDECKUNG (Top 3 Lücken)
Welche 3 Kategorien sind am schlechtesten abgedeckt und warum? Jeweils 1–2 Sätze.

F3 — MISSING CHECK (Top 3)
Nenne 3 wichtige Checks die KEIN der 31 Agenten macht. Konkret: was würde gecheckt werden?

F4 — PRIORITÄT (Änderungsvorschläge)
Welche 3 Agenten sollten ein höheres Gewicht bekommen? Welche 2 ein niedrigeres?
Format: "AGENT: von ×N auf ×N — Begründung"

F5 — TOP 3 FÜR ERSTEN EINDRUCK
Welche 3 Agenten erzeugen den besten Aha-Moment bei einem neuen Vibe-Coder-User?
Erklär warum (Treffer-Rate + Relevanz + Verständlichkeit des Findings).

F6 — TOP 3 FP-RISIKEN
Welche 3 Agenten erzeugen wahrscheinlich die meisten False Positives?
Beschreibe das konkrete FP-Szenario für jeden.

F7 — BESTER NEUER AGENT (ROI)
Bewerte alle 5 neuen Agenten (SLOP_DETECTION, CRA, SPEC, EVAL, MCP_SECURITY).
Ranking 1–5 mit Begründung. Welcher hat den höchsten ROI für Vibe-Coder?

F8 — GRÖSSTER BLINDER FLECK
Was deckt der gesamte Stack (31 Agenten) NICHT ab?
Nenne den einen blinden Fleck der für Vibe-Coder am schmerzhaftesten ist.`,

  judgePrompt: `Destilliere die 4 unabhängigen Bewertungen des Agenten-Stacks.

Für jede der 8 Fragen:
- Konsens-Level: EINIG | MEHRHEIT | GESPALTEN
- Konsens-Antwort (konkret, nicht paraphrasiert)
- Abweichende Meinungen (wenn GESPALTEN)

Dann:
## Entscheidungen
Formuliere klare Entscheidungen:
1. Reihenfolge der 5 neuen Agenten (welcher zuerst implementieren?)
2. Gewichts-Änderungen (welche Agenten bekommen höhere/niedrigere Priorität?)
3. Top 3 Agenten für Quick-Win-UX (erster Eindruck)
4. Top 3 FP-Risiken (welche Regeln brauchen sofort eine Verbesserung?)
5. Größter blinder Fleck (konkrete Handlungsempfehlung)

## Kosten
[wird automatisch berechnet]`,
}
