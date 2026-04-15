# Committee Review: fix-engine-strategy

> Generiert am 2026-04-13 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Strategische Architektur-Entscheidung: Fix-Engine Evolution

## 1. WELCHER ANSATZ FÜR WELCHEN USER-TYP?

**Konsens-Level:** EINIG

**Top-Empfehlung:** Ansatz B (Prompt-Export) als universeller Standard für alle User-Typen, mit MCP als Progressive Enhancement.

**Konkreter nächster Schritt:** Implementiere "Export Fix Prompt" Button neben jedem Finding diese Woche.

Die Modelle sind sich einig: Ansatz A ist zu fragil (40% Fehlerrate), Ansatz C zu früh für die Masse. Claude betont "Ein Fix der in 40% der Fälle kaputt geht, ist schlimmer als kein Fix." GPT-4O und Grok stimmen zu: B bietet die beste Balance aus Robustheit und Nutzerfreundlichkeit.

## 2. OPTIMALER FIX-PROMPT

**Konsens-Level:** EINIG

**Top-Empfehlung:** Strukturierter Prompt mit Finding-Details, Code-Snippet, Validierungs-Checkliste und tool-spezifischen Hints.

**Konkreter nächster Schritt:** Erstelle Prompt-Template-Engine mit Variablen für Finding-Typ, Tool (Cursor/Claude) und Projekt-Kontext.

Alle Modelle fordern klaren Kontext, Checklisten-Format und Guardrails. Claude's Template mit Validation-Points und Grok's YAML-Struktur zeigen den Weg. Wichtig: "Use-Case-Beispiele und klare Eingrenzung" (GPT-4O).

## 3. MCP-SERVER: REALISTISCH ODER ZU FRÜH?

**Konsens-Level:** MEHRHEIT

**Top-Empfehlung:** MCP als Zusatz-Feature für Power-User entwickeln, nicht als Hauptstrategie.

**Konkreter nächster Schritt:** Baue minimalen MCP-Server (3 Endpoints) als 1-Sprint-Experiment parallel zum Prompt-Export.

Claude warnt vor <5% Adoption, Grok sieht 30-50% bei Profis. Gemini und GPT-4O empfehlen schrittweise Einführung. Konsens: Als "Labs"-Feature starten, bei steigender Adoption ausbauen.

## 4. POSITIONING: "WIR BERATEN, WIR FIXEN NICHT"

**Konsens-Level:** EINIG

**Top-Empfehlung:** Das ist eine Stärke — positioniere als "Expert Analysis + Native Code Integration".

**Konkreter nächster Schritt:** Ändere Landing-Page-Copy zu: "Deine KI schreibt Code. Wir machen ihn production-ready."

Claude's Analogie zu ESLint/SonarQube resoniert. GPT-4O betont "Empowerment durch hochwertige Beratung". Die Messaging-Strategie ist klar: Nicht "können nicht fixen", sondern "deine KI kennt deinen Code besser".

## 5. KOSTEN UND UNIT ECONOMICS

**Konsens-Level:** EINIG

**Top-Empfehlung:** Nur Ansätze B und C sind bei €39/Monat wirtschaftlich nachhaltig.

**Konkreter nächster Schritt:** Deprecate Konsens-Fix-Pipeline sofort, behalte nur Quick-Fix für Dogfooding.

Claude rechnet vor: Konsens-Fix kostet €9 bei €39 Revenue (23% Marge-Impact). GPT-4O und Gemini bestätigen: "unwirtschaftlich". Prompt-Export kostet nur €0.50/Monat.

## 6. MIGRATION: VON A NACH B/C

**Konsens-Level:** EINIG

**Top-Empfehlung:** Direkte Migration zu B mit parallelem A für Dogfooding, C als Zukunftsoption.

**Konkreter nächster Schritt:** Deploy Prompt-Export als Default nächste Woche, A/B-Test gegen Fix-Engine.

3-Phasen-Plan ist Konsens: MVP mit Prompt-Export, parallele MCP-Entwicklung, Fix-Engine als "Labs"-Feature. Wiederverwendbar: Context-Builder, Risiko-Assessment.

---

## KERNENTSCHEIDUNG

**Gewinner:** Ansatz B (Prompt-Export) mit Hybrid-Strategie zu C

**Empfehlung in einem Satz:** Migriere sofort zu Prompt-Export als Hauptfeature, entwickle MCP-Server parallel für Power-User.

**Erster konkreter Schritt:** Baue diese Woche den Prompt-Generator mit Claude's Template-Struktur und integriere ihn ins Frontend.

## ARCHITEKTUR

**Bester Vorschlag:** GPT-4O's modulare Architektur mit Prompt Generator, Integration Layer und UI-Komponente.

**Wiederverwendbar:** 
- Context-Builder (für Prompt-Generierung)
- Risiko-Assessment (für Priorisierung)
- Finding-Datenbank (als Basis für Prompts)

**Neu zu bauen:**
- Prompt-Template-Engine mit Tool-spezifischen Varianten
- Export-UI mit Copy-Button und Tool-Selector
- MCP-Server mit 3 Basis-Endpoints

## WARNUNGEN

**Projekt-Killer:** Ansatz A weiterzuverfolgen würde das Vertrauen zerstören. "Ein Fix der in 40% der Fälle kaputt geht, ist schlimmer als kein Fix" (Claude).

**Falsche Annahme:** Dass Vibe-Coders One-Click-Fixes wollen. Sie wollen funktionierende Lösungen, auch wenn Copy-Paste nötig ist.

**Cursor/Copilot-Risiko:** Wenn sie native Fix-Generierung einbauen, wird Tropen OS zum reinen Finding-Provider. Lösung: Fokus auf Quality-Standards und Projekt-Score als USP.

## POSITIONING-EMPFEHLUNG

**Kommunikations-Strategie:** Betone die Arbeitsteilung als Feature: "Wir sind die Experten für Code-Quality, deine KI ist der Experte für deinen Code."

**Landing-Page One-Liner:** "Your AI writes code. We make it production-ready."

Alternativ: "The missing quality layer for AI-powered development."

## Nächste Schritte

1. **Sofort (diese Woche):** Prompt-Export-Button implementieren mit Basic-Template
2. **Sprint 1:** Prompt-Template-Engine mit tool-spezifischen Varianten
3. **Sprint 2:** MCP-Server Proof-of-Concept (get_findings, get_fix_prompt, trigger_rescan)
4. **Monat 2:** A/B-Test Prompt vs Fix-Engine, Migration basierend auf Daten
5. **Monat 3:** Fix-Engine zu "Labs", MCP für Beta-User, Prompt-Export als Standard

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    3990 |    2048 | €0.0397 |
| GPT-4o           |    2896 |     905 | €0.0151 |
| Gemini 2.5 Pro   |    3069 |    2044 | €0.0226 |
| Grok 4           |    3786 |    2518 | €0.0457 |
| Judge (Opus)     |    6825 |    1817 | €0.2219 |
| **Gesamt**       |         |         | **€0.3451** |
