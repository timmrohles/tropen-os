# Committee Review: repo-map

> Generiert am 2026-04-13 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Konsens-Bericht: Repo Map Generator Pipeline

## 1. RANKING-ALGORITHMUS QUALITÄT
**Konsens-Level:** EINIG  
**Top-Empfehlung:** Wechsel von multiplikativer zu additiver Formel mit logarithmischer Dämpfung für Reference-Counts  
**Nächster Schritt:** Implementiere additive Scoring-Formel mit Min-Max-Normalisierung

### Empfohlene Formel (Konsens aller Modelle):
```typescript
function improvedRankingScore(sym: RepoSymbol, fileScore: number): number {
  // Additive statt multiplikative Formel
  const baseScore = fileScore * 0.4  // File-Wichtigkeit
  const exportBonus = sym.exported ? 0.3 : 0
  const kindBonus = KIND_WEIGHTS[sym.kind] * 0.2
  const refBonus = Math.log1p(sym.referenceCount) * 0.1  // Log dämpft Outlier
  const entryBonus = isEntryPoint(sym) ? 0.2 : 0
  
  return baseScore + exportBonus + kindBonus + refBonus + entryBonus
}

// Min-Max Normalisierung (nicht Division durch max)
function normalizeScores(symbols: RepoSymbol[]): void {
  const scores = symbols.map(s => s.rankScore)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = Math.max(max - min, 0.001)
  
  symbols.forEach(s => {
    s.rankScore = (s.rankScore - min) / range
  })
}
```

## 2. REFERENCE ANALYSIS — VOLLSTÄNDIGKEIT
**Konsens-Level:** EINIG  
**Top-Empfehlung:** TypeScript Language Service API nutzen für präzise Re-Export-Erkennung  
**Nächster Schritt:** `findAllReferences` API integrieren mit Fallback auf manuelle Re-Export-Pattern

```typescript
// Konsens-Implementierung für Re-Export-Tracking
function analyzeWithLanguageService(files: RepoFile[], rootPath: string): ReferenceResult {
  const program = ts.createProgram(filePaths, compilerOptions)
  const langService = ts.createLanguageService({
    getScriptFileNames: () => filePaths,
    getScriptVersion: () => "0",
    getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(fileContents[fileName]),
    getCurrentDirectory: () => rootPath,
    getCompilationSettings: () => compilerOptions
  })
  
  // Nutze findAllReferences für präzise Zählung inkl. Re-Exports
  for (const symbol of allSymbols) {
    const refs = langService.findReferences(symbol.filePath, symbol.position)
    symbol.referenceCount = refs?.length ?? 0
  }
}
```

## 3. BROWSER-SCAN QUALITÄT
**Konsens-Level:** EINIG  
**Top-Empfehlung:** In-Memory Cross-File-Analysis mit virtualem Dateisystem  
**Nächster Schritt:** AST-basierte Import-Resolution ohne Disk-Reads implementieren

### In-Memory Cross-File-Analysis (Konsens):
```typescript
function generateRepoMapFromFilesV2(
  files: Array<{path: string; content: string}>,
  options: RepoMapOptions = {}
): Promise<RepoMap> {
  // 1. Parse alle Files zu ASTs
  const parsedFiles = files.map(f => ({
    ...f,
    ast: ts.createSourceFile(f.path, f.content, ts.ScriptTarget.Latest)
  }))
  
  // 2. Baue virtuelles Dateisystem
  const fileMap = new Map(files.map(f => [f.path, f.content]))
  
  // 3. Analysiere Imports mit Path-Resolution
  const dependencies: FileDependency[] = []
  for (const file of parsedFiles) {
    const imports = extractImportsFromAST(file.ast)
    for (const imp of imports) {
      const resolvedPath = resolveImportPath(imp.path, file.path, fileMap)
      if (resolvedPath) {
        dependencies.push({
          source: file.path,
          target: resolvedPath,
          symbols: imp.symbols
        })
      }
    }
  }
  
  // 4. Nutze dependencies für PageRank
  return generateRepoMapInternal(parsedFiles, dependencies, options)
}
```

## 4. TOKEN-BUDGET STRATEGIE
**Konsens-Level:** MEHRHEIT  
**Top-Empfehlung:** Knapsack-Algorithmus statt Greedy für optimale Token-Nutzung  
**Nächster Schritt:** Dynamische Programmierung mit Symbol-Gruppen implementieren

## 5. SKALIERUNG UND PERFORMANCE
**Konsens-Level:** EINIG  
**Top-Empfehlung:** AST-Caching mit File-Hash-basierter Invalidierung  
**Nächster Schritt:** LRU-Cache für geparste ASTs implementieren

## 6. MULTI-LANGUAGE SUPPORT
**Konsens-Level:** EINIG  
**Top-Empfehlung:** Noch nicht priorisieren — erst TS/JS perfektionieren  
**Nächster Schritt:** Interface vorbereiten, aber keine Implementierung

## 7. INTEGRATION UND DISTRIBUTION
**Konsens-Level:** MEHRHEIT  
**Top-Empfehlung:** MCP-Resource API mit async Job-Queue  
**Nächster Schritt:** REST-API-Wrapper um bestehende Funktionen

## 8. QUALITÄTSMESSUNG
**Konsens-Level:** EINIG  
**Top-Empfehlung:** Precision@K Metriken mit manuell kuratierten Test-Repos  
**Nächster Schritt:** Benchmark-Suite mit 5 Open-Source-Projekten erstellen

---

## ARCHITEKTUR-KONSENS

### Bester Architektur-Vorschlag (Hybrid-Ansatz):
1. **Core bleibt TypeScript Compiler API** (zero deps, präzise)
2. **Language Service für Reference-Analysis** (Re-Exports, präzise Counts)
3. **In-Memory Graph für Browser-Scans** (keine Qualitätsverluste)
4. **Additives Ranking mit HITS-inspirierten Scores** (breitere Verteilung)

### 3-Stufen-Plan mit Aufwand:

**Stufe 1: Quick Wins (1-2 Wochen)**
- Additive Ranking-Formel implementieren (2 Tage)
- AST-Caching mit File-Hashing (3 Tage)
- Basic Re-Export-Pattern-Erkennung (3 Tage)
- *Impact: 30-40% besseres Ranking*

**Stufe 2: Core-Verbesserungen (3-4 Wochen)**
- Language Service Integration (1 Woche)
- In-Memory Browser-Scan (1 Woche)
- Knapsack Token-Budget (3 Tage)
- Benchmark-Suite (3 Tage)
- *Impact: weitere 40-50% Qualität*

**Stufe 3: Skalierung (4-6 Wochen)**
- Worker-Thread-Parallelisierung (1 Woche)
- MCP-API mit Job-Queue (1 Woche)
- HITS-Algorithmus (optional, 1 Woche)
- *Impact: 5-10x Performance*

### Größter Quick Win:
**Additive Ranking-Formel** — 2 Tage Arbeit, sofort 30%+ bessere Score-Verteilung

---

## WARNUNGEN

### Over-Engineering-Ris

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |   14118 |    2048 | €0.0680 |
| GPT-4o           |   10890 |     953 | €0.0342 |
| Gemini 2.5 Pro   |   12972 |    2044 | €0.0341 |
| Grok 4           |   11724 |    2869 | €0.0727 |
| Judge (Opus)     |    6692 |    2048 | €0.2362 |
| **Gesamt**       |         |         | **€0.4452** |
