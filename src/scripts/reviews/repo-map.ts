import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'repo-map',

  contextFiles: [
    'docs/committee-reviews/input-repo-map-review.md',
    'src/lib/repo-map/types.ts',
    'src/lib/repo-map/index.ts',
    'src/lib/repo-map/graph-ranker.ts',
    'src/lib/repo-map/reference-analyzer.ts',
    'src/lib/repo-map/symbol-extractor.ts',
    'src/lib/repo-map/map-compressor.ts',
    'src/lib/repo-map/formatters/text-formatter.ts',
  ],

  contextTransforms: {
    // Symbol-Extractor ist lang — nur die ersten 120 Zeilen (Kernlogik)
    'src/lib/repo-map/symbol-extractor.ts': (c) =>
      c.split('\n').slice(0, 120).join('\n') + '\n... (gekürzt)',
  },

  systemPrompt: `Du bist ein erfahrener Compiler-Engineer und Developer Tools Architect. Du bewertest eine Repo Map Generator Pipeline die Codebases in LLM-freundliche Repräsentationen übersetzt.

KONTEXT:
Die Pipeline ist Teil von Tropen OS, einer Code-Quality-Plattform für "Vibe Coders" (Entwickler die mit KI-Tools Code generieren). Die Repo Map liefert Kontext für:
- Audit-Agenten (25+ Agenten mit ~195 Regeln die Code statisch scannen)
- Fix-Engine (LLM-generierte Fixes für gefundene Probleme)
- Externe Projekt-Scans (Browser-basiert via File System Access API)
- Geplant: MCP-Server, intelligente Reviews

STAND DER TECHNIK:
- Aider (Python) nutzt ctags + tree-sitter + PageRank — de facto Standard für LLM Repo Maps
- GitHub Copilot hat proprietären Context-Builder
- Sourcegraph SCIP nutzt Language Servers für präzise Referenzen
- Tropen OS nutzt die TypeScript Compiler API direkt — zero external dependencies

AKTUELLER STAND:
- 6-Stufen-Pipeline: File Discovery → Parse → Symbols → References → PageRank → Compress
- Nur TypeScript/JavaScript Support
- PageRank auf File-Dependencies + multiplikative Symbol-Level-Faktoren
- Greedy Token-Budget Compression
- Aider-kompatibles Text-Output-Format
- Unit Tests für jede Stufe + Integration Test
- Dogfooding: scannt eigene Codebase (624 Dateien, 2677 Symbole, 1.1s)

BEKANNTE PROBLEME:
1. Re-Exports/Barrel-Files werden nicht erkannt → falsche Referenzzahlen
2. Browser-Scan (generateRepoMapFromFiles) hat kein Cross-File-Analysis → schlechtes Ranking
3. Path Resolution fragil (@/ über String-Matching statt tsconfig.json)
4. Rank-Scores konzentriert im niedrigen Bereich (0.017-0.08)
5. Entry-Point Detection über hardcodierte Liste
6. Kein Caching — jeder Run parst komplett neu
7. Token-Budget wird nicht optimal ausgenutzt (Greedy ohne Backtracking)

Bewerte die Pipeline technisch fundiert und konkret. Keine generischen Empfehlungen — konkrete Architektur-Vorschläge mit Pseudocode oder Interface-Skizzen wo sinnvoll.`,

  userPrompt: `BEWERTE DIESE 8 ASPEKTE:

1. RANKING-ALGORITHMUS QUALITÄT

   Die aktuelle Formel: rankScore = fileRank × exportBonus × kindWeight × refBonus × entryPointBonus

   Fragen:
   - Ist PageRank der richtige Algorithmus für Codebases? Oder wäre HITS, Katz-Centrality, oder ein eigener Graph-Algorithmus besser?
   - Sind die multiplikativen Faktoren (export 2.0, kind 0.4-1.0, ref sqrt) sinnvoll kalibriert?
   - Warum konzentrieren sich die Scores im niedrigen Bereich? Ist das ein Normalisierungsproblem oder ein fundamentales Issue?
   - Wie würde ein besserer Ranking-Algorithmus aussehen? Konkrete Formel vorschlagen.
   - Sollte der Algorithmus kontextabhängig sein? (z.B. höhere Gewichtung für die Dateien rund um ein Finding)

2. REFERENCE ANALYSIS — VOLLSTÄNDIGKEIT

   Aktuell werden nur import-Statements analysiert. Re-Exports, Barrel-Files, und indirekte Referenzen fehlen.

   Fragen:
   - Wie viel Ranking-Qualität geht durch fehlende Re-Export-Erkennung verloren? Schätze den Impact.
   - Ist die TypeScript Compiler API der richtige Ansatz, oder sollten wir auf tree-sitter wechseln?
   - Wie löst Aider das Re-Export-Problem? Können wir davon lernen?
   - Sollten wir die TypeScript Language Service API nutzen (findAllReferences) statt manuell zu parsen?
   - Namespace-Imports (\`import * as X\`) zählen aktuell alle Symbole — ist das korrekt oder eine Verzerrung?

3. BROWSER-SCAN QUALITÄT (generateRepoMapFromFiles)

   Externe Projekte werden im Browser gescannt — keine Disk-Reads, kein Cross-File-Analysis.

   Fragen:
   - Können wir Cross-File-Analysis in-memory machen? Die Dateien sind ja im Browser vorhanden.
   - Wie hoch ist der Qualitätsverlust ohne Referenz-Analyse? 10%? 50%? 80%?
   - Gibt es einen Hybrid-Ansatz? (z.B. AST-basierte Import-Erkennung ohne Disk-Reads)
   - Sollte der Browser-Scan einen separaten, einfacheren Ranking-Algorithmus nutzen?

4. TOKEN-BUDGET STRATEGIE

   Greedy-Algorithmus: sortiere nach Rank, füge Symbole hinzu bis Budget voll.

   Fragen:
   - Ist Greedy optimal, oder verlieren wir wichtige Symbole wegen des File-Header-Overheads?
   - Sollte der Algorithmus File-Clustering berücksichtigen? (viele Symbole aus einer Datei = günstiger)
   - Gibt es einen Knapsack-artigen Ansatz der bessere Ergebnisse liefert?
   - Wie gut ist die Token-Schätzung (text.length / 4)? Sollten wir tiktoken nutzen?
   - Ist das Aider-Format das beste Output-Format für LLMs? Oder gibt es bessere Alternativen?

5. SKALIERUNG UND PERFORMANCE

   Aktuell: 1.1s für 624 Dateien. Kein Caching, keine Parallelisierung.

   Fragen:
   - Bis zu welcher Projektgröße skaliert die Pipeline? 2000 Dateien? 10000?
   - Lohnt sich Caching (z.B. AST-Cache pro Datei mit Hash)? Wie viel Speedup?
   - Kann/sollte die Pipeline parallelisiert werden? (Worker Threads, Promise.all)
   - Sollte die Pipeline inkrementell arbeiten? (nur geänderte Dateien neu parsen)
   - Ist die sequenzielle Verarbeitung (for-loop über alle Dateien) ein Bottleneck?

6. MULTI-LANGUAGE SUPPORT

   Aktuell nur TypeScript/JavaScript. Externe Projekte können Python, Go, Rust etc. nutzen.

   Fragen:
   - Braucht Tropen OS Multi-Language Support, oder ist TS/JS der richtige Fokus für Vibe-Coders?
   - Wenn ja: Ist tree-sitter der richtige Ansatz für Language-agnostische Extraktion?
   - Welche Sprachen sind Priorität? (Python vermutlich #1 wegen KI-Stacks)
   - Kann die Pipeline so abstrahiert werden, dass ein neuer Language-Provider einfach hinzugefügt werden kann?
   - Oder ist es besser, für jede Sprache einen spezialisierten Extractor zu schreiben?

7. INTEGRATION UND DISTRIBUTION

   Die Repo Map wird aktuell als CLI-Tool und programmatisch genutzt.

   Fragen:
   - Sollte die Repo Map als MCP-Resource exponiert werden? Wie sähe das MCP-Interface aus?
   - Sollte es einen API-Endpunkt geben? (/api/repo-map/generate)
   - Sollte die Map als Context-Provider im Chat verfügbar sein? ("@repo-map" Mention)
   - Wie integriert sich die Map am besten in die Audit-Pipeline?
   - Sollte die Map bei jedem Audit-Run neu generiert werden, oder gecacht + invalidiert?

8. QUALITÄTSMESSUNG UND GROUND-TRUTH

   Aktuell gibt es keine objektive Messung ob das Ranking "gut" ist.

   Fragen:
   - Wie messen wir die Qualität des Rankings? Precision@K? Entwickler-Bewertung?
   - Gibt es eine Ground-Truth die wir konstruieren können? (z.B. "diese 50 Symbole sollten in den Top 100 sein")
   - Sollten wir A/B-Tests machen? (altes vs. neues Ranking → messen ob LLM bessere Fixes produziert)
   - Können wir die Audit-Ergebnisse als Proxy für Ranking-Qualität nutzen?
   - Wie validieren andere Tools (Aider, Copilot) ihre Repo Maps?

---

ZUSÄTZLICH — ARCHITEKTUR-VORSCHLAG GEWÜNSCHT:

Skizziere eine verbesserte Pipeline-Architektur:
- Welche Module bleiben, welche werden ersetzt?
- Wo ist der größte ROI für Verbesserungen?
- Interface-Skizzen für neue Abstraktionen (z.B. LanguageProvider, CacheLayer)
- Konkreter 3-Stufen-Plan: Quick Wins → Mittelfristig → Langfristig
- Was ist der minimale Aufwand für den größten Qualitätssprung?`,

  judgePrompt: `4 Modelle haben unabhängig die Repo Map Generator Pipeline bewertet — 8 Aspekte plus Architektur-Vorschlag.

Die Pipeline ist ein Kernbaustein einer Code-Quality-Plattform. Sie übersetzt Codebases in LLM-freundliche Repräsentationen für Audit-Agenten, Fix-Engine, und externe Projekt-Scans.

Destilliere den Konsens:

Für jeden der 8 Aspekte:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Top-Empfehlung (ein Satz)
3. Konkreter nächster Schritt (was genau implementieren?)

RANKING-ALGORITHMUS:
- Welche Formel/welcher Ansatz wird empfohlen?
- Pseudocode oder Interface-Skizze der verbesserten Version

BROWSER-SCAN:
- Konkreter Vorschlag wie In-Memory Cross-File-Analysis funktionieren kann

ARCHITEKTUR:
- Welcher Architektur-Vorschlag ist der beste?
- Konkreter 3-Stufen-Plan mit geschätztem Aufwand
- Was ist der größte Quick Win?

WARNUNGEN:
- Gibt es ein Over-Engineering-Risiko? (z.B. Multi-Language zu früh)
- Welche Verbesserung hat den schlechtesten ROI?
- Was passiert wenn wir nichts ändern — wie lange hält die aktuelle Qualität?

PRIORISIERTE TODO-LISTE:
Erstelle eine priorisierte Liste von max. 10 konkreten Verbesserungen, sortiert nach Impact/Aufwand-Verhältnis.`,
}
