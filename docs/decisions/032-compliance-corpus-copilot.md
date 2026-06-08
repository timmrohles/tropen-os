# ADR-032: Compliance-Korpus / Compliance-Copilot (strategische Richtung)

**Status:** Proposed (Richtung) — Phase-2-Größenordnung, teils durch Anwalts-Monopol gedeckelt. **Ändert C2 nicht.**
**Datum:** 2026-06-08
**Entscheider:** Timm Rotter
**Tags:** strategy · compliance · corpus · phase-2
**Bezug:** ADR-031 (Checker-Loop), ADR-025 (Aggregator/Compliance-Strategie), C1/C2-Korpus-Specs, CLAUDE.md (Compliance-Stufen 1/2/3), `src/lib/audit/compliance-domains.ts`.

## Kontext

Externer Input (2026-06-08) skizzierte einen **vollwertigen Compliance-Copilot**: Intake → Rule-Engine (Jurisdiktion) → Rechtsquellen (Gesetze-im-Internet, EUR-Lex, Kommissions-Guidance) → 6-Schichten-Pflichten-Matrix → Dokumenten-/Nachweis-Generator → Quellen-Monitoring → Juristen-Eskalation. Das ist die **tiefe Version der Compliance-Dimension** von Pre-Flight/Audit — im Kern **Stufe 2/3** des bestehenden Compliance-Plans (Stufe 1 = Existenz-Check, heute live; Stufe 2 = inhaltliche KI-Prüfung, Premium; Stufe 3 = dialog-geführt, durch Anwalts-Monopol blockiert).

## Kern-Befund

Die **6-Schichten-Matrix** (Jurisdiktion → Geschäftstyp → Feature-Flags → Pflichten → Nachweise → Update-Trigger) **ist exakt das Korpus-Muster aus C1**: eine Pflicht = eine Regel mit reicheren `appliesWhen`-Tags (`jurisdiction:eu`, `feature:tracking`, `b2c:true`, …). Ein **Compliance-Obligation-Korpus** wäre damit ein **Geschwister** des Konventions-Korpus gleicher Form — kein Architektur-Redesign nötig, dieselbe „eine Quelle, Filter, Render"-Maschinerie.

## Übernommene Prinzipien (für den Compliance-Korpus, wenn gebaut)

1. **Konfidenz / Ampellogik** pro Pflicht: *sicher anwendbar · wahrscheinlich · unklar → Jurist* + Eskalations-Logik. Essenziell für unscharfe Rechts-Anwendbarkeit (Code-Regeln brauchen das nicht — die gelten oder nicht). Bremst Halluzinationen.
2. **3-Ebenen-Ausgabe** pro Pflicht: *Warum relevant · Was konkret umsetzen · Wie der Nachweis aussieht* (Evidence-Layer) — der „erklärte Handover" auf Compliance angewandt.
3. **Jurisdiktions-Nuance:** beim DSA zählt nicht der Sitz, sondern ob Dienste **EU-Nutzern angeboten** werden — schärfer als die heutigen Relevanz-Funktionen in `compliance-domains.ts`.
4. **Quellen-Monitoring** (Gesetzesänderungen / Behörden-Guidelines / Rechtsprechung → Matrix neu rechnen, betroffene Mandanten markieren) = **ADR-031's Verbesserungs-Loop, auf eine Rechts-Achse angewandt**.

**Governance** („keine Rechtsberatung, sondern Compliance-Assistenz mit Quellen, Annahmen, Konfidenz, Eskalation") ist bereits Prinzip — der Input bestätigt es.

## Konsequenzen / Scope-Grenze

- **C2 bleibt unverändert.** Engineering-Konventionen (knackig/universell) ≠ Rechts-Pflichten (jurisdiktional/unscharf). Keine Rechtsquellen-Ingestion / Jurisdiktions-Engine / Legal-Monitoring an C2 bolzen — das ist die „eine Baustelle wird zu drei"-Falle (Pivot-Disziplin).
- Das **volle System** (Live-Gesetzes-Ingestion, Monitoring, Juristen-Schleife) ist eine **eigene Initiative, Phase-2-Größe**, teils durch Anwalts-Monopol gedeckelt. Großer Produkt-Hebel, aber nicht jetzt.
- **Reihenfolge:** erst den Konventions-Korpus (C1/C2) reifen lassen + die Korpus-/Renderer-/Loop-Maschinerie härten; der **Compliance-Korpus** kommt als späterer Geschwister-Track, der dieselbe Maschinerie + die vier obigen Prinzipien nutzt.

## Related
ADR-031 (Loop) · ADR-025 (Compliance-Strategie/Aggregator) · ADR-029 (Audit-Kat. 27) · C1/C2-Specs.
