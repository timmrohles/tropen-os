# Score-Aussagekraft-Diagnose 2026-05-04

> **Datum:** 2026-05-04
> **Anlass:** Score-Stabilität trotz drei Severity-Verschärfungen (+0.1 statt erwarteter -2.5) wirft Aussagekraft-Frage auf
> **Methode:** Drei diagnostische Tests — strikt ohne Fixes oder Score-Formel-Anpassungen
> **Score-Berechnung lokalisiert:** `src/lib/audit/scoring/score-calculator.ts` — gewichteter Mittelwert: `Σ(rule.score × rule.weight) / Σ(5 × rule.weight) × 100`. totalWeightedMax = 1495 Punkte.

---

## Test 1 — Bottom-Range-Test

### Datenbasis
- **380 Benchmark-Runs** in Supabase (49 Repos × ~7 Runs)
- Benchmark-Repos: Lovable, Bolt, Cursor, Manual-Auswahl

### Score-Verteilung

| Bracket | Repos |
|---------|-------|
| 0–60%   | 4 |
| 60–70%  | 11 |
| **70–80%** | **235 (62%)** |
| 80–90%  | 130 (34%) |
| 90–95%  | 0 |
| 95–100% | 0 |

**Min:** 47.9% (dexoryn/lovable-AI-Agent) · **Max:** 87.8% (nemanjam/nextjs-prisma-boilerplate)  
**Avg:** 77.9% · **Median:** 78.1%

### Tropen OS im Vergleich
- Tropen OS: **96.7%** — **9pp über dem besten Benchmark-Repo**
- Kein einziges Benchmark-Repo liegt über 90%
- Tropen OS besetzt die oberen 12% der Skala **allein**

### Diagnose: **C** — Score ist im oberen Drittel verklemmt (für alle außer Tropen OS)

Die effektive Skala für echte Repos liegt zwischen **47.9%–87.8%**. Alles darüber ist strukturell leer. Der Score unterscheidet gut zwischen 70% und 88%, aber nicht oberhalb davon.

---

## Test 2 — Severity-Verteilung

### Tropen OS — offene Findings (aktuell)
Daten aus der letzten Supabase-Abfrage (alle offenen Findings über alle Runs):

| Severity | Findings |
|----------|---------|
| high | 835 |
| medium | 108 |
| low | 52 |
| critical | 5 |

### Tropen OS — Kategorie-Breakdown (letzter Run)

13 von 26 Kategorien auf **100%**. Die restlichen 13 haben folgende Scores:
- Architektur: 89.3%, State Management: 86.7%, Namenskonventionen: 80%
- Code-Qualität: 96%, Datenschutz: 95.6%, Observability: 95.4%
- Testing: 93.3%, CI/CD: 94.7%, Infrastructure: 90%

### Diagnose: **Severity-Konzentration auf high** (nicht auf low/info wie vermutet)

Entgegen der ursprünglichen Hypothese ist `high` die dominante Severity (835 von ~1000 offenen Findings). Das bedeutet: die Severity-Gewichtung ist nicht das Problem — das Problem liegt woanders.

---

## Test 3 — Score-Formel-Analyse

### Formel
```
score_category = Σ(rule.score × rule.weight) / Σ(5 × rule.weight) × 100
score_overall  = Σ(cat.weightedScore) / Σ(cat.weightedMax) × 100
```
- Weights: 1, 2, oder 3 pro Regel
- Rule-Score: 0–5 (manuell = null, wird excludiert)
- totalWeightedMax Tropen OS: **1495 Punkte** (147 auto-Regeln)
- Complexity-Factor: für kleine Repos (<100 Dateien)
- Killer-Criteria: Security <60%, Testing <50%, Backup <40% → cap auf "risky"

### Sensitivitäts-Test: Was kostet eine Regel-Verschlechterung?

| Änderung | Gewicht | Score-Verlust |
|----------|---------|--------------|
| Regel 5→3 | w=1 | 0.134% |
| Regel 5→3 | w=2 | 0.268% |
| Regel 5→3 | w=3 | 0.401% |
| 5 high-Findings → Regel 4→2 | w=2 | 0.268% |
| 10 Regeln gleichzeitig 5→3 | w=1-3 | ~1.5–3.0% |

**Sensitivitäts-Diagnose:** Einzelne Regel-Verschlechterungen sind nahezu unsichtbar. Erst wenn **10+ Regeln** gleichzeitig schlechter werden, bewegt sich der Score um >1%.

### Warum hat heute der Komitee-Apply kaum bewegt?
- Empfehlung 3 (Stufung): cat-25-rule-2 von score=4 → score=2. Gewicht=2, Differenz=2. Einfluss: 0.268%. IaC-Fix (+0.134%) kompensierte teilweise. Netto: +0.1%.
- Das entspricht exakt der Formel.

---

## Beobachtungen — übergreifend

### Beobachtung 1 — Skalen-Kompression im oberen Bereich
Der effektive Score-Bereich für echte Repos liegt bei **48%–88%**. Die oberen 12% (88%–100%) sind strukturell leer bei Benchmark-Repos. Tropen OS besetzt diesen Bereich allein — weil es mit den eigenen Regeln optimiert wurde (Dogfooding-Vorteil). Der Score diskriminiert gut zwischen 70% und 88%, aber nicht im "Production Grade"-Bereich oberhalb von 90%.

