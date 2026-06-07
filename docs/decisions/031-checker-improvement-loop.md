# ADR-031: Checker-Verbesserungs-Loop / Regel-Lebenszyklus

**Status:** Proposed (Konzept) — Daten-Motor gated auf Beta-Nutzung; Engineering-Teile (Reifegrad + Regressions-Gate) sofort baubar.
**Datum:** 2026-06-07
**Entscheider:** Timm Rotter
**Tags:** architecture · audit · checkers · quality · ai-ops
**Bezug:** ADR-021 (Veredler), C1-Spec (Konventions-Regelkorpus — `docs/superpowers/specs/2026-06-07-preflight-conventions-corpus-c1-design.md`).

---

## Kontext

Die Audit-Checker (255 Regeln, 26 Kategorien, ~29 Agenten) sind **deterministische TypeScript-Funktionen** — bewusst starr. Das wirft die Frage auf: Wie werden sie **über die Zeit besser**, ohne ihre Stärke (Auditierbarkeit, Determinismus, keine Halluzination, niedrige Kosten) aufzugeben?

**Reframe (richtungsweisend):** Starr/deterministisch ist ein **Feature**, kein Bug — der Burggraben gegenüber „LLM rät". „Besser werden" darf das nicht eintauschen gegen adaptive Black-Box-Checker. Verbessert werden **das Regelwerk und die Kalibrierung**, datengetrieben und mensch-im-Loop; die Checker selbst bleiben dumm und deterministisch. Selbst-verbessernd ≠ selbst-modifizierender Code.

## Entscheidung

Ein **Regel-Lebenszyklus-Loop** in vier Teilen:

### 1. Signal-Einzug (pro Regel)
Aggregierte Metriken je Regel:
- **FP-Rate** = als „nicht relevant" verworfen / gezeigt (das Audit erfasst `not_relevant_reason` mit 4 Gründen bereits).
- **Fix-Rate** = als erledigt markiert / gezeigt (echte, relevante True Positives).
- **Verwerfungs-Grund-Verteilung** (warum „nicht relevant").
- **Benchmark-Precision/Recall** gegen ein gelabeltes Golden-Set.
→ Ein „Regel-Gesundheits"-Dashboard.

### 2. Triage (Mensch + Komitee)
Pro Regel entscheiden: **fixen** (hohe FP), **stilllegen** (irrelevant geworden), **neu bauen** (False-Negative-Cluster, neue Framework-Patterns). Das **Multi-Modell-Komitee** (vorhanden, `committee-review.ts`/`generate-agents.ts`) ist die „Regel-F&E" — es schlägt Änderungen/neue Regeln vor, Mensch entscheidet.

### 3. Änderung + Regressions-Gate
Jede Regeländerung muss über die **49-Repo-Benchmark + Golden-Set**, bevor sie live geht: **keine Precision/Recall-Regression**. Der bestehende Benchmark (`src/lib/benchmark/`) ist der Test-Harness. Konsistent mit `checker-design-patterns.md` (P1–P10).

### 4. Reifegrad-Modell
| Reifegrad | Verhalten |
|-----------|-----------|
| **experimental / shadow** | Regel wird berechnet, als Beta markiert, **NICHT im Score** — beobachtet FP/Fix-Rate an echten Daten |
| **stable** | FP-Rate < Schwelle (Ziel <10% MVP, <5% Y1) → zählt im Score |
| **deprecated** | abgelöst/irrelevant → stillgelegt, Historie erhalten |

So vergiftet eine unausgereifte Regel nie den Score, und neue Regeln können risikofrei eingeführt werden.

## Strategischer Hebel: eine Quelle, drei Türen

Weil **Pre-Flight** (*schreibt* Regeln, C1/C2), **Audit** (*prüft*) und **Veredler** (*injiziert*, ADR-021) aus **demselben Regelkorpus** speisen, verbessert dieser eine Loop **alle drei Türen gleichzeitig**. Ein Regel-Lebenszyklus, drei Konsumenten. Die „eine Quelle, drei Sichten"-Architektur (C1) macht den Loop erst billig — ohne sie müsste man drei Regelsätze getrennt pflegen.

## Bestand (kein Start bei null)
- `docs/active/checker-feedback.md` — FP-Log + Prozess (GitHub-Issue-Templates).
- `src/lib/benchmark/` — 49-Repo-Benchmark (Precision-Messung).
- `docs/active/checker-design-patterns.md` — P1–P10 strukturelle Checker-Fehlertypen.
- Komitee-Framework — `committee-review.ts`, `generate-agents.ts`.
- Audit-DB — `audit_findings.status` + `not_relevant_reason` (Rohsignal vorhanden).

**Was fehlt:** der *geschlossene Kreis* (Signal → Triage → Gate → Ship), das Reifegrad-Feld auf Regeln, die Pro-Regel-Metrik-Aggregation, das Golden-Set.

## Konsequenzen

**Positiv:** Determinismus bleibt; Score wird über Zeit präziser; eine Investition verbessert drei Produkte; neue Regeln risikofrei (Shadow); Komitee als skalierbare Regel-F&E.
**Negativ/Risiken:** Daten-Motor braucht **echte Nutzung** → FP/Fix-Aggregation startet erst mit Beta-Usern (CLAUDE.md gated Automatisierung ab 10 Beta-Usern). Golden-Set-Pflege ist Handarbeit. Reifegrad-Feld erzwingt Migration + Score-Logik-Anpassung.

## Timing / Reihenfolge
- **Sofort baubar (ohne User):** Reifegrad-Feld auf Regeln + `experimental`-Ausschluss aus dem Score · Benchmark-Regressions-Gate als CI-Schritt · Golden-Set anlegen.
- **Mit Beta-Nutzung:** Pro-Regel-FP/Fix-Aggregation + Dashboard + „Finding falsch?"-Button-Auswertung.
- **Mit Komitee-Kapazität:** periodische Regel-Reviews (Triage), neue-Regel-Vorschläge.

Bauen erst, wenn an der Reihe (Pivot-Disziplin) — vermutlich nach C2 (Komitee-Kuration des Korpus), da C2 dieselbe Komitee-Maschinerie etabliert, die hier die Regel-F&E übernimmt.

## Related ADRs
- **ADR-021** — Prompt-Veredler (dritter Konsument desselben Korpus).
- **ADR-029** — Audit-Kategorie 27 (neue Regeln entstehen auch hier).
- **C1-Spec** — Konventions-Regelkorpus (die geteilte Quelle).
