# Repo Map Kalibrierung — Komitee-Review

**Datum:** 2024-12-19
**Modelle:** Claude Sonnet, GPT-4o, Gemini 2.5 Pro
**Judge:** Claude Opus

---

## Problem 1: Rank-Score Kalibrierung

**Konsens:** MEHRHEIT
**Kernerkenntnis:** Die aktuellen Rank-Scores (0.017-0.080) sind zu niedrig für die Schwelle von 0.8 im Risk Assessor. Die Modelle erkennen ein Skalierungsproblem, unterscheiden sich aber in der Ursachenanalyse.

### Analyse
**Einig:** Alle drei Modelle identifizieren das Missverhältnis zwischen erwarteten (>0.8) und tatsächlichen (max 0.080) Scores als Kernproblem.

**Unterschiedlich:** 
- Claude Sonnet sieht einen Bug in der Normalisierung und präferiert echte 0-1 Skalierung
- GPT-4o und Gemini 2.5 Pro bevorzugen relative Schwellen (Top N%)
- Gemini vermutet die Normalisierung funktioniert bereits, aber die Werte stimmen nicht überein

### Empfohlene Lösung
Relative Top-N% Schwelle im Risk Assessor implementieren. Dies ist robuster gegenüber verschiedenen Score-Verteilungen und erfordert keine Änderung des Ranking-Algorithmus.

### Code-Änderung
```typescript
// In risk-assessor.ts, assessRisk() erweitern:
function assessRisk(finding: Finding, repoMap: RepoMap): RiskAssessment {
  // Berechne Top 10% Schwelle
  const sortedSymbols = [...repoMap.rankedSymbols]
    .sort((a, b) => b.rankScore - a.rankScore);
  const topIndex = Math.ceil(sortedSymbols.length * 0.1);
  const topThreshold = sortedSymbols[topIndex - 1]?.rankScore ?? 0;
  
  // Prüfe ob betroffenes Symbol hochrangig ist
  const affectedSymbol = repoMap.rankedSymbols.find(
    s => s.filePath === finding.filePath && 
    s.name === extractSymbolName(finding)
  );
  
  if (affectedSymbol?.rankScore >= topThreshold && affectedSymbol.exported) {
    score += 15;
    reasons.push('High-ranked exported symbol (Top 10%)');
  }
}
```

---

## Problem 2: Token-Budget

**Konsens:** EINIG
**Kernerkenntnis:** Das statische Budget von 2048 Tokens ist für größere Projekte unzureichend. Alle Modelle empfehlen dynamische Anpassung basierend auf Projektgröße.

### Analyse
**Einig:** 
- 2048 Tokens reichen nicht für 615 Dateien / 2628 Symbole
- Dynamisches Budget basierend auf Projektgröße ist die Lösung
- Maximum sollte Context-Limits berücksichtigen (4 Modelle × 4K = 16K)

**Unterschiedlich:** Nur kleine Variations in der konkreten Formel und Implementierung.

### Empfohlene Lösung
Dynamisches Token-Budget mit Presets und Auto-Modus. Formel berücksichtigt Dateianzahl mit ~6-7 Tokens pro Datei als Richtwert.

### Code-Änderung
```typescript
// In types.ts erweitern:
export interface RepoMapOptions {
  tokenBudget?: number | 'auto' | 'small' | 'medium' | 'large'
}

// In map-compressor.ts neue Funktion:
function calculateTokenBudget(
  budget: number | string | undefined,
  totalFiles: number
): number {
  if (typeof budget === 'number') return budget;
  
  switch (budget) {
    case 'small': return 2048;
    case 'medium': return 4096;
    case 'large': return 8192;
    case 'auto':
    default:
      // ~6-7 Tokens pro Datei
      if (totalFiles < 100) return 2048;
      if (totalFiles < 300) return 4096;
      if (totalFiles < 600) return 6144;
      return 8192;
  }
}

// In compressToTokenBudget() erste Zeile:
const actualBudget = calculateTokenBudget(
  tokenBudget, 
  repoMap.stats.totalFiles
);
```

---

## Problem 3: Fehlende Symbole

**Konsens:** GESPALTEN
**Kernerkenntnis:** Wichtige Funktionen wie `generateText` und `runAudit` fehlen in Top 30, aber die Ursache ist umstritten.

### Analyse
**Einig:** Die wichtigen API-Funktionen sollten höher gerankt sein.

**Unterschiedlich:**
- Claude Sonnet: Kombination aus niedrigem referenceCount und fehlender Entry-Point-Erkennung
- GPT-4o: Re-exports werden nicht korrekt als Referenzen gezählt
- Gemini 2.5 Pro: referenceCount wird zu stark gewichtet gegenüber anderen Faktoren

### Empfohlene Lösung
Entry-Point-Erkennung für API-Funktionen implementieren und referenceCount-Gewichtung abschwächen. Dies adressiert die wahrscheinlichsten Ursachen.

### Code-Änderung
```typescript
// In graph-ranker.ts erweitern:
function detectEntryPoint(sym: RepoSymbol, filePath: string): boolean {
  // API Routes
  if (filePath.includes('/api/') && sym.kind === 'function' && sym.exported) {
    return true;
  }
  
  // Bekannte Entry-Point Namen
  const entryPoints = [
    'generateText', 'streamText', 'runAudit', 
    'generateRepoMap', 'createClient'
  ];
  return entryPoints.includes(sym.name) && sym.exported;
}

// In rankSymbols() anpassen:
for (const sym of file.symbols) {
  const exportBonus = sym.exported ? 2.0 : 1.0; // Erhöht von 1.5
  const kindWeight = KIND_WEIGHT[sym.kind] ?? 0.5;
  const entryPointBonus = detectEntryPoint(sym, file.path) ? 2.0 : 1.0;
  
  // Schwächere ref-Gewichtung
  const refBonus = 1 + (Math.sqrt(sym.referenceCount) * 0.5);
  
  sym.rankScore = fileRank * exportBonus * kindWeight * refBonus * entryPointBonus;
}
```

---

## Nächste Schritte

1. **Risk Assessor Update:** Top 10% relative Schwelle implementieren und mit aktuellen Repo-Maps testen
2. **Token Budget:** Auto-Modus mit dynamischer Berechnung einführen, Default auf 'auto' setzen
3. **Ranking Verbesserung:** Entry-Point-Erkennung implementieren und referenceCount-Gewichtung anpassen, dann Top 30 validieren

---

## Kosten des Komitee-Runs

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    5854 |    1626 | €0.0390 |
| GPT-4o           |    4564 |     790 | €0.0180 |
| Gemini 2.5 Pro   |    5228 |    2045 | €0.0251 |
| Grok 4           |    5260 |    2898 | €0.0551 |
| Judge (Opus)     |    5280 |    1914 | €0.2072 |
| **Gesamt**       |         |         | **€0.3443** |

> Generiert am 2026-04-09T14:31:29.426Z · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus
