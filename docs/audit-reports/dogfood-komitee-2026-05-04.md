# Komitee-Review 2026-05-04 — 4 Unklare Fälle aus Self-Dogfood

> **Datum:** 2026-05-04
> **Anlass:** 4 unklare Fälle aus `dogfood-2026-05-04.md`
> **Methode:** Multi-Model-Komitee (Claude Sonnet + GPT-4o + Gemini 2.5 Pro + Grok 4 + Opus-Judge)
> **Kosten:** €0.29
> **Vollständiger Rohbericht:** `docs/committee-reviews/dogfood-komitee-1-review.md`
> **Status:** Empfehlungen 2–4 umgesetzt 2026-05-04. Empfehlung 1 (Frozen-Code-UI) im Phase-3-Backlog.
> Score-Drift: vorher 96.6% → nachher 96.7% (+0.1). IaC-Fix (+) kompensiert Dateigrößen-Stufung (–).

---

## Frage 1 — Frozen-Code-Exclusion (cat-1-rule-10 + cat-2-rule-12)

**Konsens-Level:** GESPALTEN (2:2 Split)
**Empfehlung:** B — Im Audit-UI als "frozen code" markieren, nicht aus Score excluden

**Begründung:** UI-Markierung bewahrt Score-Ehrlichkeit und liefert trotzdem Context. Vibe-Coder sehen "dieser Code zählt, ist aber bewusst geparkt". Vollständige Exclusion würde Score verschönern.

**Pattern-Beobachtung:** "Legacy-Code-Isolation"-Problem — Audit-Rules müssen zwischen aktiver Entwicklung und bewusst geparktem Code unterscheiden können. Gilt auch für andere Rules bei frozen Pfaden.

**Konsequenz für Coach:** UI-Tags ermöglichen selbstbestimmte Priorisierung ohne Resignation. Vibe-Coder kennen das — alte Lovable-Experimente, geparkte Cursor-Sessions.

---

## Frage 2 — Prop Drilling Severity (cat-9-rule-6)

**Konsens-Level:** EINIG
**Empfehlung:** Severity von `info` auf `low` anheben

**Begründung:** Alle 4 Modelle einig. Wenn eine Rule konkrete Code-Änderungen empfiehlt (Context/Zustand), ist sie mindestens `low`. `info` suggeriert "nur FYI" — das passt nicht zu einer Empfehlung mit klarer Aktion.

**Pattern-Beobachtung:** "Severity-Boundary-Problem" — Regeln mit konkreter Code-Aktion sind mindestens `low`, nie `info`. Übertragbar auf andere Rules die eine klare Fix-Empfehlung haben.

**Konsequenz für Coach:** Sanfte Ermutigung zu besseren Patterns ohne Druck. Passt zum iterativen Vibe-Coder-Workflow.

---

## Frage 3 — Approaching 300-Zeilen-Limit (cat-25-rule-2)

**Konsens-Level:** MEHRHEIT (3:1)
**Empfehlung:** B — Gestufte Scores einführen (300–400 Zeilen: score=3, 400+: score=2)

**Begründung:** 495-Zeilen-Dateien sind qualitativ problematischer als 326-Zeilen-Dateien. Stufung gibt differenzierteres Feedback für Priorisierung. Binäres Limit erfasst die Realität schlechter.

**Pattern-Beobachtung:** "Threshold-Stufung"-Pattern — gilt auch für CC-Thresholds, Coverage-Werte, andere Größen-Metriken. Graduelle Bewertung > binäre Schwelle.

**Konsequenz für Coach:** Vibe-Coder können zwischen "muss dringend" und "könnte optimiert werden" unterscheiden — verhindert Analysis-Paralysis.

---

## Frage 4 — IaC ohne Terraform (cat-11-rule-4)

**Konsens-Level:** MEHRHEIT (3:1)
**Empfehlung:** A — Vercel-native IaC als score=4 anerkennen

**Begründung:** vercel.json ist versioniert, deklarativ, platform-passend. Terraform-Requirement wäre Overkill für Vibe-Coder die primär auf Vercel/Netlify deployen. Tool-Wahl sollte respektiert werden, nicht die Enterprise-Norm aufgezwungen.

**Pattern-Beobachtung:** "Platform-Native-Bias" — Audit-Rules tendieren zu Enterprise-Tools und unterschätzen platform-native Lösungen. Erweiterbar auf: `netlify.toml`, `fly.toml`, Railway-Configs etc.

**Konsequenz für Coach:** Validiert Vibe-Coder-Tool-Wahl ohne "du bist unprofessionell"-Signal.

---

## Generelle Pattern-Beobachtungen (über alle Fragen integriert)

**Übergreifendes Pattern:** Alle 4 Fragen drehen sich um **"Context-Sensitivität vs. Universal-Standards"**. Die Audit-Engine muss zwischen Enterprise-Best-Practices und Vibe-Coder-Realität balancieren — und dabei ehrlich bleiben.

- Frozen Code, Platform-IaC: Vibe-Coder haben andere Tool-Stacks und Workflows als Enterprise
- Prop-Drilling-Severity: Empfehlungen brauchen Severity-Gewicht proportional zur Aktion
- Stufungs-Pattern: Graduelle Bewertung ist fast immer besser als binäre Schwellen

---

## Für Timm zu entscheiden

4 Empfehlungen, alle direkt umsetzbar:

1. **Frozen-Code-UI-Feature** — "Frozen"-Tag mit Tooltip in Audit-UI für eingefrorene Pfade (Phase 3 UX)
2. **Prop-Drilling low-Stufe** — cat-9-rule-6 von `info` auf `low` ändern (Checker-Edit, ~5 Min)
3. **File-Size-Stufung** — cat-25-rule-2: 300–400 → score=3, 400+ → score=2 (Checker-Edit, ~15 Min)
4. **Platform-IaC-Whitelist** — vercel.json/netlify.toml → score=4, Terraform → score=5 (Checker-Edit, ~10 Min)

Punkte 2–4 sind direkte Checker-Fixes. Punkt 1 ist ein UI-Feature (Phase 3).
