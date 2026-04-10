import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'claude-md',
  contextFiles: [
    'CLAUDE.md',
    'ARCHITECT.md',
    'docs/webapp-manifest/engineering-standard.md',
  ],
  contextTransforms: {
    'docs/webapp-manifest/engineering-standard.md': (content) =>
      content.split('\n').slice(0, 200).join('\n') + '\n... (gekürzt)',
  },
  systemPrompt: `Du bist ein Senior Engineering Manager der Projektdokumentation für KI-gestütztes Entwickeln bewertet.
CLAUDE.md ist die zentrale Steuerungsdatei die bestimmt wie ein KI-Coding-Agent (Claude Code) das Projekt baut.
Bewerte Vollständigkeit, Konsistenz und Praxistauglichkeit.
Sei konkret — zeige exakt was fehlt, was widersprüchlich ist, und was überflüssig ist.`,

  userPrompt: `BEWERTE DIESE 5 ASPEKTE:

1. VOLLSTÄNDIGKEIT
   Fehlen wichtige Konventionen die Claude Code immer wieder falsch macht?
   (Denke an: Error-Handling-Patterns, API-Response-Format, Import-Reihenfolge, Test-Patterns)

2. WIDERSPRÜCHE
   Widerspricht CLAUDE.md sich selbst? Oder widerspricht CLAUDE.md dem ARCHITECT.md oder dem Engineering-Standard?
   Zeige exakte Zitate wenn Widersprüche existieren.

3. VERALTERUNG
   Welche Abschnitte sind wahrscheinlich veraltet?
   (Hinweis: Das Projekt hat sich von einem "KI-Betriebssystem für KMU" zu einer "Code Quality Platform" pivotiert.
   Viele alte Features sind eingefroren.)

4. REDUNDANZ
   Welche Informationen stehen doppelt in CLAUDE.md und ARCHITECT.md?
   Wo sollte konsolidiert werden?

5. FEHLENDE MUSTER
   Welche Code-Patterns sollten dokumentiert sein die es nicht sind?
   (z.B. "Wie erstelle ich eine neue API-Route", "Wie füge ich einen neuen Audit-Checker hinzu",
   "Wie erstelle ich einen neuen Agenten")`,

  judgePrompt: `Destilliere die 4 Bewertungen von CLAUDE.md.
Für jeden der 5 Aspekte:
- Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
- Top-3 konkrete Findings (mit Zitaten wo möglich)
- Empfohlene Änderungen mit Priorität (sofort / bald / später)

Abschluss: Eine priorisierte Liste der 5 wichtigsten Änderungen an CLAUDE.md.`,
}
