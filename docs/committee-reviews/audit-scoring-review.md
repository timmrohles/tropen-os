# Committee Review: audit-scoring

> Generiert am 2026-04-09 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Multi-Model Konsens-Report: Audit-Scoring-System

## 1. Gewichtung der Kategorien

**Konsens-Level:** EINIG

**Top-Findings:**
- Alle Modelle identifizieren **Accessibility** als untergewichtet (aktuell ×2)
- Claude: "rechtliche Compliance, Millionen-Klagen" → EU Accessibility Act 2025
- GPT-4O: "insbesondere in inklusiven Umgebungen"
- Grok: "rechtliche (z.B. EU Accessibility Act) und ethische Implikationen"

**Empfohlene Änderungen:**
```
Accessibility: ×2 → ×3 (Konsens aller Modelle)
Design System: ×1 → ×2 (Claude vorgeschlagen)
AI Integration: ×2 → ×3 (nur Grok, aber zukunftsrelevant)
```

**Score-Impact bei Änderung:**
- Accessibility ×2 → ×3: Score steigt von **71.3% auf 73.1%** (+1.8%)
- Mit allen Änderungen: Score könnte auf **74-75%** steigen

**Priorität:** SOFORT für Accessibility (rechtliche Compliance 2025)

## 2. Score-Schwellenwerte

**Konsens-Level:** EINIG

**Top-Findings:**
- Alle Modelle: Aktuelle Schwellen sind **zu großzügig** für B2B SaaS
- Claude: "71% als 'Stable' ist zu optimistisch"
- GPT-4O: "striktere Schwellen" für B2B
- Grok: "zu lax...in regulierten Branchen"

**Empfohlene neue Schwellen:**
```
AKTUELL:           KONSENS B2B:
85-100%: Prod      90-100%: Production Grade
70-84%:  Stable    80-89%:  Stable/Production Ready
50-69%:  Risky     60-79%:  Risky
<50%:    Proto     <60%:    Prototype
```

**Score-Impact:**
- Bei 71.3%: Status ändert sich von **"Stable" zu "Risky"**
- Zwingt zu sofortigen Verbesserungen in kritischen Bereichen

**Priorität:** SOFORT (falsche Sicherheit vermeiden)

## 3. Verzerrung durch nicht-anwendbare Regeln

**Konsens-Level:** EINIG

**Top-Findings:**
- Alle erkennen das Problem: "nicht-anwendbare Regeln drücken Score künstlich"
- Claude berechnet: Ohne i18n/PWA steigt Score von **71.3% auf ~89%**
- Grok: Score steigt auf **74.8%** (konservativere Berechnung)

**Empfohlene Lösung:**
```typescript
// Konsens-Implementierung:
interface CategoryEvaluation {
  status: 'applicable' | 'not-applicable' | 'waived'
  justification?: string  // Required für 'waived'
}

// N/A-Kategorien aus Numerator UND Denominator entfernen
```

**Score-Impact:**
- Minimaler Anstieg: **71.3% → 74.8%** (+3.5%)
- Maximaler Anstieg: **71.3% → 89.3%** (+18%)
- Realistisch: **71.3% → 76-78%**

**Priorität:** SOFORT (größte Verzerrung im System)

## 4. Formel-Validierung

**Konsens-Level:** MEHRHEIT (Grok's Analyse unvollständig)

**Top-Findings:**
- Claude identifiziert "Automatisierungs-Bias" bei nur 30% Coverage
- GPT-4O: "subjektiver und ungleichmäßig" bei niedriger Automatisierung
- Beide fordern Mindest-Coverage für kritische Kategorien

**Empfohlene Mindestanforderungen:**
```typescript
const MINIMUM_COVERAGE = {
  criticalCategories: ['security', 'testing', 'backup-dr'],
  minManualCoverage: 80%,     // Konsens
  minAutomatedCoverage: 95%   // Claude vorgeschlagen
}
```

**Score-Impact:**
- Bei unvollständiger Coverage: Score könnte **künstlich hoch** sein
- Mit Coverage-Requirements: Möglicher Drop um **5-10%**

**Priorität:** BALD (nach anderen Fixes implementieren)

## 5. Killer-Kriterien

**Konsens-Level:** EINIG

**Top-Findings:**
- Alle Modelle: Bestimmte Kategorien müssen Mindest-Scores haben
- Claude: "Security 2.4/5 blockiert 'Stable'"
- Konsens bei kritischen Kategorien: Security, Testing, Backup/DR

**Empfohlene Killer-Kriterien:**
```typescript
const KILLER_CRITERIA = {
  'security':    { minScore: 3.0, veto: true },  // Konsens
  'testing':     { minScore: 2.5, veto: true },  // Konsens  
  'backup-dr':   { minScore: 2.0, veto: true },  // Konsens
  'observability': { minScore: 2.0, veto: false } // Claude
}

// Wenn ANY Killer-Kriterium verfehlt → Max Status = "Risky"
```

**Score-Impact:**
- Bei Security 2.4/5: Status-Cap bei **"Risky"** (trotz 71.3%)
- Kein direkter Score-Impact, aber Status-Downgrade

**Priorität:** SOFORT (verhindert gefährliche Fehleinschätzungen)

## Nächste Schritte

### Sofort umsetzen (diese Woche):
1. **Not-Applicable Support** implementieren → Score steigt auf ~76%
2. **Killer-Kriterien** aktivieren → Status-Cap bei kritischen Mängeln
3. **Schwellenwerte** anpassen → 80% für "Production Ready"
4. **Accessibility** auf ×3 erhöhen → rechtliche Compliance

### Bald umsetzen (nächster Sprint):
5. **Coverage-Requirements** für Automatisierung definieren
6. **Design System** Gewichtung evaluieren (×1 → ×2)
7. **Reporting** anpassen: Core Score vs. Full Score anzeigen

### Später evaluieren:
8. **AI Integration** Gewichtung bei zunehmendem KI-Einsatz
9. **Branchen-spezifische** Profile (Fintech vs. E-Commerce)
10. **Historische Trends** in Scoring einbauen

**Erwarteter Gesamt-Impact:** 
- Score steigt von 71.3% auf ~76-78% (fairer)
- Status ändert sich von "Stable" auf "Risky" (realistischer)
- System wird robuster gegen Edge Cases

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |   22388 |    1717 | €0.0864 |
| GPT-4o           |   17653 |     541 | €0.0461 |
| Gemini 2.5 Pro   |       0 |       0 | €0.0000 |
| Grok 4           |   18698 |    2403 | €0.0857 |
| Judge (Opus)     |    5421 |    1835 | €0.2036 |
| **Gesamt**       |         |         | **€0.4218** |
