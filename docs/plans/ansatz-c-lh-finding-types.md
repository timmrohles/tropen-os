# Sprint: Ansatz C — LH Finding-Typen

**Status:** Backlog — nächster Sprint nach Dogfeeding-Abschluss  
**Scope:** C-eng (nur Lighthouse/Performance), C-breit als Follow-up  
**Priorität:** Hoch — strukturelle Voraussetzung für valide Scores und Beta-Einladungen  
**Erstellt:** 2026-04-23

---

## Hintergrund

Lighthouse-Audits sind strukturell drei verschiedene Typen, die aktuell alle gleich behandelt werden:

| Typ | Beispiele | Handlungsoption |
|---|---|---|
| **Metrik** | LCP, FCP, TTI, TBT, Speed Index, FID, CLS | Keine — Messwert, Ergebnis anderer Issues |
| **Opportunity** | Reduce unused JS, Legacy JS, Avoid redirects | Ja — konkreter Fix mit Est. Savings |
| **Diagnostic** | Render Blocking, Server Latency, bfcache, Forced Reflow | Nein — Plattform/Framework-Verhalten |

**Problem heute:** Alle drei Typen bekommen einen Fix-Prompt-Button und fließen gleich in den Score ein. Metriken wie "Time to Interactive — 3.9 s" mit Fix-Button untergraben das Vertrauen in echte Opportunities.

**Konkrete Auswirkung:** Pro Audit-Run entstehen ~57 LH-Findings (31 Plattform-Grenze, 20 Architektur-Backlog, 6 Phantom) die manuell dismissed werden müssen. Ohne Ansatz C: Dauerschleife von dismiss → neuer Run → dismiss.

---

## 1. Scope und betroffene Dateien

### Checker
- `src/lib/audit/checkers/external-tools-checker.ts` — LH-Findings werden hier extrahiert und als `Finding[]` zurückgegeben; hier wird `lh_type` hinzugefügt
- `src/lib/audit/types.ts` — `Finding`-Interface um `lhType?: 'metric' | 'opportunity' | 'diagnostic'` erweitern

### Datenbank
- Migration: `audit_findings.lh_type VARCHAR(20) NULL` — nur für `agent_source = 'lighthouse-performance'` gesetzt
- Backfill bestehender Findings (Migration-Skript)

### Scoring
- `src/lib/audit/checkers/external-tools-checker.ts` — Scoring-Logik: nur Opportunities zählen
- `src/lib/audit/rule-registry.ts` — `cat-7-rule-1` erhält `enforcement: 'advisory'` für Metriken/Diagnostics

### UI
- `src/app/[locale]/(app)/audit/_components/FindingsTable.tsx` — Rendering nach `lh_type` trennen
- `src/app/[locale]/(app)/audit/_components/Top5FindingsCards.tsx` — Metriken und Diagnostics ausschließen
- `src/lib/audit/group-findings.ts` — Gruppierung berücksichtigt `lh_type`
- `src/lib/audit/finding-recommendations.ts` — Recommendations nur für Opportunities

---

## 2. Schritt-für-Schritt-Plan

### Schritt 1 — DB-Migration (30 min)

```sql
-- Migration: 20260501000XXX_audit_findings_lh_type.sql
ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS lh_type VARCHAR(20)
    CHECK (lh_type IN ('metric', 'opportunity', 'diagnostic'));

-- Index für Finder-Queries
CREATE INDEX IF NOT EXISTS idx_audit_findings_lh_type
  ON audit_findings (lh_type)
  WHERE lh_type IS NOT NULL;
```

**Backfill bestehender Findings:**
```sql
UPDATE audit_findings SET lh_type = 'metric'
WHERE agent_source = 'lighthouse-performance'
  AND (
    message ILIKE '%largest contentful paint%' OR
    message ILIKE '%first contentful paint%' OR
    message ILIKE '%time to interactive%' OR
    message ILIKE '%total blocking time%' OR
    message ILIKE '%speed index%' OR
    message ILIKE '%cumulative layout shift%' OR
    message ILIKE '%max potential first input%' OR
    message ILIKE '%first input delay%'
  );

UPDATE audit_findings SET lh_type = 'diagnostic'
WHERE agent_source = 'lighthouse-performance'
  AND lh_type IS NULL
  AND (
    message ILIKE '%render blocking%' OR
    message ILIKE '%document request latency%' OR
    message ILIKE '%network dependency tree%' OR
    message ILIKE '%back/forward cache%' OR
    message ILIKE '%forced reflow%' OR
    message ILIKE '%minimize main-thread work%' OR
    message ILIKE '%reduce javascript execution time%' OR
    message ILIKE '%reduce initial server response%'
  );

UPDATE audit_findings SET lh_type = 'opportunity'
WHERE agent_source = 'lighthouse-performance'
  AND lh_type IS NULL
  AND message ILIKE '%est savings%';

-- Rest: opportunity (hat direkten Fix-Pfad)
UPDATE audit_findings SET lh_type = 'opportunity'
WHERE agent_source = 'lighthouse-performance'
  AND lh_type IS NULL;
```

