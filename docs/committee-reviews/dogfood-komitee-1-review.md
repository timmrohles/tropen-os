# Committee Review: dogfood-komitee-1

> Generiert am 2026-05-04 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

## FRAGE 1 — Frozen-Code-Exclusion

### Konsens-Level: GESPALTEN
**Empfohlene Option:** B — Als "frozen code" im UI markieren (2:2 Split)

**Kern-Begründung:** Die Modelle sind gespalten zwischen vollständiger Exclusion (GPT-4O, Grok) und UI-Markierung (Claude, indirekt Gemini). Die UI-Markierung bewahrt Score-Ehrlichkeit während sie Context liefert — Vibe-Coder sehen "dieser Code zählt, ist aber geparkt".

**Pattern-Beobachtung:** Alle erkennen das "Legacy-Code-Isolation"-Problem: Audit-Rules müssen zwischen aktiver Entwicklung und bewusst geparktem Code unterscheiden können.

**Konsequenz für Coach-Position:** UI-Tags ermöglichen Vibe-Codern selbstbestimmte Priorisierung ohne Score-Verschönerung — sie bleiben ehrlich über Technical Debt aber vermeiden Resignation.

## FRAGE 2 — Prop Drilling Severity

### Konsens-Level: EINIG
**Empfohlene Option:** B — Severity auf "low" (Weight 1) anheben

**Kern-Begründung:** Alle Modelle sehen Prop Drilling als konkrete Wartbarkeits-Verschlechterung mit klarer Aktion (Context-Refactoring). "Info" suggeriert "nur FYI", während "low" signalisiert "bei Gelegenheit verbessern".

**Pattern-Beobachtung:** Claude identifiziert das "Severity-Boundary-Problem": Wenn eine Rule konkrete Code-Änderungen empfiehlt, ist sie mindestens "low", nicht "info".

**Konsequenz für Coach-Position:** Sanfte Ermutigung zu besseren Patterns ohne Druck — passt zum iterativen Vibe-Coder-Workflow.

## FRAGE 3 — Approaching 300-Zeilen-Limit

### Konsens-Level: MEHRHEIT
**Empfohlene Option:** B — Gestufte Scores (score=3 für 300-400, score=2/4/5 für 400+)

**Kern-Begründung:** 3 von 4 Modellen bevorzugen Stufung statt binärem Limit. 495-Zeilen-Dateien sind qualitativ problematischer als 326-Zeilen-Dateien — Stufung gibt differenzierteres Feedback für Priorisierung.

**Pattern-Beobachtung:** "Threshold-Stufung"-Pattern: Binäre Schwellenwerte erfassen Realität schlechter als graduelle Bewertung (auch bei Komplexität, Coverage etc. anwendbar).

**Konsequenz für Coach-Position:** Vibe-Coder können zwischen "muss dringend" und "könnte optimiert werden" unterscheiden — verhindert Analysis-Paralysis.

## FRAGE 4 — IaC ohne Terraform

### Konsens-Level: MEHRHEIT  
**Empfohlene Option:** A — Vercel-native IaC als score=4 anerkennen

**Kern-Begründung:** 3 Modelle (Claude, GPT-4O, Grok mit score=5) erkennen vercel.json als echte IaC für die Zielgruppe an. Es ist versioniert, deklarativ und platform-passend — Terraform-Requirement wäre Overkill.

**Pattern-Beobachtung:** "Platform-Native-Bias": Audit-Rules tendieren zu Enterprise-Tools und unterschätzen platform-native Lösungen die für die Zielgruppe völlig ausreichen.

**Konsequenz für Coach-Position:** Validiert Vibe-Coder Tool-Wahl ohne "du bist unprofessionell"-Signal — hält sie im effizienten Workflow.

## ÜBERGREIFENDE ANALYSE

**Gemeinsames Pattern:** Alle 4 Fragen drehen sich um "Context-Sensitivität vs. Universal-Standards". Die Audit-Engine muss zwischen Enterprise-Best-Practices und Vibe-Coder-Realität balancieren.

**Dringendste Entscheidung:** FRAGE 1 (Frozen-Code) — beeinflusst fundamental wie Scores berechnet werden und ob Vibe-Coder der Engine vertrauen.

**Größter Vertrauens-Impact:** FRAGE 4 (IaC) — signalisiert ob die Engine ihre Tool-Choices respektiert oder sie zu "echten Entwicklern" erziehen will.

## Nächste Schritte

### TIMM-ENTSCHEIDUNGS-LISTE:

1. **Frozen-Code-UI-Feature implementieren:** "Frozen"-Tag mit Tooltip in Audit-UI einbauen. Pfade bleiben im Score aber mit visueller Kennzeichnung.

2. **Prop-Drilling auf "low" hochstufen:** cat-9-rule-6 Severity von "info" auf "low" ändern (sofort umsetzbar).

3. **File-Size-Stufung einführen:** cat-25-rule-2 auf gestuftes Scoring umstellen (300-400: score=3, 400+: score=2).

4. **Platform-IaC-Whitelist erstellen:** vercel.json, netlify.toml etc. als score=4 IaC anerkennen, Terraform/Pulumi als score=5.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    6056 |    1446 | €0.0371 |
| GPT-4o           |    4463 |     697 | €0.0169 |
| Gemini 2.5 Pro   |    4918 |    2044 | €0.0247 |
| Grok 4           |    5394 |    2201 | €0.0458 |
| Judge (Opus)     |    4897 |    1397 | €0.1658 |
| **Gesamt**       |         |         | **€0.2902** |
