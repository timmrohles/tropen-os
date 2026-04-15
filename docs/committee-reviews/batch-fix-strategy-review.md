# Committee Review: batch-fix-strategy

> Generiert am 2026-04-13 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

## Frage 1: Kategorisierung der Findings

**Konsens-Level:** EINIG

**Empfehlung:** Implementiere 4 explizite Kategorien: Code-Fix, Code-Generierung, Refactoring, und Manuell/Infrastruktur.

**Begründung:** Alle Modelle empfehlen Kategorisierung zur besseren User-Orientierung. Die Kategorien helfen Nutzern sofort zu verstehen, was automatisierbar ist und was nicht — kritisch für die "Advisor not Mechanic" Positionierung. Ohne Kategorien riskiert das Produkt, dass User ungeeignete Findings in KI-Tools dumpen und schlechte Ergebnisse dem Guide zuschreiben.

**Nächster Schritt:** Tagging-Logik in der Scan-Engine implementieren mit farbcodierten Icons/Labels (grün für Code-Fix, gelb für Code-Generierung, orange für Refactoring, rot für Manuell).

## Frage 2: Batch vs. Sequential Export

**Konsens-Level:** GESPALTEN

**Empfehlung:** Starte mit Option B (automatisch gruppierte Mini-Batches nach Themen), baue später Option D (User-Wahl) aus.

**Begründung:** GPT-4O und Gemini favorisieren thematische Gruppierung, Grok empfiehlt volle User-Kontrolle. Der Kompromiss schützt initial die Prompt-Qualität (kritisch für Reputation) während spätere Erweiterung mehr Flexibilität bietet. Option A (alles auf einmal) ist zu riskant für MVP.

**Nächster Schritt:** Gruppierungs-Algorithmus für 2-3 Kategorien (Security, DSGVO) implementieren mit max. 5 Findings pro Gruppe.

## Frage 3: N×1 Findings (gleiche Findings in vielen Dateien)

**Konsens-Level:** EINIG

**Empfehlung:** Strukturiere Prompts mit zentraler Lösung zuerst, dann max. 10 betroffene Dateien pro Prompt.

**Begründung:** Alle Modelle betonen das 10-Datei-Limit basierend auf LLM-Kapazitätsgrenzen. Die Struktur "zentrale Lösung → Dateiliste" fördert architekturelles Denken statt Copy-Paste-Chaos. Restliche Dateien werden in separate Batches aufgeteilt.

**Nächster Schritt:** Prompt-Template mit Platzhaltern für zentrale Lösung und Dateiliste erstellen, Auto-Splitting-Logik für >10 Dateien.

## Frage 4: Nicht-Code Findings

**Konsens-Level:** EINIG

**Empfehlung:** Exportiere Nicht-Code Findings separat als "Manuelle Aufgaben"-Liste, niemals im KI-Prompt.

**Begründung:** Klarer Konsens: KI kann diese nicht lösen, Vermischung würde Verwirrung stiften und Prompt-Qualität verwässern. Separate Liste respektiert die "Advisor"-Rolle und verhindert, dass User sinnlose Prompts in KI-Tools kopieren.

**Nächster Schritt:** Separaten Export-Button "Manuelle Aufgaben" mit Markdown-formatierter Checkliste implementieren.

## Frage 5: Qualitätsrisiko bei Batch-Fixing

**Konsens-Level:** EINIG

**Empfehlung:** Erlaube Batch-Fixing mit hartem Limit von 5-10 Findings und deutlicher Warnung.

**Begründung:** Alle Modelle sehen Batch-Fixing als notwendig aber riskant. Das Limit (5 laut GPT-4O, 10 laut Grok) schützt vor Chaos während es User-Bedürfnisse respektiert. Klare Kommunikation der Limits als "Empfehlung für beste Ergebnisse" statt Verbot.

**Nächster Schritt:** Warning-Dialog vor Export implementieren: "Für beste Ergebnisse empfehlen wir max. 5 Findings gleichzeitig."

## Frage 6: UX Export-Flow

**Konsens-Level:** MEHRHEIT

**Empfehlung:** MVP mit "Gruppe exportieren"-Button für vordefinierte sichere Kategorien, später Ausbau zu voller Auswahl.

**Begründung:** GPT-4O's pragmatischer Ansatz (gruppierter Export) als MVP, Groks flexible Lösung (Checkboxen) als Ziel. Dies minimiert initiale Komplexität bei Solo-Founder-Constraints während es Raum für Evolution lässt.

**Nächster Schritt:** Single "Smart Export"-Button der automatisch nach Kategorien gruppiert, mit Fortschrittsanzeige.

## ÜBERGREIFENDE ANALYSE

### KERNENTSCHEIDUNG
Die wichtigste Entscheidung ist **Frage 1 (Kategorisierung)** — sie ist Fundament für alle anderen Features. Ohne klare Kategorien können weder sinnvolle Batches noch Qualitätslimits implementiert werden. Der größte Impact auf UX und Reputation hat **Frage 5 (Qualitätsrisiko)** — unkontrolliertes Batch-Fixing könnte das Produkt als "Chaos-Generator" brandmarken.

### WARNUNGEN
- **Gefährliche Empfehlung:** "Alles auf einmal" exportieren ohne Limits würde Reputation zerstören
- **Falsche Annahme:** Die Fragen nehmen an, dass User Prompts manuell kopieren — native "Fix all" Features in Cursor/Claude würden das gesamte Export-Konzept obsolet machen
- **Zukunftsrisiko:** Wenn KI-IDEs eigene Scan-Features einbauen, muss der Guide seinen Wert neu definieren (tiefere Analyse statt nur Finding-Liste)

### IMPLEMENTATION PRIORITY
1. **Kategorisierung** (Frage 1) — Fundament, 1-2 Tage
2. **Nicht-Code Separation** (Frage 4) — Quick win, verhindert Frustration, <1 Tag  
3. **Mini-Batches mit Limits** (Frage 2+5 kombiniert) — Kern-Feature, 2-3 Tage
4. **N×1 Handling** (Frage 3) — Wichtig aber spezieller Use-Case, 1-2 Tage
5. **Erweiterter UX-Flow** (Frage 6) — Nach erstem Feedback iterieren

**Was kann warten:** Volle User-Kontrolle (Checkboxen, individuelle Auswahl) — erst wenn Basis-Gruppierung validiert ist.

## Nächste Schritte

1. **Sofort:** Kategorisierungs-Tags in Scan-Engine einbauen
2. **Diese Woche:** Basis-Export mit Trennung Code/Nicht-Code + 5-Finding-Limit
3. **Nächste Woche:** Smart Grouping Algorithm für thematische Batches
4. **Nach ersten 10 Usern:** Feedback zu Export-Flow sammeln und auf Checkbox-System erweitern

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |       0 |       0 | €0.0000 |
| GPT-4o           |    2591 |     756 | €0.0131 |
| Gemini 2.5 Pro   |    2753 |    2044 | €0.0222 |
| Grok 4           |    3480 |    2525 | €0.0449 |
| Judge (Opus)     |    4557 |    1894 | €0.1957 |
| **Gesamt**       |         |         | **€0.2759** |