### Beobachtung 2 — Verdünnungs-Effekt durch large Denominator
totalWeightedMax = 1495 ist sehr groß. Eine einzelne Regel macht maximal 0.4% aus. Das ist mathematisch korrekt (viele Regeln → stabiler Score), aber aus Coaching-Perspektive problematisch: Ein echter Sicherheitsfehler in einer Route produziert 0.27% Score-Delta. Das wirkt irrelevant — und ist es, im Score.

### Beobachtung 3 — Ceiling-Problem bei gut strukturierten Next.js-Apps
13 von 26 Kategorien sind bei 100%. Gut strukturierte Next.js+Supabase-Apps treffen viele Rules automatisch: Git Governance, KI-Code-Hygiene, Dependency Management, Design System etc. sind strukturell "umsonst" erreichbar. Das bedeutet: die Differenzierung findet in ~13 Kategorien statt, nicht in allen 26.

---

## Hypothesen

### Hypothese A — Score ist ein "Engagement-Barometer", kein Qualitäts-Barometer
Der Score misst nicht "wie gut ist der Code" sondern "wie viele unserer Kategorien hat dieses Repo überhaupt berücksichtigt". Ein Repo mit CI/CD, Tests, Backups, RLS und Doku kann leicht 85%+ erreichen — unabhängig von Code-Qualität.  
**Daten-Stütze:** Benchmark-Median 78% bei repos die keinen Audit-Checker kennen.  
**Testbar durch:** Repos mit sehr schlechtem Code aber allen Infrastruktur-Features scannen.

### Hypothese B — Zu viele "Always-Pass"-Regeln verwässern Diskriminierung
13/26 Kategorien auf 100% bedeutet: die Hälfte der Scoring-Kapazität ist verschwendet bei gut strukturierten Repos. Die Differenzierung ist auf ~50% der möglichen Punkte komprimiert.  
**Daten-Stütze:** totalWeightedMax=1495, aber die Hälfte der Punkte sind bei Tropen OS "safe".  
**Testbar durch:** Anteil der Regeln mit score=5 bei Tropen OS quantifizieren vs. Benchmark-Repos.

### Hypothese C — Vibe-Coder-Repos stagnieren bei 78% weil Infra-Features fehlen (nicht Code)
Der Benchmark-Median von 78% bei Lovable/Bolt-Repos könnte weniger an Code-Qualität liegen als an fehlenden Infrastruktur-Merkmalen (CI/CD, Backup, IaC). Das würde bedeuten: Tropen OS hebt Vibe-Coder auf 85%+ nicht durch Code-Fixes, sondern durch Infra-Setup-Empfehlungen.  
**Daten-Stütze:** Bottom-Repos bei 47.9%–65% sind Lovable-Snippets ohne CI/CD/Tests/Backup.  
**Testbar durch:** Severity-Breakdown der Bottom-20-Repos nach Kategorie.

---

## Empfehlungen für Folge-Sprint (KEINE UMSETZUNG IN DIESEM SPRINT)

1. **Score-Kalibrierung** — Tropen OS-Score gegen Benchmark-Top-5 normalisieren: statt 96.7% vs. 87.8% sollte Tropen OS ~10pp besser sein, nicht 9pp über dem maximalen Benchmark. Entweder Regeln hinzufügen die Tropen OS wirklich trifft, oder Scoring-Weights für Infra-Kategorien anpassen. Aufwand grob: ~2–3h Analyse + 1–2h Implementierung.

2. **"Always-Pass"-Kategorien identifizieren** — Welche der 13 100%-Kategorien sind für Vibe-Coder-Repos auch 100%? Falls Benchmark-Repos ebenfalls 100% haben: diese Kategorien aus dem Differenzierungs-Score rausrechnen oder schärfere Regeln hinzufügen. Aufwand: ~1h Analyse.

3. **Score-Sensitivitäts-Anpassung** — Killer-Criteria ausweiten: statt nur Security/Testing/Backup auch Code-Qualität und API-Design als Killer-Criteria mit niedrigem Threshold hinzufügen. Damit können auch mittlere Kategorien den Status cappen. Aufwand: ~30 Min.

4. **Vibe-Coder-Spezifische Score-Relativierung in der UI** — Statt absoluten 96.7% zeigen: "Top X% aller gescannten Repos" (bereits vorhanden) + "Kategorie-Breakdown: wo du über Benchmark-Median liegst". Gibt dem Score mehr Coach-Bedeutung. Aufwand: ~2–4h UI.

---

## Zusammenfassung

| Diagnose | Befund |
|----------|--------|
| Score-Range Benchmarks | 47.9%–87.8% (40pp Spanne) |
| Tropen OS | 96.7% (9pp über Benchmark-Max) |
| Effektive Differenzierungs-Zone | 70%–88% |
| Sensitivität einzelne Regel | 0.13%–0.40% |
| "Always-Pass"-Kategorien | 13/26 (50%) |
| Score bei Tropen OS | korrekt berechnet, aber strukturell überhöht durch Dogfooding-Vorteil |

**Kern-Befund:** Der Score ist **intern konsistent** (Formel korrekt, Severity-Weights wirken wie berechnet), aber **extern nicht kalibriert** (Tropen OS liegt strukturell außerhalb des Benchmark-Bereichs). Für Vibe-Coder-Nutzer ist der Score aussagekräftig im Bereich 50%–90% — dort, wo echte Repos leben. Der "Production Grade"-Bereich über 90% ist durch den derzeitigen Regelsatz für typische Repos faktisch unerreichbar.

> **Update 2026-05-04:** Score-Architektur-Pivot zu Killer-Kriterien beschlossen. Komitee-Output: `docs/audit-reports/killer-kriterien-komitee-2026-05-04.md`
