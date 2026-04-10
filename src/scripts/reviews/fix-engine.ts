import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'fix-engine',
  contextFiles: [
    'src/lib/fix-engine/types.ts',
    'src/lib/fix-engine/context-builder.ts',
    'src/lib/fix-engine/generator.ts',
    'src/lib/fix-engine/consensus-generator.ts',
    'src/lib/fix-engine/applier.ts',
  ],
  systemPrompt: `Du bist ein Senior Developer der LLM-basierte Code-Fix-Systeme bewertet.
Das System generiert automatische Code-Fixes basierend auf Audit-Findings.
Die Hauptprobleme in der Praxis sind: generische statt projektspezifische Fixes,
halluzinierte Dateiinhalte bei neuen Dateien, und Fixes die den Projektkontext nicht berücksichtigen.
Bewerte den Code und empfehle konkrete Verbesserungen mit Pseudocode.`,

  userPrompt: `BEKANNTE PRAXIS-PROBLEME (aus echten Fix-Runs):

A) Fix für "README.md fehlt" generierte eine generische Next.js-Template-README
   statt projektspezifische Inhalte. Das LLM hatte keinen Projektkontext
   (kein package.json, kein CLAUDE.md im Prompt).

B) Fix für "API routes missing validateBody" halluzinierte eine falsche package.json
   (name: "nextjs-app", react: "^18") statt die echte Datei zu lesen.

C) Fix für "File size > 300 lines" sagte nur "manuelle Anpassung erforderlich"
   ohne konkrete Empfehlung.

D) Fix-Applier zerstörte eine Datei (Zeilen an falscher Position eingefügt).
   Content-based Matching + tsc-Validierung wurden nachgerüstet als Sicherheitsnetz.

E) Multi-File-Findings ("8 routes bypass abstraction layer") konnten nicht gefixt werden
   weil die betroffenen Dateien nicht im Finding standen.

BEWERTE DIESE 5 ASPEKTE:

1. CONTEXT-BUILDER
   Welcher Kontext fehlt? Was muss das LLM sehen um projektspezifische Fixes zu generieren?
   Konkret: welche Dateien, wie viel davon, in welcher Reihenfolge?
   Wie würdest du den ContextBuilder ändern um Problem A und B zu lösen?

2. GENERATOR PROMPT
   Ist der System-Prompt für den Fix-Generator gut formuliert?
   Welche Anweisungen fehlen? Was produziert generische statt projektspezifische Fixes?
   Zeige einen verbesserten System-Prompt (Pseudocode reicht).

3. NICHT-DIFFBARE FINDINGS
   Wie soll das System mit Findings umgehen die keinen Code-Diff haben können
   (README erstellen, Runbook schreiben, Architektur-Entscheidung treffen)?
   Empfehle ein konkretes Handling für diese "documentation fixes".

4. APPLIER ROBUSTHEIT
   Ist der Content-based Matching Ansatz + tsc-Validierung ausreichend?
   Welche Edge Cases bleiben nach diesen Fixes noch offen?
   Was wäre ein robusteres Verfahren als Content-based Matching?

5. ARCHITEKTUR-EMPFEHLUNG
   Wenn du die Fix-Engine von Grund auf designen würdest — was würdest du anders machen?
   Konkreter Vorschlag: Welche Komponente hat den größten Impact auf Fix-Qualität?`,

  judgePrompt: `Destilliere die 4 Bewertungen der Fix-Engine.
Für jeden der 5 Aspekte:
- Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
- Top-Empfehlung
- Konkreter Pseudocode für den wichtigsten Fix

Abschluss: Priorisierte Liste — was hat den größten Impact auf Fix-Qualität?
Trenne: "Quick Wins (< 1 Tag)" von "Strukturelle Änderungen (> 1 Tag)".`,
}