### Schritt 2 — Classifier im Checker (45 min)

In `external-tools-checker.ts` eine Klassifizierungsfunktion hinzufügen:

```typescript
// Kanonische LH Audit-IDs → Typ-Mapping
const LH_METRICS = new Set([
  'first-contentful-paint', 'largest-contentful-paint', 'interactive',
  'total-blocking-time', 'speed-index', 'cumulative-layout-shift',
  'max-potential-fid', 'first-input-delay',
])

const LH_DIAGNOSTICS = new Set([
  'render-blocking-resources', 'server-response-time', 'critical-request-chains',
  'redirects', 'bf-cache', 'forced-reflow', 'mainthread-work-breakdown',
  'bootup-time', 'network-rtt', 'network-server-latency',
])

function classifyLhFinding(auditId: string): 'metric' | 'opportunity' | 'diagnostic' {
  if (LH_METRICS.has(auditId)) return 'metric'
  if (LH_DIAGNOSTICS.has(auditId)) return 'diagnostic'
  return 'opportunity'  // default: alles mit Est. Savings + actionable Audits
}
```

Findings werden beim Erstellen mit `lhType` annotiert; der Typ wird in die DB geschrieben.

### Schritt 3 — Scoring-Anpassung (30 min)

Nur Opportunities beeinflussen den `cat-7-rule-1`-Score:

```typescript
// In extractLighthouseFindings():
const opportunities = findings.filter(f => f.lhType === 'opportunity')
const score = calculateScoreFromOpportunities(opportunities)
// Metriken und Diagnostics → separates Datenobjekt, kein Score-Impact
```

Metriken bekommen `enforcement: 'advisory'` und fließen nicht in `Σ(rule_score × weight)` ein.

### Schritt 4 — UI-Änderungen (2–3 Sessions)

**FindingsTable.tsx** — drei Render-Pfade:
- `lh_type = 'metric'` → kompakte KPI-Leiste: großer Messwert + Score-Ampel, kein Fix-Button
- `lh_type = 'opportunity'` → `RecommendationCard` wie heute (Fix-Prompt, Est. Savings prominent)
- `lh_type = 'diagnostic'` → collapsible Info-Section, kein Fix-Button, Info-Icon statt Warning

**Top5FindingsCards.tsx** — nur Opportunities in Top-5-Impact-Ranking.

**group-findings.ts** — `lh_type` als Sortier- und Gruppierungskriterium.

---

## 3. Auswirkungen auf das Scoring-Modell

### Was sich ändert

`cat-7-rule-1` (LH Performance) wird nur noch auf Basis von **Opportunities** bewertet:

| Heute | Nach Ansatz C |
|---|---|
| Alle LH-Findings (Metriken + Opportunities + Diagnostics) → Score | Nur Opportunities → Score |
| ~17 Findings pro Audit-Run beeinflussen Score | ~4–6 Findings (echte Opportunities) |
| Phantom-Findings und Plattform-Grenzen drücken Score | Nur actionable Issues drücken Score |

### Erwartete Score-Veränderung (49 Benchmark-Repos)

**Vorsichtige Schätzung:** +2 bis +5 Prozentpunkte für Repos mit LH-Runs.

Begründung:
- Metriken und Diagnostics machen ~65% aller LH-Findings aus (31+6 von 57 in dieser Session)
- Wenn 65% der Findings nicht mehr in den Score eingehen, verbessert sich `cat-7-rule-1` von typisch Score 2-3 auf 3-4
- `cat-7-rule-1` hat `weight: 2` (mittel) — Gesamtauswirkung auf 100%-Score: ca. +1–3pp pro Repo

**Re-Baselining erforderlich:**
Nach Ansatz C müssen die 49 Benchmark-Repos neu gescannt werden. Die neue Baseline wird höher liegen — das ist korrekt, weil der alte Score Platform-Noise enthielt. In `docs/audit-reports/benchmark-2026-04-17-v8-full.json` dokumentieren, dass v8 und v9 nicht direkt vergleichbar sind.

