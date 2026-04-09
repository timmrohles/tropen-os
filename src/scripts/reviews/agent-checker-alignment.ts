import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'agent-checker-alignment',
  contextFiles: [
    'src/lib/agents/agent-catalog.ts',
    'src/lib/audit/rule-registry.ts',
    'src/lib/audit/checkers/agent-committee-checker.ts',
    'docs/agents/SECURITY_AGENT_FINAL.md',
    'docs/agents/TESTING_AGENT.md',
    'docs/agents/API_AGENT.md',
  ],
  contextTransforms: {
    'src/lib/audit/rule-registry.ts': (content) =>
      content.split('\n').slice(0, 500).join('\n') + '\n... (gekürzt)',
    'src/lib/audit/checkers/agent-committee-checker.ts': (content) =>
      content.split('\n').slice(0, 400).join('\n') + '\n... (gekürzt)',
  },
  systemPrompt: `Du bist ein Quality Assurance Engineer der prüft ob automatisierte Checker
korrekt implementieren was Agent-Regelwerke definieren.

Es gibt 21 Agenten (Markdown-Regelwerke) und einen Audit-Engine mit automatisierten Checkern.
Die Frage ist: Prüfen die Checker wirklich was die Agenten sagen?
Gibt es Lücken, False Positives, oder Fehlinterpretationen?

Bekanntes Problem: "API versioning required" feuert für interne Next.js App-Router Routes
die keine externe API sind — das ist ein False Positive.`,

  userPrompt: `BEWERTE DIESE 4 ASPEKTE:

1. COVERAGE-LÜCKEN
   Welche Agent-Regeln haben KEINEN automatisierten Checker?
   Für jede Lücke: ist sie berechtigt (braucht LLM-Urteil) oder könnte ein automatisierter
   Check gebaut werden?
   Priorisiere: welche Lücken haben den größten Impact auf die Audit-Qualität?

2. FALSE POSITIVES
   Welche Checker produzieren wahrscheinlich False Positives?
   Das bekannte Beispiel: "API versioning required" für interne Next.js Routes.
   Welche weiteren Regeln haben das gleiche Problem: sie gelten nicht für alle Projekttypen?
   Zeige für jeden identifizierten False Positive:
   - Die Regel
   - Warum sie fälschlicherweise feuert
   - Wie der Checker angepasst werden sollte (Pseudocode)

3. CHECKER-QUALITÄT
   Prüfen die Checker wirklich was die Agenten-Regeln sagen, oder vereinfachen sie zu stark?
   Zeige 3 konkrete Beispiele wo Checker und Agent-Regel auseinanderklaffen
   (nutze die drei Agenten-Dokumente als Referenz).

4. FEHLENDE AGENTEN
   Die 25 Audit-Kategorien haben je einen oder mehrere Agenten.
   Gibt es Kategorien die schlecht abgedeckt sind?
   Welcher Agent fehlt am dringendsten?
   Schreibe einen 3-Satz Purpose für den fehlenden Agenten.`,

  judgePrompt: `Destilliere die 4 Bewertungen des Agent-Checker-Alignments.
Für jeden der 4 Aspekte:
- Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
- Top-3 konkrete Findings
- Priorität (sofort fixen / nächster Sprint / kann warten)

BESONDERS WICHTIG: Liste alle identifizierten False Positives vollständig auf —
mit dem zugehörigen Checker-Fix als Pseudocode. Diese müssen sofort gefixt werden.`,
}
