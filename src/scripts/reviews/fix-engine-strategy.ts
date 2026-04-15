import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'fix-engine-strategy',

  contextFiles: [
    'docs/committee-reviews/input-fix-engine-strategy.md',
    'docs/webapp-manifest/manifesto.md',
  ],

  contextTransforms: {
    'docs/webapp-manifest/manifesto.md': (c) => c.split('\n').slice(0, 80).join('\n'),
  },

  systemPrompt: `Du bist ein erfahrener Developer Tools Architect und Product Strategist. Du bewertest die Fix-Strategie einer Code-Quality-Plattform für Vibe-Coders (Entwickler die mit KI-Tools wie Cursor, Claude Code, Lovable Code generieren).

Die Plattform heißt Tropen OS und positioniert sich als "Production Readiness Guide" — sie findet Probleme, erklärt sie, und hilft dem User sie zu beheben. Sie schreibt keinen Code direkt in externe Projekte.

AKTUELLER STAND:
- 25+ Audit-Agenten mit ~195 Regeln scannen Code statisch
- Findings werden als Score (0-100%) + Einzelfindings dargestellt
- Fix-Engine: LLM generiert Unified Diff → Applier wendet an
- Content-based Matching (nicht Zeilennummern-basiert)
- tsc-Validierung nach Patching → automatischer Rollback bei Fehler
- Quick Fix (1 Modell, ~€0.02) und Konsens-Fix (4 Modelle + Judge, ~€0.45)
- Risiko-Einschätzung vor Anwendung (safe/moderate/critical)

PROBLEME IN DER PRAXIS:
1. LLMs schätzen Zeilennummern falsch → Content-Matching als Workaround
2. Zu wenig Projektkontext → generische statt projektspezifische Fixes
3. Neue Dateien = Halluzination (README, Config, Runbooks werden erfunden)
4. Multi-File-Findings → LLM kennt die betroffenen Dateien nicht
5. Manche Findings sind keine Code-Fixes sondern Architektur-Entscheidungen
6. Fix-Engine hat eine Datei zerstört (vor Safety-Net)
7. Fast jeder Fix musste manuell korrigiert werden

BEREITS VORHANDEN (alternative Ansätze):
- "Aufgabe + Prompt-Export": Finding → generierter Prompt → User kopiert in Cursor/Claude Code → Coding-KI fixt mit vollem Dateizugriff → Re-Scan zeigt ob Score gestiegen ist
- .cursorrules / CLAUDE.md Export: 26 Build-Time-Regeln die das Coding-Tool des Users als Leitplanken nutzt
- Strategie-Empfehlungen: gruppierte Findings mit Architektur-Empfehlung statt 124× Einzel-Fix

POSITIONIERUNG:
"Advisor, not Mechanic" — Tropen OS findet Probleme und erklärt sie. Es schreibt keinen Code in externe Projekte. Der User nimmt die Empfehlung und gibt sie seinem Coding-Tool. Beim Re-Scan sieht er ob der Score gestiegen ist.

Bewerte die Strategie-Optionen kritisch und konkret. Keine generischen Empfehlungen — konkrete Architektur-Vorschläge.`,

  userPrompt: `BEWERTE DIESE 6 ASPEKTE:

1. WELCHER ANSATZ FÜR WELCHEN USER-TYP?

   Hobby-Viber: will in 5 Minuten ein Ergebnis
   Solo-Gründer: will Production Grade, hat Zeitdruck
   Agency/Freelancer: arbeitet an mehreren Kundenprojekten

   Fragen:
   - Ist Ansatz A (One-Click-Fix) für irgendeinen Typ der richtige Weg, trotz der Fragilität?
   - Ist Ansatz B (Prompt-Export) für Vibe-Coders zu umständlich (Copy-Paste)?
   - Ist Ansatz C (MCP) zu technisch für Nicht-Entwickler?
   - Gibt es einen Ansatz D den wir übersehen?

2. WIE SIEHT EIN OPTIMALER FIX-PROMPT AUS?

   Wenn Ansatz B der richtige Weg ist: was muss im generierten Prompt stehen damit die Coding-KI einen guten Fix produziert?

   Fragen:
   - Wie viel Kontext braucht der Prompt? (Finding, Datei, Regel, Beispiel-Fix?)
   - Soll der Prompt tool-spezifisch sein? (anders für Cursor vs. Claude Code vs. Lovable)
   - Soll der Prompt eine einzelne Anweisung sein oder eine Checkliste?
   - Wie verhindert man dass die Coding-KI den Prompt falsch interpretiert?
   - Soll der Prompt die CLAUDE.md / .cursorrules Regeln referenzieren?

3. MCP-SERVER: REALISTISCH ODER ZU FRÜH?

   Cursor hat MCP-Support seit Ende 2025. Claude Code hat MCP-Support nativ. VS Code Extensions können MCP-Server einbinden.

   Fragen:
   - Ist das MCP-Ökosystem reif genug für ein Produkt?
   - Wie hoch ist die Adoption — nutzen Vibe-Coders MCP?
   - Ist ein MCP-Server der richtige Einstieg, oder sollte es zuerst eine VS Code Extension sein?
   - Kann der MCP-Server schrittweise eingeführt werden? (erst get_findings, später trigger_rescan)
   - Was sind die technischen Risiken? (MCP-Spec ändert sich, Cursor-Support instabil)

4. POSITIONING: "WIR FIXEN NICHT" — STÄRKE ODER SCHWÄCHE?

   Fragen:
   - Klingt das für den User nach Schwäche? ("Das Tool kann nicht mal fixen?")
   - Oder ist es ein Feature? ("Tropen OS lässt DEINE KI fixen — die kennt deinen Code besser als jedes externe Tool")
   - Wie kommuniziert man das richtig?
   - Gibt es Produkte in anderen Branchen die erfolgreich "beraten statt machen"?
   - Ist ein Hybrid möglich? ("Einfache Fixes machen wir direkt, komplexe bekommst du als Prompt")

5. KOSTEN UND UNIT ECONOMICS

   Ansatz A: €0.02-0.45 pro Fix (LLM-Kosten)
   Ansatz B: €0.00-0.01 pro Prompt (Template + Kontext)
   Ansatz C: €0.00 pro Anfrage (Findings aus DB, kein LLM)

   Fragen:
   - Bei Ansatz A mit Konsens-Fix (€0.45): wie viele Fixes pro Monat kann ein €39/Monat-User machen bevor es unprofitabel wird?
   - Ist Ansatz B wirtschaftlich der einzig sinnvolle?
   - Wie beeinflusst die Fix-Strategie das Pricing-Modell?
   - Sollte Fix-Generierung ein separates Credit-Feature sein?

6. MIGRATION: WIE KOMMEN WIR VON A NACH B/C?

   Die Diff-basierte Fix-Engine ist gebaut (Sprint 7+7b). Was passiert damit?

   Fragen:
   - Komplett entfernen oder als "Labs"-Feature behalten?
   - Für Dogfooding (eigenes Projekt) behalten, für externe User nur Prompt-Export?
   - Kann die Fix-Engine als Basis für bessere Prompt-Generierung dienen?
   - Was von der bestehenden Infrastruktur ist wiederverwendbar? (Risiko-Assessment, Context-Builder, Konsens-Pipeline)

---

ZUSÄTZLICH — ARCHITEKTUR-VORSCHLAG GEWÜNSCHT:

Skizziere für den empfohlenen Ansatz eine konkrete technische Architektur:
- Welche Dateien/Module werden gebraucht?
- Wie sieht der Datenfluss aus?
- Welche bestehenden Komponenten können wiederverwendet werden?
- Was ist der minimale MVP für den empfohlenen Ansatz?
- Wie sieht die Roadmap aus (3 Monate / 6 Monate / 12 Monate)?`,

  judgePrompt: `4 Modelle haben unabhängig die Fix-Strategie einer Code-Quality-Plattform bewertet — 6 Aspekte plus Architektur-Vorschlag.

Die Plattform positioniert sich als "Advisor, not Mechanic" für Vibe-Coders. Aktuell hat sie eine fragile Diff-basierte Fix-Engine die fast immer manuelle Korrekturen braucht.

Destilliere den Konsens:

Für jeden der 6 Aspekte:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Top-Empfehlung (ein Satz)
3. Konkreter nächster Schritt

KERNENTSCHEIDUNG:
- Welcher Ansatz gewinnt? (A, B, C, oder Hybrid)
- Wie lautet die Empfehlung in einem Satz?
- Was ist der erste konkrete Schritt?

ARCHITEKTUR:
- Welcher Architektur-Vorschlag ist der beste?
- Was kann von der bestehenden Fix-Engine wiederverwendet werden?
- Was muss neu gebaut werden?

WARNUNGEN:
- Gibt es einen Ansatz der das Projekt zum Scheitern bringen kann wenn er verfolgt wird?
- Gibt es eine falsche Annahme in den Ansätzen?
- Was passiert wenn Cursor/Copilot native Fix-Generierung einbauen?

POSITIONING-EMPFEHLUNG:
- Wie kommuniziert man "wir fixen nicht selbst" ohne dass es als Schwäche wahrgenommen wird?
- Formuliere einen One-Liner für die Landing Page.`,
}