**Eigener Score (Prodify):**
Aktuell 94.7% (2026-04-22). Nach Ansatz C erwartet: +1–2pp durch sauberere LH-Bewertung. Ziel 97% rückt näher.

### Was sich NICHT ändert

- Andere Kategorien (Security, Architecture, Code Quality) bleiben unverändert
- Opportunity-Findings (Reduce unused CSS, Legacy JS) bleiben im Score — sie sind real
- Das Gewichtungsmodell bleibt identisch

---

## 4. Migration bestehender Findings

Bestehende `audit_findings` in der DB bekommen `lh_type` per Backfill-Migration:

1. **Dismissed Findings** (`status = 'dismissed'`): Backfill für Protokoll, kein Score-Impact
2. **Open Findings** (`status = 'open'`): Backfill + Neubewertung ob Score-Anpassung nötig
3. **Fixed Findings** (`status = 'fixed'`): Nur Backfill, keine weitere Aktion

**Vorgehen:**
- Backfill-Migration läuft einmalig als SQL (Schritt 1)
- Neue Findings ab diesem Sprint bekommen `lh_type` automatisch vom Checker
- Kein Re-Scoring bestehender Runs — historische Scores bleiben unverändert

---

## 5. Tests die mitgeschrieben werden müssen

```
src/lib/audit/checkers/__tests__/lh-classifier.unit.test.ts
```

| Test | Was geprüft wird |
|---|---|
| `classifyLhFinding('largest-contentful-paint')` → `'metric'` | Alle 8 bekannten Metriken |
| `classifyLhFinding('render-blocking-resources')` → `'diagnostic'` | Alle 8 bekannten Diagnostics |
| `classifyLhFinding('unused-javascript')` → `'opportunity'` | Default-Fallback |
| `classifyLhFinding('unbekannte-audit-id')` → `'opportunity'` | Unbekannte IDs = opportunity (safe default) |
| Score-Berechnung: nur Opportunities → Score | Metriken und Diagnostics haben Score-Impact = 0 |
| Backfill-Query: Findings korrekt klassifiziert | Gegen Fixtures aus echten LH-Runs |

Zusätzlich: Snapshot-Test der UI-Render-Pfade (metric/opportunity/diagnostic) per Vitest.

---

## 6. Grobe Zeit-Schätzung

### C-eng (nur Lighthouse/Performance) — empfohlener erster Schritt

| Aufgabe | Zeit |
|---|---|
| DB-Migration + Backfill | 30 min |
| Classifier in Checker | 45 min |
| Scoring-Anpassung | 30 min |
| UI (FindingsTable, Top5, group-findings) | 3–4h |
| Tests | 1h |
| Benchmark-Neuscan (49 Repos) + Dokumentation | 1–2h |
| **Gesamt C-eng** | **~1,5 Sessions** |

### C-breit (alle external-tool-Kategorien als Follow-up)

Erweitert Ansatz C auf: A11y (axe-core), SEO, gitleaks, depcruise, Bundle-Analyzer.
Gleiche Klassifizierungslogik, mehr Kategorien.

| **Gesamt C-breit** | **+1–2 Sessions zusätzlich** |

---

## Entscheidungen die vor Start zu klären sind

1. **Metriken in `audit_findings` behalten oder eigene Tabelle?**  
   Empfehlung: In `audit_findings` behalten (nur `lh_type`-Feld) — weniger Migration, gleiche Abfragen.

2. **UI für Metriken: KPI-Leiste oder eigener Tab?**  
   Empfehlung: Kompakte KPI-Leiste direkt über der Opportunities-Liste — kein eigener Tab.

3. **Diagnostics anzeigen oder komplett ausblenden?**  
   Empfehlung: Collapsible "Kontext & Diagnostics"-Section am Ende der Performance-Kategorie.

4. **C-eng oder direkt C-breit?**  
   Empfehlung: C-eng zuerst, C-breit nach erstem User-Feedback.

---

## Abhängigkeiten

- **Score-Transparenz-Feature** (noch nicht geplant): würde von `lh_type` profitieren
- **Finding-Gruppierung Insight 4** (aus Findings-UX-Cluster): koexistiert, kein Konflikt
- **Benchmark-Neuscan**: muss nach Ansatz C laufen, bevor v9-Baseline publiziert wird
